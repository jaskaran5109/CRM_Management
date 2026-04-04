import express from "express";
import User from "../models/User.js";
import UserRole from "../models/UserRole.js";
import { protect, adminOnly } from "../middleware/auth.js";
import Status from "../models/Status.js";
import mongoose from "mongoose";

const router = express.Router();

// @route GET /api/users  — Admin: get all users with filtering/sorting/pagination
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const {
      search,
      role,
      status,
      page = 1,
      limit = 100,
      sort = "createdAt",
      order = "desc",
    } = req.query;

    const query = {};

    if (search) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: regex },
        { email: regex },
        { role: regex },
      ];
    }

    if (role) {
      query.role = role;
    }

    if (status) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortObj = { [sort]: order === "asc" ? 1 : -1 };

    const [users, total] = await Promise.all([
      User.find(query)
        .populate("userRole", "name")
        .populate("status", "name")
        .select("-password")
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(query),
    ]);

    res.json({
      users,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    console.error("GET /api/users error", err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/users/bulk
// @desc    Bulk create users (Admin only)
// @access  Private/Admin
router.post("/bulk", protect, adminOnly, async (req, res) => {
  const { users } = req.body;

  // -----------------------------
  // 1️⃣  VALIDATION
  // -----------------------------
  if (!users || !Array.isArray(users) || users.length === 0) {
    return res
      .status(400)
      .json({ message: "Invalid payload. Provide a non‑empty 'users' array." });
  }

  // Check for duplicate emails **within** the request
  const emailsInRequest = users.map((u) => u.email);
  const duplicates = emailsInRequest.filter(
    (email, idx) => emailsInRequest.indexOf(email) !== idx,
  );
  if (duplicates.length > 0) {
    return res.status(400).json({
      message: `Duplicate emails found in request: ${[...new Set(duplicates)].join(", ")}`,
    });
  }

  // -----------------------------
  // 2️⃣  CHECK FOR EXISTING EMAILS IN DB
  // -----------------------------
  const existingEmails = await User.find(
    { email: { $in: emailsInRequest } },
    "email",
  );
  if (existingEmails.length > 0) {
    const taken = existingEmails.map((u) => u.email);
    return res.status(400).json({
      message: `These emails are already registered: ${taken.join(", ")}`,
    });
  }

  // -----------------------------
  // 3️⃣  START TRANSACTION
  // -----------------------------
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const createdUsers = [];
    const userCountBefore = await User.countDocuments({}, { session }); // To decide first‑user‑admin

    for (let index = 0; index < users.length; index++) {
      const userData = users[index];

      // ---- Mandatory fields ----
      if (!userData.name || !userData.email || !userData.password) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          message: `User at index ${index}: name, email & password are required.`,
        });
      }

      // ---- Password length ----
      if (userData.password.length < 6) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          message: `User at index ${index}: Password must be ≥6 characters.`,
        });
      }

      // ---- Validate STATUS (if provided) ----
      let validatedStatus = null;
      if (userData.status) {
        if (!mongoose.Types.ObjectId.isValid(userData.status)) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            message: `User at index ${index}: Invalid status ID.`,
          });
        }

        const statusExists = await Status.findById(userData.status, null, {
          session,
        });
        if (!statusExists) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            message: `User at index ${index}: Status not found.`,
          });
        }
        validatedStatus = userData.status;
      }

      // ---- ROLE LOGIC (identical to /signup) ----
      // • If DB is empty → FIRST user becomes ADMIN
      // • Otherwise → all new users are "user"
      const role = userCountBefore === 0 && index === 0 ? "admin" : "user";

      // ---- CREATE USER (pre‑save hook hashes password) ----
      const newUser = new User({
        name: userData.name,
        email: userData.email,
        password: userData.password, // ← hashed automatically by UserSchema pre('save')
        role,
        status: validatedStatus,
        phoneNumber: userData.phoneNumber || "",
      });

      await newUser.save({ session }); // Save inside transaction

      // Prepare safe response (NO password!)
      createdUsers.push({
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      });
    }

    // ✅ COMMIT TRANSACTION
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: `Successfully created ${createdUsers.length} user(s).`,
      users: createdUsers,
    });
  } catch (err) {
    // ❌ ROLLBACK on any error
    await session.abortTransaction();
    session.endSession();
    console.error("🔴 Bulk user upload error:", err);
    res
      .status(500)
      .json({ message: "Server error during bulk upload", error: err.message });
  }
});

// @route PUT /api/users/:id/role  — Admin: change user role
router.put("/:id/role", protect, adminOnly, async (req, res) => {
  try {
    const { role, userRoles, status } = req.body;

    const updateData = {};

    if (role) {
      updateData.role = role;
    }

    if (userRoles !== undefined && !Array.isArray(userRoles)) {
      return res.status(400).json({ message: "userRoles must be an array" });
    }

    if (Array.isArray(userRoles)) {
      const roles = await UserRole.find({ _id: { $in: userRoles } });

      if (roles.length !== userRoles.length) {
        return res.status(400).json({ message: "Invalid userRoles" });
      }

      updateData.userRole = userRoles;
    }

    if (status !== undefined) {
      if (status === null || status === "") {
        updateData.status = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(status)) {
          return res.status(400).json({ message: "Invalid status id" });
        }

        const statusExists = await Status.findById(status);
        if (!statusExists) {
          return res.status(400).json({ message: "Status not found" });
        }

        updateData.status = status;
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    })
      .populate("userRole", "name")
      .populate("status", "name")
      .select("-password");

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// @route PUT /api/users/:id  — Admin: update user details
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const { name, email, role, userRoles, status, phoneNumber } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Email is invalid" });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const updateData = { name, email };

    if (phoneNumber !== undefined) {
      if (phoneNumber && !/^[0-9]{10}$/.test(phoneNumber)) {
        return res.status(400).json({ message: "Phone number must be 10 digits" });
      }
      updateData.phoneNumber = phoneNumber || "";
    }

    if (role && !["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (status !== undefined && status !== "" && status !== null) {
      if (!mongoose.Types.ObjectId.isValid(status)) {
        return res.status(400).json({ message: "Invalid status id" });
      }
      const statusExists = await Status.findById(status);
      if (!statusExists) {
        return res.status(400).json({ message: "Status not found" });
      }
      updateData.status = status;
    } else if (status === "" || status === null) {
      updateData.status = null;
    }

    if (userRoles !== undefined && !Array.isArray(userRoles)) {
      return res.status(400).json({ message: "userRoles must be an array" });
    }

    if (Array.isArray(userRoles)) {
      const roles = await UserRole.find({ _id: { $in: userRoles } });
      if (roles.length !== userRoles.length) {
        return res.status(400).json({ message: "Some userRoles are invalid" });
      }
      updateData.userRole = userRoles;
    }

    if (role) {
      updateData.role = role;
    }

    // Handle status update
    if (status !== undefined) {
      if (status === null || status === "") {
        updateData.status = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(status)) {
          return res.status(400).json({ message: "Invalid status id" });
        }
        const statusExists = await Status.findById(status);
        if (!statusExists) {
          return res.status(400).json({ message: "Status not found" });
        }
        updateData.status = status;
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    })
      .populate("userRole", "name")
      .populate("status", "name")
      .select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// @route DELETE /api/users/:id  — Admin: delete user
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin")
      return res.status(400).json({ message: "Cannot delete an admin user" });

    await user.deleteOne();
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

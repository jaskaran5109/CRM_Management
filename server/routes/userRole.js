import express from "express";
import mongoose from "mongoose";
import UserRole from "../models/UserRole.js";
import Status from "../models/Status.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// ✅ GET ALL USER ROLES
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const userRoles = await UserRole.find()
      .populate("status", "name")
      .sort({ createdAt: -1 });

    res.json(userRoles);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ CREATE SINGLE USER ROLE
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { name, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "User role name is required" });
    }

    const trimmedName = name.trim();

    const exists = await UserRole.findOne({ name: trimmedName });
    if (exists) {
      return res.status(400).json({ message: "User role already exists" });
    }

    let validatedStatus = null;

    if (status) {
      if (!mongoose.Types.ObjectId.isValid(status)) {
        return res.status(400).json({ message: "Invalid status id" });
      }

      const statusExists = await Status.findById(status);
      if (!statusExists) {
        return res.status(400).json({ message: "Status not found" });
      }

      validatedStatus = status;
    }

    const userRole = await UserRole.create({
      name: trimmedName,
      status: validatedStatus,
    });

    const populatedUserRole = await UserRole.findById(userRole._id).populate(
      "status",
      "name"
    );

    res.status(201).json(populatedUserRole);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ CREATE MULTIPLE USER ROLES (BATCH)
router.post("/bulk", protect, adminOnly, async (req, res) => {
  try {
    const { userRoles, status } = req.body;

    if (!Array.isArray(userRoles) || userRoles.length === 0) {
      return res.status(400).json({ message: "User roles array is required" });
    }

    let validatedStatus = null;

    if (status) {
      if (!mongoose.Types.ObjectId.isValid(status)) {
        return res.status(400).json({ message: "Invalid status id" });
      }

      const statusExists = await Status.findById(status);
      if (!statusExists) {
        return res.status(400).json({ message: "Status not found" });
      }

      validatedStatus = status;
    }

    const cleaned = [
      ...new Set(userRoles.map((ur) => ur.trim()).filter(Boolean)),
    ];

    const existing = await UserRole.find({ name: { $in: cleaned } });
    const existingNames = existing.map((e) => e.name);

    const newUserRoles = cleaned.filter((name) => !existingNames.includes(name));

    if (newUserRoles.length === 0) {
      return res.status(400).json({ message: "All user roles already exist" });
    }

    const created = await UserRole.insertMany(
      newUserRoles.map((name) => ({
        name,
        status: validatedStatus,
      }))
    );

    const createdIds = created.map((item) => item._id);

    const populatedCreated = await UserRole.find({
      _id: { $in: createdIds },
    })
      .populate("status", "name")
      .sort({ createdAt: -1 });

    res.status(201).json(populatedCreated);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ UPDATE USER ROLE
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const { name, status } = req.body;

    const userRole = await UserRole.findById(req.params.id);
    if (!userRole) {
      return res.status(404).json({ message: "User role not found" });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ message: "User role name is required" });
      }

      const trimmedName = name.trim();

      const duplicate = await UserRole.findOne({
        name: trimmedName,
        _id: { $ne: req.params.id },
      });

      if (duplicate) {
        return res.status(400).json({ message: "User role already exists" });
      }

      userRole.name = trimmedName;
    }

    if (status !== undefined) {
      if (status === null || status === "") {
        userRole.status = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(status)) {
          return res.status(400).json({ message: "Invalid status id" });
        }

        const statusExists = await Status.findById(status);
        if (!statusExists) {
          return res.status(400).json({ message: "Status not found" });
        }

        userRole.status = status;
      }
    }

    const updated = await userRole.save();
    const populatedUpdated = await UserRole.findById(updated._id).populate(
      "status",
      "name"
    );

    res.json(populatedUpdated);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ DELETE USER ROLE
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const userRole = await UserRole.findById(req.params.id);

    if (!userRole) {
      return res.status(404).json({ message: "User role not found" });
    }

    await userRole.deleteOne();

    res.json({ message: "User role deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
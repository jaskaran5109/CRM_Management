import express from "express";
import mongoose from "mongoose";
import Status from "../models/Status.js";
import UserRole from "../models/UserRole.js";
import RoleStatus from "../models/RoleStatus.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// GET ALL ROLE STATUSES
router.get("/", protect, async (req, res) => {
  try {
    let query = {};

    // if (!req.user.isAdmin) {
    //   const userRoleId = req.user.userRole?._id || req.user.userRole;
    //   query.userRole = userRoleId;
    // }

    const roleStatuses = await RoleStatus.find(query)
      .populate("userRole", "name")
      .populate("status", "name")
      .populate("nextRoles", "name")
      .sort({ createdAt: -1 });

    res.json(roleStatuses);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// CREATE SINGLE ROLE STATUS
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { name, userRole, status, nextRoles } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    if (!userRole || !mongoose.Types.ObjectId.isValid(userRole)) {
      return res.status(400).json({ message: "Valid user role is required" });
    }

    if (!status || !mongoose.Types.ObjectId.isValid(status)) {
      return res.status(400).json({ message: "Valid status is required" });
    }

    const userRoleExists = await UserRole.findById(userRole);
    if (!userRoleExists) {
      return res.status(404).json({ message: "User role not found" });
    }

    const statusExists = await Status.findById(status);
    if (!statusExists) {
      return res.status(404).json({ message: "Status not found" });
    }

    let validatedNextRoles = [];

    if (Array.isArray(nextRoles) && nextRoles.length > 0) {
      for (const roleId of nextRoles) {
        if (!mongoose.Types.ObjectId.isValid(roleId)) {
          return res.status(400).json({ message: "Invalid next role id" });
        }

        const exists = await UserRole.findById(roleId);
        if (!exists) {
          return res.status(400).json({ message: "Next role not found" });
        }

        validatedNextRoles.push(roleId);
      }
    }

    const exists = await RoleStatus.findOne({
      name: name.trim(),
      userRole,
      status,
      nextRoles: validatedNextRoles,
    });

    if (exists) {
      return res.status(400).json({ message: "Role status already exists" });
    }

    const roleStatus = await RoleStatus.create({
      name: name.trim(),
      userRole,
      status,
    });

    const populated = await RoleStatus.findById(roleStatus._id)
      .populate("userRole", "name")
      .populate("status", "name")
      .populate("nextRoles", "name");

    res.status(201).json(populated);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Role status already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// CREATE MULTIPLE ROLE STATUSES
router.post("/bulk", protect, adminOnly, async (req, res) => {
  try {
    const { roleStatuses } = req.body;

    if (!Array.isArray(roleStatuses) || roleStatuses.length === 0) {
      return res
        .status(400)
        .json({ message: "roleStatuses array is required" });
    }

    const cleaned = roleStatuses
      .map((item) => ({
        name: item?.name?.trim(),
        userRole: item?.userRole,
        status: item?.status,
      }))
      .filter((item) => item.name && item.userRole && item.status);

    if (cleaned.length === 0) {
      return res
        .status(400)
        .json({ message: "No valid role statuses provided" });
    }

    for (const item of cleaned) {
      if (!mongoose.Types.ObjectId.isValid(item.userRole)) {
        return res
          .status(400)
          .json({ message: `Invalid user role id for ${item.name}` });
      }

      if (!mongoose.Types.ObjectId.isValid(item.status)) {
        return res
          .status(400)
          .json({ message: `Invalid status id for ${item.name}` });
      }
    }

    const userRoleIds = [...new Set(cleaned.map((item) => item.userRole))];
    const statusIds = [...new Set(cleaned.map((item) => item.status))];

    const userRolesFound = await UserRole.find({ _id: { $in: userRoleIds } });
    if (userRolesFound.length !== userRoleIds.length) {
      return res
        .status(400)
        .json({ message: "One or more user roles are invalid" });
    }

    const statusesFound = await Status.find({ _id: { $in: statusIds } });
    if (statusesFound.length !== statusIds.length) {
      return res
        .status(400)
        .json({ message: "One or more statuses are invalid" });
    }

    const uniqueMap = new Map();

    for (const item of cleaned) {
      const key = `${item.name.toLowerCase()}-${item.userRole}-${item.status}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    }

    const uniqueDocs = [...uniqueMap.values()];

    const orConditions = uniqueDocs.map((item) => ({
      name: item.name,
      userRole: item.userRole,
      status: item.status,
    }));

    const existing = await RoleStatus.find({ $or: orConditions });
    const existingSet = new Set(
      existing.map(
        (item) =>
          `${item.name.toLowerCase()}-${item.userRole.toString()}-${item.status.toString()}`,
      ),
    );

    const newDocs = uniqueDocs.filter((item) => {
      const key = `${item.name.toLowerCase()}-${item.userRole}-${item.status}`;
      return !existingSet.has(key);
    });

    if (newDocs.length === 0) {
      return res
        .status(400)
        .json({ message: "All role statuses already exist" });
    }

    const created = await RoleStatus.insertMany(newDocs);

    const createdIds = created.map((item) => item._id);
    const populatedCreated = await RoleStatus.find({ _id: { $in: createdIds } })
      .populate("userRole", "name")
      .populate("status", "name")
      .populate("nextRoles", "name")
      .sort({ createdAt: -1 });

    res.status(201).json(populatedCreated);
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ message: "Some role statuses already exist" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// GROUP UPDATE ROLE STATUSES
router.put("/group-update", protect, adminOnly, async (req, res) => {
  try {
    const { ids, names, userRole, status, nextRoles } = req.body;

    // ─── VALIDATIONS ─────────────────────────────

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids array is required" });
    }

    if (!Array.isArray(names) || names.length === 0) {
      return res.status(400).json({ message: "names array is required" });
    }

    if (!userRole || !mongoose.Types.ObjectId.isValid(userRole)) {
      return res.status(400).json({ message: "Valid user role is required" });
    }

    if (!status || !mongoose.Types.ObjectId.isValid(status)) {
      return res.status(400).json({ message: "Valid status is required" });
    }

    for (const id of ids) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res
          .status(400)
          .json({ message: "Invalid role status id in ids array" });
      }
    }

    // ─── VALIDATE nextRoles ✅ ─────────────────────

    let validatedNextRoles = [];

    if (Array.isArray(nextRoles) && nextRoles.length > 0) {
      for (const roleId of nextRoles) {
        if (!mongoose.Types.ObjectId.isValid(roleId)) {
          return res.status(400).json({ message: "Invalid next role id" });
        }

        const roleExists = await UserRole.findById(roleId);
        if (!roleExists) {
          return res.status(400).json({ message: "Next role not found" });
        }

        validatedNextRoles.push(roleId);
      }
    }

    // ─── EXISTENCE CHECKS ─────────────────────────

    const userRoleExists = await UserRole.findById(userRole);
    if (!userRoleExists) {
      return res.status(404).json({ message: "User role not found" });
    }

    const statusExists = await Status.findById(status);
    if (!statusExists) {
      return res.status(404).json({ message: "Status not found" });
    }

    const existingDocs = await RoleStatus.find({ _id: { $in: ids } });

    if (existingDocs.length !== ids.length) {
      return res
        .status(400)
        .json({ message: "Some role status records were not found" });
    }

    // ─── CLEAN NAMES ─────────────────────────────

    const cleanedNames = [
      ...new Set(names.map((name) => name?.trim()).filter(Boolean)),
    ];

    if (cleanedNames.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one valid name is required" });
    }

    // ─── DUPLICATE CHECK ─────────────────────────

    const duplicatesOutsideGroup = await RoleStatus.find({
      _id: { $nin: ids },
      userRole,
      status,
      name: { $in: cleanedNames },
    });

    if (duplicatesOutsideGroup.length > 0) {
      const duplicateNames = [
        ...new Set(duplicatesOutsideGroup.map((d) => d.name)),
      ];
      return res.status(400).json({
        message: `Duplicate role status exists for: ${duplicateNames.join(", ")}`,
      });
    }

    // ─── UPDATE / CREATE ─────────────────────────

    const existingByName = new Map();
    existingDocs.forEach((doc) => {
      existingByName.set(doc.name.toLowerCase(), doc);
    });

    const finalDocIds = [];

    for (const name of cleanedNames) {
      const key = name.toLowerCase();

      if (existingByName.has(key)) {
        const doc = existingByName.get(key);

        doc.name = name;
        doc.userRole = userRole;
        doc.status = status;
        doc.nextRoles = validatedNextRoles; // ✅ IMPORTANT

        await doc.save();
        finalDocIds.push(doc._id);
      } else {
        const created = await RoleStatus.create({
          name,
          userRole,
          status,
          nextRoles: validatedNextRoles, // ✅ IMPORTANT
        });

        finalDocIds.push(created._id);
      }
    }

    // ─── DELETE UNUSED ───────────────────────────

    const finalDocIdsSet = new Set(finalDocIds.map((id) => id.toString()));

    const idsToDelete = existingDocs
      .filter((doc) => !finalDocIdsSet.has(doc._id.toString()))
      .map((doc) => doc._id);

    if (idsToDelete.length > 0) {
      await RoleStatus.deleteMany({ _id: { $in: idsToDelete } });
    }

    // ─── RESPONSE ───────────────────────────────

    const updatedGroup = await RoleStatus.find({
      _id: { $in: finalDocIds },
    })
      .populate("userRole", "name")
      .populate("status", "name")
      .populate("nextRoles", "name") // ✅ NEW
      .sort({ createdAt: 1 });

    res.json(updatedGroup);
  } catch (err) {
    console.error("GROUP UPDATE ERROR:", err);

    if (err.code === 11000) {
      return res.status(400).json({ message: "Duplicate role status found" });
    }

    res.status(500).json({ message: err.message || "Server error" });
  }
});

// UPDATE SINGLE ROLE STATUS
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const { name, userRole, status, nextRoles } = req.body;

    const roleStatus = await RoleStatus.findById(req.params.id);
    if (!roleStatus) {
      return res.status(404).json({ message: "Role status not found" });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    if (!userRole || !mongoose.Types.ObjectId.isValid(userRole)) {
      return res.status(400).json({ message: "Valid user role is required" });
    }

    if (!status || !mongoose.Types.ObjectId.isValid(status)) {
      return res.status(400).json({ message: "Valid status is required" });
    }

    let validatedNextRoles = [];

    if (Array.isArray(nextRoles) && nextRoles.length > 0) {
      for (const roleId of nextRoles) {
        if (!mongoose.Types.ObjectId.isValid(roleId)) {
          return res.status(400).json({ message: "Invalid next role id" });
        }

        const exists = await UserRole.findById(roleId);
        if (!exists) {
          return res.status(400).json({ message: "Next role not found" });
        }

        validatedNextRoles.push(roleId);
      }
    }

    const userRoleExists = await UserRole.findById(userRole);
    if (!userRoleExists) {
      return res.status(404).json({ message: "User role not found" });
    }

    const statusExists = await Status.findById(status);
    if (!statusExists) {
      return res.status(404).json({ message: "Status not found" });
    }

    const duplicate = await RoleStatus.findOne({
      name: name.trim(),
      userRole,
      status,
      _id: { $ne: req.params.id },
    });

    if (duplicate) {
      return res.status(400).json({ message: "Role status already exists" });
    }

    roleStatus.name = name.trim();
    roleStatus.userRole = userRole;
    roleStatus.status = status;
    roleStatus.nextRoles = validatedNextRoles;

    const updated = await roleStatus.save();

    const populatedUpdated = await RoleStatus.findById(updated._id)
      .populate("userRole", "name")
      .populate("status", "name")
      .populate("nextRoles", "name");

    res.json(populatedUpdated);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Role status already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/group-delete", protect, adminOnly, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids array is required" });
    }

    for (const id of ids) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res
          .status(400)
          .json({ message: `Invalid role status id: ${id}` });
      }
    }

    const existingDocs = await RoleStatus.find({ _id: { $in: ids } });

    if (existingDocs.length !== ids.length) {
      return res.status(400).json({
        message: "Some role status records were not found",
      });
    }

    await RoleStatus.deleteMany({ _id: { $in: ids } });

    res.json({
      message: "Role status group deleted successfully",
      deletedIds: ids,
    });
  } catch (err) {
    console.error("GROUP DELETE ERROR:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});
// DELETE ROLE STATUS
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const roleStatus = await RoleStatus.findById(req.params.id);

    if (!roleStatus) {
      return res.status(404).json({ message: "Role status not found" });
    }

    await roleStatus.deleteOne();

    res.json({ message: "Role status deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

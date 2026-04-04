import express from "express";
import mongoose from "mongoose";
import CXModel from "../models/CXModel.js";
import Status from "../models/Status.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// ✅ GET ALL CX MODELS
router.get("/", protect, async (req, res) => {
  try {
    const cxModels = await CXModel.find()
      .populate("status", "name")
      .sort({ createdAt: -1 });

    res.json(cxModels);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ CREATE SINGLE CX MODEL
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { name, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "CX model name is required" });
    }

    const trimmedName = name.trim();

    const exists = await CXModel.findOne({ name: trimmedName });
    if (exists) {
      return res.status(400).json({ message: "CX model already exists" });
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

    const cxModel = await CXModel.create({
      name: trimmedName,
      status: validatedStatus,
    });

    const populatedCxModel = await CXModel.findById(cxModel._id).populate(
      "status",
      "name",
    );

    res.status(201).json(populatedCxModel);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ CREATE MULTIPLE CX MODELS (BATCH)
router.post("/bulk", protect, adminOnly, async (req, res) => {
  try {
    const { cxModels, status } = req.body;

    if (!Array.isArray(cxModels) || cxModels.length === 0) {
      return res.status(400).json({ message: "CX models array is required" });
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
      ...new Set(cxModels.map((ur) => ur.trim()).filter(Boolean)),
    ];

    const existing = await CXModel.find({ name: { $in: cleaned } });
    const existingNames = existing.map((e) => e.name);

    const newCxModels = cleaned.filter((name) => !existingNames.includes(name));

    if (newCxModels.length === 0) {
      return res.status(400).json({ message: "All CX models already exist" });
    }

    const created = await CXModel.insertMany(
      newCxModels.map((name) => ({
        name,
        status: validatedStatus,
      })),
    );

    const createdIds = created.map((item) => item._id);

    const populatedCreated = await CXModel.find({
      _id: { $in: createdIds },
    })
      .populate("status", "name")
      .sort({ createdAt: -1 });

    res.status(201).json(populatedCreated);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ UPDATE CX MODEL
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const { cxModel, status } = req.body;

    const cxModelNew = await CXModel.findById(req.params.id);
    if (!cxModelNew) {
      return res.status(404).json({ message: "CX model not found" });
    }

    if (cxModel !== undefined) {
      if (!cxModel.trim()) {
        return res.status(400).json({ message: "CX model name is required" });
      }

      const trimmedName = cxModel.trim();

      const duplicate = await CXModel.findOne({
        name: trimmedName,
        _id: { $ne: req.params.id },
      });

      if (duplicate) {
        return res.status(400).json({ message: "CX model already exists" });
      }

      cxModel.name = trimmedName;
    }

    if (status !== undefined) {
      if (status === null || status === "") {
        cxModelNew.status = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(status)) {
          return res.status(400).json({ message: "Invalid status id" });
        }

        const statusExists = await Status.findById(status);
        if (!statusExists) {
          return res.status(400).json({ message: "Status not found" });
        }

        cxModelNew.status = status;
      }
    }

    const updated = await cxModelNew.save();
    const populatedUpdated = await CXModel.findById(updated._id).populate(
      "status",
      "name",
    );

    res.json(populatedUpdated);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ DELETE CX MODEL
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const cxModel = await CXModel.findById(req.params.id);

    if (!cxModel) {
      return res.status(404).json({ message: "CX model not found" });
    }

    await cxModel.deleteOne();

    res.json({ message: "CX model deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

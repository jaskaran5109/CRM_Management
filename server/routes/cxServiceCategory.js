import express from "express";
import mongoose from "mongoose";
import CXServiceCategory from "../models/CXServiceCategory.js";
import Status from "../models/Status.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// GET ALL CX SERVICE CATEGORIES
router.get("/", async (req, res) => {
  try {
    const cxModels = await CXServiceCategory.find()
      .populate("status", "name")
      .sort({ createdAt: -1 });

    res.json(cxModels);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// CREATE SINGLE CX SERVICE CATEGORY
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { name, status } = req.body;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ message: "CX service category name is required" });
    }

    const trimmedName = name.trim();

    const exists = await CXServiceCategory.findOne({
      name: { $regex: `^${trimmedName}$`, $options: "i" },
    });

    if (exists) {
      return res
        .status(400)
        .json({ message: "CX service category already exists" });
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

    const cxServiceCategory = await CXServiceCategory.create({
      name: trimmedName,
      status: validatedStatus,
    });

    const populatedCXServiceCategory = await CXServiceCategory.findById(
      cxServiceCategory._id,
    ).populate("status", "name");

    res.status(201).json(populatedCXServiceCategory);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// CREATE MULTIPLE CX SERVICE CATEGORIES (BATCH)
router.post("/bulk", protect, adminOnly, async (req, res) => {
  try {
    const { cxServiceCategories, status } = req.body;

    if (
      !Array.isArray(cxServiceCategories) ||
      cxServiceCategories.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "CX service categories array is required" });
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
      ...new Set(cxServiceCategories.map((item) => item.trim()).filter(Boolean)),
    ];

    const existing = await CXServiceCategory.find({
      name: { $in: cleaned },
    });

    const existingNamesLower = existing.map((item) => item.name.toLowerCase());

    const newCXServiceCategories = cleaned.filter(
      (name) => !existingNamesLower.includes(name.toLowerCase()),
    );

    if (newCXServiceCategories.length === 0) {
      return res
        .status(400)
        .json({ message: "All CX service categories already exist" });
    }

    const created = await CXServiceCategory.insertMany(
      newCXServiceCategories.map((name) => ({
        name,
        status: validatedStatus,
      })),
    );

    const createdIds = created.map((item) => item._id);

    const populatedCreated = await CXServiceCategory.find({
      _id: { $in: createdIds },
    })
      .populate("status", "name")
      .sort({ createdAt: -1 });

    res.status(201).json(populatedCreated);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const { name, status } = req.body;

    const cxServiceCategory = await CXServiceCategory.findById(req.params.id);

    if (!cxServiceCategory) {
      return res.status(404).json({ message: "CX service category not found" });
    }

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res
          .status(400)
          .json({ message: "CX service category name is required" });
      }

      const trimmedName = name.trim();

      const escapeRegex = (value) =>
        value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const duplicate = await CXServiceCategory.findOne({
        name: {
          $regex: `^${escapeRegex(trimmedName)}$`,
          $options: "i",
        },
        _id: { $ne: req.params.id },
      });

      if (duplicate) {
        return res
          .status(400)
          .json({ message: "CX service category already exists" });
      }

      cxServiceCategory.name = trimmedName;
    }

    if (status !== undefined) {
      if (status === null || status === "") {
        cxServiceCategory.status = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(status)) {
          return res.status(400).json({ message: "Invalid status id" });
        }

        const statusExists = await Status.findById(status);
        if (!statusExists) {
          return res.status(400).json({ message: "Status not found" });
        }

        cxServiceCategory.status = status;
      }
    }

    const updated = await cxServiceCategory.save();

    const populatedUpdated = await CXServiceCategory.findById(
      updated._id,
    ).populate("status", "name");

    res.json(populatedUpdated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// DELETE CX SERVICE CATEGORY
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const cxServiceCategory = await CXServiceCategory.findById(req.params.id);

    if (!cxServiceCategory) {
      return res.status(404).json({ message: "CX service category not found" });
    }

    await cxServiceCategory.deleteOne();

    res.json({ message: "CX service category deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

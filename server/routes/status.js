import express from "express";
import Status from "../models/Status.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();


// ✅ GET ALL STATUSES
router.get("/", async (req, res) => {
  try {
    const statuses = await Status.find().sort({ createdAt: -1 });
    res.json(statuses);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ CREATE SINGLE STATUS
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Status name is required" });
    }

    const exists = await Status.findOne({ name: name.trim() });
    if (exists) {
      return res.status(400).json({ message: "Status already exists" });
    }

    const status = await Status.create({
      name: name.trim()?.toUpperCase(),
    });

    res.status(201).json(status);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ CREATE MULTIPLE STATUSES (BATCH 🚀)
router.post("/bulk", protect, adminOnly, async (req, res) => {
  try {
    const { statuses } = req.body;

    if (!Array.isArray(statuses) || statuses.length === 0) {
      return res.status(400).json({ message: "Statuses array is required" });
    }

    // clean + remove duplicates
    const cleaned = [...new Set(statuses.map((s) => s.trim()).filter(Boolean))];

    // find existing ones
    const existing = await Status.find({ name: { $in: cleaned } });
    const existingNames = existing.map((e) => e.name);

    // filter new ones only
    const newStatuses = cleaned.filter(
      (name) => !existingNames.includes(name)
    );

    // insert only new ones
    const created = await Status.insertMany(
      newStatuses.map((name) => ({ name: name.toUpperCase() }))
    );

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ UPDATE STATUS
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Status name is required" });
    }

    const status = await Status.findById(req.params.id);
    if (!status) {
      return res.status(404).json({ message: "Status not found" });
    }

    status.name = name.trim()?.toUpperCase() || status.name;
    const updated = await status.save();

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ DELETE STATUS
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const status = await Status.findById(req.params.id);

    if (!status) {
      return res.status(404).json({ message: "Status not found" });
    }

    await status.deleteOne();

    res.json({ message: "Status deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
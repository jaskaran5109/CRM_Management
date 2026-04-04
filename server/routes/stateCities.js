import express from "express";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// ✅ GET ALL STATES OF INDIA
router.get("/", protect, async (req, res) => {
  try {
    const response = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ country: "India" }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ message: data.msg || "Failed to fetch states" });
    }

    res.json(data?.data?.states || []);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ GET CITIES BY STATE
router.get("/:state/cities", protect, async (req, res) => {
  try {
    const state = req.params.state?.trim();

    if (!state) {
      return res.status(400).json({ message: "State is required" });
    }

    const response = await fetch("https://countriesnow.space/api/v0.1/countries/state/cities", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        country: "India",
        state,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ message: data.msg || "Failed to fetch cities" });
    }

    res.json(data?.data || []);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
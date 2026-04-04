import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import {
  createPublicComplaint,
  trackComplaints,
  getPublicComplaintDetail,
  addPublicComment,
} from "../controllers/publicComplaintController.js";

const router = express.Router();

// Get directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "../uploads/complaints");

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "text/plain",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Allowed types: images, PDF, text`));
    }
  },
});

/**
 * POST /api/public/complaints
 * Create a new complaint (no authentication required)
 * Public endpoint
 */
router.post("/", upload.single("attachment"), createPublicComplaint);

/**
 * GET /api/public/complaints
 * Track complaints by phone and email (no authentication required)
 * Query params: customerPhone (required), customerEmail (optional)
 */
router.get("/", trackComplaints);

/**
 * GET /api/public/complaints/:id
 * Get complaint details and public comments (no authentication required)
 * Query params: customerPhone (required), customerEmail (optional)
 */
router.get("/:id", getPublicComplaintDetail);

/**
 * POST /api/public/complaints/:id/comments
 * Add public comment to complaint (no authentication required)
 * Body: { customerPhone, customerEmail, message }
 */
router.post("/:id/comments", addPublicComment);

export default router;

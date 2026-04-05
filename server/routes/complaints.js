import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import {
  createComplaint,
  listComplaints,
  getComplaint,
  updateComplaint,
  deleteComplaint,
  getComplaintHistory,
  getComplaintStats,
  addComplaintComment,
  getComplaintComments,
  assignComplaint,
  updateComplaintStatus,
} from "../controllers/complaintController.js";
import { protect } from "../middleware/auth.js";

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
    files: 5, // Max 5 files
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `File type ${file.mimetype} not allowed. Allowed types: images, PDF, Word, Excel, text`
        )
      );
    }
  },
});

// All routes require authentication
router.use(protect);

/**
 * CREATE - POST /api/complaints
 * Create new complaint with optional file attachments
 * Body: { title, description, category, priority, status, assignedTo, slaDeadline, ...dynamicFields }
 * Files: up to 5 files (5MB each)
 */
router.post("/", upload.array("attachments", 5), createComplaint);

/**
 * READ - GET /api/complaints
 * List all complaints with filtering, pagination, sorting
 * Query params:
 *   - page: number (default: 1)
 *   - limit: number (default: 10, max: 100)
 *   - sortBy: 'createdAt' | 'priority' | 'status' | 'title' (default: createdAt)
 *   - order: 'asc' | 'desc' (default: desc)
 *   - status: comma-separated statuses (e.g., 'open,in_progress')
 *   - priority: comma-separated priorities (e.g., 'high,medium')
 *   - category: comma-separated categories
 *   - assignedTo: user ID
 *   - createdBy: user ID
 *   - search: search text (searches title, description, category)
 *   - startDate: ISO date string
 *   - endDate: ISO date string
 */
router.get("/", listComplaints);

/**
 * READ - GET /api/complaints/stats
 * Get complaint statistics
 * Query params:
 *   - startDate: ISO date string
 *   - endDate: ISO date string
 */
router.get("/stats", getComplaintStats);

/**
 * READ - GET /api/complaints/:id
 * Get single complaint with history
 */
router.get("/:id", getComplaint);

/**
 * READ - GET /api/complaints/:id/history
 * Get complaint change history
 */
router.get("/:id/history", getComplaintHistory);

/**
 * UPDATE - PATCH /api/complaints/:id
 * Update complaint fields (partial update)
 * Body: { title?, description?, category?, priority?, status?, assignedTo?, slaDeadline?, addInternalNote?, ...dynamicFields }
 */
router.patch("/:id", updateComplaint);

/**
 * DELETE - DELETE /api/complaints/:id
 * Delete complaint
 */
router.delete("/:id", deleteComplaint);

/**
 * POST - POST /api/complaints/:id/assign
 * Assign complaint to a user
 * Body: { assignedToUserId }
 */
router.post("/:id/assign", assignComplaint);

/**
 * PATCH - PATCH /api/complaints/:id/status
 * Update complaint status
 * Body: { status: 'pending' | 'in_progress' | 'resolved' }
 */
router.patch("/:id/status", updateComplaintStatus);

/**
 * GET - GET /api/complaints/:id/comments
 * Get comments on complaint
 * Query params: includeInternal? (for admin)
 * Protected: Yes - requires authentication
 */
router.get("/:id/comments", protect, getComplaintComments);

/**
 * POST - POST /api/complaints/:id/comments
 * Add comment to complaint
 * Body: { message, isInternal? }
 * Protected: Yes - requires authentication
 */
router.post("/:id/comments", protect, addComplaintComment);


export default router;

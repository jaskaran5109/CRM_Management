import mongoose from "mongoose";

const complaintCommentSchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      required: true,
      index: true,
    },
    // userId can be null for customer comments
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // For tracking customer comments
    customerName: String,
    customerEmail: String,
    
    message: { type: String, required: true, trim: true },
    isInternal: { type: Boolean, default: false, index: true }, // Only admins see internal comments
    
    // Allowing attachment files in comments
    attachments: [
      {
        originalName: String,
        fileName: String,
        fileSize: Number,
        mimeType: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Indexes
complaintCommentSchema.index({ complaintId: 1, createdAt: -1 });
complaintCommentSchema.index({ userId: 1, createdAt: -1 });
complaintCommentSchema.index({ complaintId: 1, isInternal: 1 });

export default mongoose.model("ComplaintComment", complaintCommentSchema);

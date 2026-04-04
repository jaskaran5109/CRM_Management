import mongoose from "mongoose";

const complaintHistorySchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ["create", "status_change", "field_update", "assignment", "attachment", "internal_note", "delete"],
      required: true,
    },
    fieldName: String, // Name of field that was changed
    oldValue: mongoose.Schema.Types.Mixed, // Previous value
    newValue: mongoose.Schema.Types.Mixed, // New value
    message: String, // Human-readable message
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    metadata: {
      userAgent: String,
      ipAddress: String,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
complaintHistorySchema.index({ complaintId: 1, createdAt: -1 });
complaintHistorySchema.index({ updatedBy: 1, createdAt: -1 });

export default mongoose.model("ComplaintHistory", complaintHistorySchema);

import mongoose from "mongoose";

const submissionCommentSchema = new mongoose.Schema(
  {
    message: { type: String, required: true, trim: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const submissionAuditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, trim: true },
    message: { type: String, trim: true, default: "" },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    changedAt: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const formSubmissionSchema = new mongoose.Schema(
  {
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DynamicForm",
      required: true,
      index: true,
    },
    formSlug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    status: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    data: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: new Map(),
    },
    comments: {
      type: [submissionCommentSchema],
      default: [],
    },
    auditLogs: {
      type: [submissionAuditLogSchema],
      default: [],
    },
  },
  { timestamps: true },
);

formSubmissionSchema.index({ formSlug: 1, createdAt: -1 });
formSubmissionSchema.index({ submittedBy: 1, createdAt: -1 });
formSubmissionSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });

export default mongoose.model("FormSubmission", formSubmissionSchema);

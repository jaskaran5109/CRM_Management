import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    // Customer Information (for public complaints)
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, trim: true, lowercase: true },
    customerPhone: { type: String, required: true, trim: true, index: true },

    // Related CRM User (if customer exists in DB)
    linkedCustomer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },

    // Core fields
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true, trim: true },
    
    // Model & Service Category
    modelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CXModel",
      default: null,
    },
    modelName: String,
    
    serviceCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CXServiceCategory",
      default: null,
    },
    serviceCategoryName: String,

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "resolved"],
      default: "pending",
      index: true,
    },

    // Assignment & User Fields (null for public complaints initially)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // Attachments & Notes
    attachments: [
      {
        originalName: String,
        fileName: String,
        fileSize: Number,
        mimeType: String,
        uploadedAt: { type: Date, default: Date.now },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
    internalNotes: [
      {
        note: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // SLA & Deadlines
    slaDeadline: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      index: true,
    },

    // Dynamic fields support - store any additional fields
    dynamicFields: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: new Map(),
    },
  },
  { timestamps: true, strict: false }
);

// Indexes for performance
complaintSchema.index({ createdBy: 1, createdAt: -1 });
complaintSchema.index({ assignedTo: 1, status: 1 });
complaintSchema.index({ status: 1, priority: 1 });
complaintSchema.index({ title: "text", description: "text" }); // Text search index

export default mongoose.model("Complaint", complaintSchema);

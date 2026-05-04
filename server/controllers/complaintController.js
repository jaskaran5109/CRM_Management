import Complaint from "../models/Complaint.js";
import ComplaintHistory from "../models/ComplaintHistory.js";
import ComplaintComment from "../models/ComplaintComment.js";
import CXModel from "../models/CXModel.js";
import CXServiceCategory from "../models/CXServiceCategory.js";
import User from "../models/User.js";
import { Resend } from "resend";
import mongoose from "mongoose";
import {
  sendComplaintConfirmationEmail,
  sendStatusUpdateEmail,
  sendCommentNotificationEmail,
  sendComplaintAssignmentEmail,
} from "../utils/emailService.js";
import { formatStatusLabel } from "../utils/complaintWorkflow.js";
import {
  attachComplaintViewerAccess,
  buildComplaintPermissionSnapshot,
  getAllowedStatusOptionsForUser,
  getUserRoleIds,
  hasComplaintAccess,
  validateStatusForUser,
} from "../utils/complaintPermissionUtils.js";

const resend = new Resend(process.env.RESEND_API_KEY);

const populateComplaint = async (complaint) => {
  await complaint.populate("createdBy", "name email");
  await complaint.populate("assignedTo", "name email userRole");
  await complaint.populate("modelId", "name");
  await complaint.populate("serviceCategoryId", "name");
  await complaint.populate("nextRoles", "name");
  return complaint;
};

/**
 * Create a new complaint
 * Accepts all fields from request body
 * Supports both admin (internal) and customer (public) complaint creation
 */
export const createComplaint = async (req, res) => {
  try {
    const {
      title,
      description,
      customerName,
      customerEmail,
      customerPhone,
      priority = "medium",
      status,
      modelId = null,
      modelName = null,
      serviceCategoryId = null,
      serviceCategoryName = null,
      assignedTo = null,
      slaDeadline,
      internalNotes = [],
      ...dynamicFields
    } = req.body;

    // Validate required fields
    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({
        message: "Title and description are required",
      });
    }

    // Validate customer info (required - either from public form or admin entry)
    if (!customerName?.trim() || !customerEmail?.trim() || !customerPhone?.trim()) {
      return res.status(400).json({
        message: "Customer name, email, and phone are required",
      });
    }

    // Validate priority and status enums
    const validPriorities = ["low", "medium", "high"];
    const normalizedPriority = priority.toLowerCase();
    
    if (!validPriorities.includes(normalizedPriority)) {
      return res.status(400).json({
        message: `Invalid priority. Must be one of: ${validPriorities.join(", ")}`,
      });
    }

    const statusValidation = await validateStatusForUser(req.user, status);
    if (!statusValidation.ok) {
      return res.status(400).json({
        message: statusValidation.message,
        allowedStatuses: statusValidation.allowedStatuses,
      });
    }

    let resolvedModelId = modelId || null;
    let resolvedModelName = modelName?.trim() || null;
    if (resolvedModelId) {
      const model = await CXModel.findById(resolvedModelId).select("name").lean();
      if (!model) {
        return res.status(400).json({
          message: "Selected model does not exist",
        });
      }
      resolvedModelName = model.name;
    }

    let resolvedServiceCategoryId = serviceCategoryId || null;
    let resolvedServiceCategoryName = serviceCategoryName?.trim() || null;
    if (resolvedServiceCategoryId) {
      const serviceCategory = await CXServiceCategory.findById(
        resolvedServiceCategoryId,
      )
        .select("name")
        .lean();
      if (!serviceCategory) {
        return res.status(400).json({
          message: "Selected service category does not exist",
        });
      }
      resolvedServiceCategoryName = serviceCategory.name;
    }

    const resolvedStatus = statusValidation.statusValue;
    const permissionSnapshot = await buildComplaintPermissionSnapshot(resolvedStatus);

    // Create complaint
    const complaint = await Complaint.create({
      title: title.trim(),
      description: description.trim(),
      customerName: customerName.trim(),
      customerEmail: customerEmail.toLowerCase().trim(),
      customerPhone: customerPhone.trim(),
      priority: normalizedPriority,
      status: resolvedStatus,
      modelId: resolvedModelId,
      modelName: resolvedModelName,
      serviceCategoryId: resolvedServiceCategoryId,
      serviceCategoryName: resolvedServiceCategoryName,
      createdBy: req.user?._id || null, // null for public complaints, user id for admin
      assignedTo: assignedTo || null,
      nextRoles: permissionSnapshot.nextRoleIds,
      internalNotes,
      slaDeadline: slaDeadline ? new Date(slaDeadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      dynamicFields: new Map(Object.entries(dynamicFields)),
      permissionSnapshot,
    });

    // Populate references
    await populateComplaint(complaint);

    // Log in history
    await ComplaintHistory.create({
      complaintId: complaint._id,
      action: "create",
      message: req.user ? `Complaint created by ${req.user.name}` : "Public complaint created",
      newValue: complaint,
      updatedBy: req.user?._id || null,
      metadata: {
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip,
        source: req.user ? "admin" : "public",
      },
    });

    // Send confirmation email to customer
    try {
      await sendComplaintConfirmationEmail(complaint);
    } catch (emailError) {
      console.error("Email notification failed (non-blocking):", emailError.message);
      // Don't fail the request if email fails - log and continue
    }

    res.status(201).json({
      message: "Complaint created successfully",
      data: {
        ...complaint.toObject(),
        allowedStatuses: statusValidation.allowedStatuses,
      },
      trackingId: complaint._id,
    });
  } catch (error) {
    console.error("Create complaint error:", error);
    
    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        message: "Validation failed",
        errors: messages,
      });
    }

    res.status(500).json({
      message: "Failed to create complaint",
      error: error.message,
    });
  }
};

/**
 * Get all complaints with filtering, pagination, and sorting
 */
export const listComplaints = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      order = "desc",
      status,
      priority,
      category,
      assignedTo,
      createdBy,
      search,
      startDate,
      endDate,
    } = req.query;

    // Build filter object
    const filter = {};
    const andFilters = [];

    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Role-based filtering
    const userRoleIds = getUserRoleIds(req.user);

    if (req.user.role !== "admin") {
      filter.$or = [
        { createdBy: req.user._id },
        { assignedTo: req.user._id },
        { nextRoles: { $in: userRoleIds } },
        { "permissionSnapshot.allowedUserRoleIds": { $in: userRoleIds } },
      ];
    }
    // Admin sees all complaints (no role-based filter)

    // Multi-select filters
    if (status) {
      const statuses = status.split(",").map((s) => s.toLowerCase().trim());
      filter.status = { $in: statuses };
    }

    if (priority) {
      const priorities = priority.split(",").map((p) => p.toLowerCase().trim());
      filter.priority = { $in: priorities };
    }

    if (category) {
      const categories = category.split(",").map((c) => c.trim());
      filter.serviceCategoryName = { $in: categories };
    }

    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    if (createdBy) {
      filter.createdBy = createdBy;
    }

    // Text search (case-insensitive regex)
    if (search) {
      andFilters.push({
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { customerName: { $regex: search, $options: "i" } },
          { customerEmail: { $regex: search, $options: "i" } },
          { modelName: { $regex: search, $options: "i" } },
          { serviceCategoryName: { $regex: search, $options: "i" } },
        ],
      });
    }

    // Date range filtering
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    const finalFilter =
      andFilters.length > 0 ? { ...filter, $and: andFilters } : filter;

    // Validate pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sortObj = {};
    const validSortFields = ["createdAt", "priority", "status", "title"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    sortObj[sortField] = order === "asc" ? 1 : -1;

    // Execute query
    const [complaints, total] = await Promise.all([
      Complaint.find(finalFilter)
        .populate("createdBy", "name email role")
        .populate("assignedTo", "name email role")
        .populate("modelId", "name")
        .populate("serviceCategoryId", "name")
        .populate("nextRoles", "name")
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Complaint.countDocuments(finalFilter),
    ]);

    // Calculate metadata
    const totalPages = Math.ceil(total / limitNum);

    const enrichedComplaints = complaints.map((complaint) => ({
      ...complaint,
      viewerAccess: attachComplaintViewerAccess(complaint, req.user),
    }));
    const allowedStatuses = await getAllowedStatusOptionsForUser(req.user);

    res.json({
      message: "Complaints retrieved successfully",
      data: enrichedComplaints,
      allowedStatuses,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("List complaints error:", error);
    res.status(500).json({
      message: "Failed to fetch complaints",
      error: error.message,
    });
  }
};

/**
 * Get single complaint by ID
 */
export const getComplaint = async (req, res) => {
  try {
    const { id } = req.params;

    const complaint = await Complaint.findById(id)
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")
      .populate("modelId", "name")
      .populate("serviceCategoryId", "name")
      .populate("nextRoles", "name")
      .populate("attachments.uploadedBy", "name email");

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    if (!hasComplaintAccess(complaint, req.user)) {
      return res.status(403).json({
        message: "Not authorized to view this complaint",
      });
    }

    // Fetch history
    const history = await ComplaintHistory.find({
      complaintId: id,
    })
      .populate("updatedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const complaintObject = complaint.toObject();
    const allowedStatuses = await getAllowedStatusOptionsForUser(req.user);

    res.json({
      message: "Complaint retrieved successfully",
      data: {
        ...complaintObject,
        viewerAccess: attachComplaintViewerAccess(complaintObject, req.user),
        allowedStatuses,
      },
      history,
    });
  } catch (error) {
    console.error("Get complaint error:", error);
    res.status(500).json({
      message: "Failed to fetch complaint",
      error: error.message,
    });
  }
};

export const getComplaintStatusOptions = async (req, res) => {
  try {
    const allowedStatuses = await getAllowedStatusOptionsForUser(req.user);
    res.json({
      message: "Complaint status options retrieved successfully",
      data: allowedStatuses,
    });
  } catch (error) {
    console.error("Get complaint status options error:", error);
    res.status(500).json({
      message: "Failed to fetch complaint status options",
      error: error.message,
    });
  }
};

/**
 * Update complaint (PATCH - partial update)
 * Tracks changes in history
 */
export const updateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find existing complaint
    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    if (!hasComplaintAccess(complaint, req.user)) {
      return res.status(403).json({
        message: "Not authorized to update this complaint",
      });
    }

    const isAdmin = req.user.role === "admin";
    const isAgent = req.user.role === "agent";

    if ("role" in updateData) {
      return res.status(400).json({
        message: "Complaint role is no longer part of the complaint workflow",
      });
    }

    if ("assignedTo" in updateData && !isAdmin) {
      return res.status(403).json({
        message: "Only admins can update complaint assignment",
      });
    }

    if (
      (("priority" in updateData) || ("status" in updateData)) &&
      !isAdmin &&
      !isAgent
    ) {
      return res.status(403).json({
        message: "Only admins and agents can update complaint status or priority",
      });
    }

    let validatedStatusValue = null;
    let allowedStatuses = null;
    if ("status" in updateData) {
      const statusValidation = await validateStatusForUser(req.user, updateData.status);
      if (!statusValidation.ok) {
        return res.status(400).json({
          message: statusValidation.message,
          allowedStatuses: statusValidation.allowedStatuses,
        });
      }

      validatedStatusValue = statusValidation.statusValue;
      allowedStatuses = statusValidation.allowedStatuses;
    }

    // Track changes for history & email
    const changes = [];
    let statusChanged = false;
    const oldStatus = complaint.status;

    // Define allowed update fields
    const allowedFields = [
      "title",
      "description",
      "customerName",
      "customerEmail",
      "customerPhone",
      "modelId",
      "modelName",
      "serviceCategoryId",
      "serviceCategoryName",
      "priority",
      "status",
      "slaDeadline",
    ];

    // Update each field and track changes
    for (const field of allowedFields) {
      if (field in updateData && updateData[field] !== undefined) {
        const oldValue = complaint[field];
        const newValue =
          field === "status" && validatedStatusValue !== null
            ? validatedStatusValue
            : updateData[field];

        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changes.push({
            fieldName: field,
            oldValue,
            newValue,
          });

          complaint[field] = newValue;
          
          // Track if status changed
          if (field === "status") {
            statusChanged = true;
          }
        }
      }
    }

    if ("modelId" in updateData) {
      if (updateData.modelId) {
        const model = await CXModel.findById(updateData.modelId).select("name").lean();
        if (!model) {
          return res.status(400).json({ message: "Selected model does not exist" });
        }
        complaint.modelId = updateData.modelId;
        complaint.modelName = model.name;
      } else {
        complaint.modelId = null;
        complaint.modelName = updateData.modelName?.trim() || null;
      }
    }

    if ("serviceCategoryId" in updateData) {
      if (updateData.serviceCategoryId) {
        const serviceCategory = await CXServiceCategory.findById(
          updateData.serviceCategoryId,
        )
          .select("name")
          .lean();
        if (!serviceCategory) {
          return res
            .status(400)
            .json({ message: "Selected service category does not exist" });
        }
        complaint.serviceCategoryId = updateData.serviceCategoryId;
        complaint.serviceCategoryName = serviceCategory.name;
      } else {
        complaint.serviceCategoryId = null;
        complaint.serviceCategoryName =
          updateData.serviceCategoryName?.trim() || null;
      }
    }

    // Handle dynamic fields
    if (updateData.dynamicFields) {
      for (const [key, value] of Object.entries(updateData.dynamicFields)) {
        const oldValue = complaint.dynamicFields?.get(key);
        if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
          changes.push({
            fieldName: `dynamicFields.${key}`,
            oldValue,
            newValue: value,
          });
        }
        complaint.dynamicFields.set(key, value);
      }
    }

    // Handle internal notes addition
    const internalNoteMessage =
      updateData.addInternalNote?.trim?.() || updateData.internalNote?.trim?.() || "";
    if (internalNoteMessage) {
      complaint.internalNotes.push({
        note: internalNoteMessage,
        createdBy: req.user._id,
      });
      changes.push({
        fieldName: "internalNotes",
        oldValue: complaint.internalNotes.length - 1,
        newValue: complaint.internalNotes.length,
      });
    }

    if ("assignedTo" in updateData) {
      if (!updateData.assignedTo) {
        const oldAssignedTo = complaint.assignedTo ? String(complaint.assignedTo) : null;
        complaint.assignedTo = null;
        if (oldAssignedTo !== null) {
          changes.push({
            fieldName: "assignedTo",
            oldValue: oldAssignedTo,
            newValue: null,
          });
        }
      } else {
        if (!mongoose.Types.ObjectId.isValid(updateData.assignedTo)) {
          return res.status(400).json({
            message: "Invalid assigned user",
          });
        }

        const assignedUser = await User.findById(updateData.assignedTo)
          .populate("userRole", "name")
          .select("name email userRole")
          .lean();

        if (!assignedUser) {
          return res.status(404).json({
            message: "Assigned user not found",
          });
        }

        const oldAssignedTo = complaint.assignedTo ? String(complaint.assignedTo) : null;
        if (oldAssignedTo !== String(updateData.assignedTo)) {
          complaint.assignedTo = updateData.assignedTo;
          changes.push({
            fieldName: "assignedTo",
            oldValue: oldAssignedTo,
            newValue: String(updateData.assignedTo),
          });
        }
      }
    }

    if ("status" in updateData && updateData.status !== undefined) {
      complaint.permissionSnapshot = await buildComplaintPermissionSnapshot(complaint.status);
      complaint.nextRoles = complaint.permissionSnapshot.nextRoleIds;
    }

    // Save updated complaint
    const updatedComplaint = await complaint.save();
    await populateComplaint(updatedComplaint);

    // Log all changes in history
    for (const change of changes) {
      await ComplaintHistory.create({
        complaintId: id,
        action: "field_update",
        fieldName: change.fieldName,
        oldValue: change.oldValue,
        newValue: change.newValue,
        message: `${change.fieldName} updated from ${JSON.stringify(change.oldValue)} to ${JSON.stringify(change.newValue)}`,
        updatedBy: req.user._id,
        metadata: {
          userAgent: req.headers["user-agent"],
          ipAddress: req.ip,
        },
      });
    }
    
    // Send email notification if status changed
    if (statusChanged && complaint.customerEmail) {
      try {
        await sendStatusUpdateEmail(complaint, oldStatus, complaint.status);
        console.log("Status update email sent successfully");
      } catch (emailError) {
        console.error("Failed to send status update email:", emailError.message);
        // Don't fail the API response if email fails
      }
    }

    // Send email notification for important field changes
    if (!statusChanged && changes.length > 0 && complaint.customerEmail) {
      // Check if any important fields changed
      const importantFields = ["title", "modelName", "serviceCategoryName"];
      const hasImportantChange = changes.some((c) => importantFields.includes(c.fieldName));
      
      if (hasImportantChange) {
        try {
          const emailContent = `
            <h2>Complaint Updated</h2>
            <p>Hello ${complaint.customerName},</p>
            <p>Your complaint has been updated with the following changes:</p>
            
            <h3>Changes Made:</h3>
            <ul>
              ${changes.map((c) => `<li><strong>${c.fieldName}:</strong> ${JSON.stringify(c.oldValue)} → ${JSON.stringify(c.newValue)}</li>`).join("")}
            </ul>
            
            <h3>Current Status:</h3>
            <ul>
              <li><strong>Reference ID:</strong> ${complaint._id}</li>
              <li><strong>Title:</strong> ${complaint.title}</li>
              <li><strong>Status:</strong> ${formatStatusLabel(complaint.status)}</li>
              <li><strong>Priority:</strong> ${complaint.priority}</li>
            </ul>
            
            <p><a href="${process.env.FRONTEND_URL}/track-complaint?phone=${complaint.customerPhone}">View your complaint</a></p>
            <p>Best regards,<br>CRM Support Team</p>
          `;

          await resend.emails.send({
            from: process.env.EMAIL_USER || "noreply@crm.example.com",
            to: complaint.customerEmail,
            subject: `Complaint Updated - Reference ID: ${complaint._id}`,
            html: emailContent,
          });
          console.log("Complaint update email sent successfully");
        } catch (emailError) {
          console.error("Failed to send complaint update email:", emailError.message);
          // Don't fail the API response if email fails
        }
      }
    }

    res.json({
      message: "Complaint updated successfully",
      data: {
        ...updatedComplaint.toObject(),
        viewerAccess: attachComplaintViewerAccess(updatedComplaint.toObject(), req.user),
        allowedStatuses:
          allowedStatuses || (await getAllowedStatusOptionsForUser(req.user)),
      },
      changesCount: changes.length,
    });
  } catch (error) {
    console.error("Update complaint error:", error);
    res.status(500).json({
      message: "Failed to update complaint",
      error: error.message,
    });
  }
};

/**
 * Delete complaint
 */
export const deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Not authorized to delete this complaint",
      });
    }

    // Delete complaint
    await Complaint.findByIdAndDelete(id);

    // Log deletion in history
    await ComplaintHistory.create({
      complaintId: id,
      action: "delete",
      message: `Complaint deleted by ${req.user.name}`,
      updatedBy: req.user._id,
      metadata: {
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip,
      },
    });

    res.json({
      message: "Complaint deleted successfully",
    });
  } catch (error) {
    console.error("Delete complaint error:", error);
    res.status(500).json({
      message: "Failed to delete complaint",
      error: error.message,
    });
  }
};

/**
 * Get complaint history
 */
export const getComplaintHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findById(id).select(
      "createdBy assignedTo nextRoles permissionSnapshot",
    );

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    if (!hasComplaintAccess(complaint, req.user)) {
      return res.status(403).json({
        message: "Not authorized to view complaint history",
      });
    }

    const history = await ComplaintHistory.find({
      complaintId: id,
    })
      .populate("updatedBy", "name email role")
      .sort({ createdAt: -1 });

    res.json({
      message: "Complaint history retrieved successfully",
      data: history,
    });
  } catch (error) {
    console.error("Get history error:", error);
    res.status(500).json({
      message: "Failed to fetch history",
      error: error.message,
    });
  }
};

/**
 * Get complaint statistics
 */
export const getComplaintStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const userFilter =
      req.user.role === "user" ? { createdBy: req.user._id } : {};

    const stats = await Complaint.aggregate([
      {
        $match: {
          ...userFilter,
          ...(Object.keys(dateFilter).length && {
            createdAt: dateFilter,
          }),
        },
      },
      {
        $facet: {
          byStatus: [
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ],
          byPriority: [
            { $group: { _id: "$priority", count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ],
          byCategory: [
            { $group: { _id: "$serviceCategoryName", count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ],
          total: [{ $count: "count" }],
          avgResolutionTime: [
            {
              $group: {
                _id: null,
                avg: { $avg: "$resolutionTime" },
              },
            },
          ],
        },
      },
    ]);

    res.json({
      message: "Statistics retrieved successfully",
      data: stats[0],
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({
      message: "Failed to fetch statistics",
      error: error.message,
    });
  }
};

/**
 * Add comment to complaint
 */
export const addComplaintComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, isInternal = false } = req.body;

    // Validate input
    if (!message?.trim()) {
      return res.status(400).json({
        message: "Comment message is required",
      });
    }

    // Find complaint
    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    if (!hasComplaintAccess(complaint, req.user)) {
      return res.status(403).json({
        message: "Not authorized to comment on this complaint",
      });
    }

    // Create comment
    const comment = await ComplaintComment.create({
      complaintId: id,
      userId: req.user._id,
      message: message.trim(),
      isInternal: isInternal === true,
    });

    await comment.populate("userId", "name email");

    // Log in history
    await ComplaintHistory.create({
      complaintId: id,
      action: "internal_note",
      message: `Comment added: ${message.substring(0, 100)}...`,
      updatedBy: req.user._id,
      metadata: {
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip,
      },
    });

    // Send email to customer if comment is public
    if (!isInternal && complaint.customerEmail) {
      await sendCommentNotificationEmail(complaint, comment);
    }

    res.status(201).json({
      message: "Comment added successfully",
      data: comment,
    });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({
      message: "Failed to add comment",
      error: error.message,
    });
  }
};

/**
 * Get complaint comments
 */
export const getComplaintComments = async (req, res) => {
  try {
    const { id } = req.params;
    const { includeInternal = false } = req.query;

    // Find complaint
    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    if (!hasComplaintAccess(complaint, req.user)) {
      return res.status(403).json({
        message: "Not authorized to view complaint comments",
      });
    }

    // Build filter for comments
    const filter = { complaintId: id };
    if (!includeInternal || includeInternal === "false") {
      filter.isInternal = false; // Only get public comments
    }

    // Fetch comments
    const comments = await ComplaintComment.find(filter)
      .populate("userId", "name email")
      .sort({ createdAt: 1 })
      .lean();

    res.json({
      message: "Comments retrieved successfully",
      data: comments,
    });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({
      message: "Failed to fetch comments",
      error: error.message,
    });
  }
};

/**
 * Assign complaint to user
 */
export const assignComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedToUserId } = req.body;

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admins can assign complaints",
      });
    }

    // Validate input
    if (!assignedToUserId) {
      return res.status(400).json({
        message: "User ID is required to assign complaint",
      });
    }

    // Find complaint
    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    // Find user
    const assignedUser = await User.findById(assignedToUserId)
      .populate("userRole", "name")
      .select("name email userRole");
    if (!assignedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Store old value
    const oldAssignedTo = complaint.assignedTo;

    // Update assignment
    complaint.assignedTo = assignedToUserId;
    await complaint.save();

    // Log in history
    await ComplaintHistory.create({
      complaintId: id,
      action: "assignment",
      fieldName: "assignedTo",
      oldValue: oldAssignedTo,
      newValue: assignedToUserId,
      message: `Assigned to ${assignedUser.name}`,
      updatedBy: req.user._id,
      metadata: {
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip,
      },
    });

    // Send assignment email to user
    await sendComplaintAssignmentEmail(complaint, assignedUser.email, assignedUser.name);

    await populateComplaint(complaint);

    res.json({
      message: "Complaint assigned successfully",
      data: complaint,
    });
  } catch (error) {
    console.error("Assign complaint error:", error);
    res.status(500).json({
      message: "Failed to assign complaint",
      error: error.message,
    });
  }
};

/**
 * Update complaint status with email notification
 */
export const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const statusValidation = await validateStatusForUser(req.user, status);
    if (!statusValidation.ok) {
      return res.status(400).json({
        message: statusValidation.message,
        allowedStatuses: statusValidation.allowedStatuses,
      });
    }

    // Find complaint
    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    if (!hasComplaintAccess(complaint, req.user)) {
      return res.status(403).json({
        message: "Not authorized to update this complaint status",
      });
    }

    const oldStatus = complaint.status;
    const newStatus = statusValidation.statusValue;

    // Update status
    complaint.status = newStatus;
    complaint.permissionSnapshot = await buildComplaintPermissionSnapshot(newStatus);
    complaint.nextRoles = complaint.permissionSnapshot.nextRoleIds;
    await complaint.save();

    // Log in history
    await ComplaintHistory.create({
      complaintId: id,
      action: "status_change",
      fieldName: "status",
      oldValue: oldStatus,
      newValue: newStatus,
      message: `Status changed from ${oldStatus} to ${newStatus}`,
      updatedBy: req.user._id,
      metadata: {
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip,
      },
    });

    // Send email notification to customer
    if (complaint.customerEmail) {
      await sendStatusUpdateEmail(complaint, oldStatus, newStatus);
    }

    await populateComplaint(complaint);

    res.json({
      message: "Complaint status updated successfully",
      data: {
        ...complaint.toObject(),
        allowedStatuses: statusValidation.allowedStatuses,
      },
    });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({
      message: "Failed to update complaint status",
      error: error.message,
    });
  }
};

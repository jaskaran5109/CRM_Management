import Complaint from "../models/Complaint.js";
import ComplaintComment from "../models/ComplaintComment.js";
import User from "../models/User.js";
import {
  sendComplaintConfirmationEmail,
  sendStatusUpdateEmail,
  sendCommentNotificationEmail,
} from "../utils/emailService.js";

/**
 * Create a new complaint (public - no authentication required)
 */
export const createPublicComplaint = async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      title,
      description,
      modelId,
      modelName,
      serviceCategoryId,
      serviceCategoryName,
      priority = "medium",
    } = req.body;

    // Validate required fields
    if (!customerName?.trim() || !customerEmail?.trim() || !customerPhone?.trim()) {
      return res.status(400).json({
        message: "Customer name, email, and phone are required",
      });
    }

    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({
        message: "Title and description are required",
      });
    }

    // Check if customer exists in the system by phone number
    let linkedCustomer = null;
    try {
      linkedCustomer = await User.findOne({ phoneNumber: customerPhone }).select("_id");
    } catch (error) {
      // Phone not found, continue without linking
      console.log("Customer not found by phone:", customerPhone);
    }

    // Create complaint
    const complaint = await Complaint.create({
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      customerPhone: customerPhone.trim(),
      title: title.trim(),
      description: description.trim(),
      modelId: modelId || null,
      modelName: modelName || null,
      serviceCategoryId: serviceCategoryId || null,
      serviceCategoryName: serviceCategoryName || null,
      priority: priority.toLowerCase(),
      status: "pending",
      linkedCustomer: linkedCustomer?._id || null,
      createdBy: null, // No user for public complaints
      assignedTo: null,
    });

    // Send confirmation email
    await sendComplaintConfirmationEmail(complaint);

    res.status(201).json({
      message: "Complaint created successfully",
      data: complaint,
      trackingId: complaint._id,
    });
  } catch (error) {
    console.error("Create public complaint error:", error);
    res.status(500).json({
      message: "Failed to create complaint",
      error: error.message,
    });
  }
};

/**
 * Track complaints by phone and email (public - no authentication required)
 */
export const trackComplaints = async (req, res) => {
  try {
    const { customerPhone, customerEmail } = req.query;

    // Validate required field
    if (!customerPhone?.trim()) {
      return res.status(400).json({
        message: "Phone number is required for tracking complaints",
      });
    }

    // Build filter
    const filter = { customerPhone: customerPhone.trim() };
    if (customerEmail?.trim()) {
      filter.customerEmail = customerEmail.trim().toLowerCase();
    }

    // Fetch complaints
    const complaints = await Complaint.find(filter)
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      message: "Complaints retrieved successfully",
      data: complaints,
      total: complaints.length,
    });
  } catch (error) {
    console.error("Track complaints error:", error);
    res.status(500).json({
      message: "Failed to fetch complaints",
      error: error.message,
    });
  }
};

/**
 * Get complaint details and comments (public - customers can view their own)
 */
export const getPublicComplaintDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const { customerPhone, customerEmail } = req.query;

    // Validate customer info
    if (!customerPhone?.trim()) {
      return res.status(400).json({
        message: "Phone number is required to view complaint details",
      });
    }

    // Fetch complaint
    const complaint = await Complaint.findById(id)
      .populate("assignedTo", "name email");

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    // Verify customer - must match phone number
    if (complaint.customerPhone !== customerPhone.trim()) {
      return res.status(403).json({
        message: "Not authorized to view this complaint",
      });
    }

    // Verify email if provided
    if (customerEmail?.trim() && complaint.customerEmail !== customerEmail.trim().toLowerCase()) {
      return res.status(403).json({
        message: "Email does not match complaint record",
      });
    }

    // Fetch public comments only (internal comments not visible to customer)
    const comments = await ComplaintComment.find({
      complaintId: id,
      isInternal: false,
    })
      .populate("userId", "name email")
      .sort({ createdAt: 1 })
      .lean();

    res.json({
      message: "Complaint details retrieved successfully",
      data: complaint,
      comments,
    });
  } catch (error) {
    console.error("Get complaint detail error:", error);
    res.status(500).json({
      message: "Failed to fetch complaint details",
      error: error.message,
    });
  }
};

/**
 * Add public comment to complaint (customer can only add public comments)
 */
export const addPublicComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { customerPhone, customerEmail, message } = req.body;

    // Validate inputs
    if (!customerPhone?.trim() || !message?.trim()) {
      return res.status(400).json({
        message: "Phone number and message are required",
      });
    }

    // Fetch complaint
    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    // Verify customer
    if (complaint.customerPhone !== customerPhone.trim()) {
      return res.status(403).json({
        message: "Not authorized to add comments to this complaint",
      });
    }

    if (customerEmail?.trim() && complaint.customerEmail !== customerEmail.trim().toLowerCase()) {
      return res.status(403).json({
        message: "Email does not match complaint record",
      });
    }

    // Create comment (public only for customers)
    const comment = await ComplaintComment.create({
      complaintId: id,
      userId: null,
      customerName: complaint.customerName,
      customerEmail: complaint.customerEmail,
      message: message.trim(),
      isInternal: false,
    });

    // Notify assigned user if there is one
    if (complaint.assignedTo) {
      const assignedUser = await User.findById(complaint.assignedTo).select("email name");
      if (assignedUser?.email) {
        // Could send email notification here if needed
        console.log("New customer comment on complaint:", comment._id);
      }
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

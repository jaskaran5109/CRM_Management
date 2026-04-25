import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER || "noreply@crm.example.com";

/**
 * Send complaint creation confirmation email
 */
export const sendComplaintConfirmationEmail = async (complaint) => {
  try {
    const emailContent = `
      <h2>Complaint Received</h2>
      <p>Hello ${complaint.customerName},</p>
      <p>Thank you for raising a complaint. We have received your complaint and our team will review it shortly.</p>
      
      <h3>Complaint Details:</h3>
      <ul>
        <li><strong>Reference ID:</strong> ${complaint._id}</li>
        <li><strong>Title:</strong> ${complaint.title}</li>
        <li><strong>Description:</strong> ${complaint.description}</li>
        <li><strong>Priority:</strong> ${complaint.priority}</li>
        <li><strong>Status:</strong> ${complaint.status}</li>
        <li><strong>Submitted on:</strong> ${new Date(complaint.createdAt).toLocaleString()}</li>
      </ul>
      
      <p>You can track your complaint using your phone number and email at our tracking portal.</p>
      <p>Best regards,<br>CRM Support Team</p>
    `;

    const result = await resend.emails.send({
      from: emailFrom,
      to: complaint.customerEmail,
      subject: `Complaint Confirmation - Reference ID: ${complaint._id}`,
      html: emailContent,
    });

    console.log("Complaint confirmation email sent:", result);
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error("Failed to send complaint confirmation email:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send status update email
 */
export const sendStatusUpdateEmail = async (complaint, oldStatus, newStatus) => {
  try {
    const emailContent = `
      <h2>Complaint Status Update</h2>
      <p>Hello ${complaint.customerName},</p>
      <p>We wanted to notify you that your complaint status has been updated.</p>
      
      <h3>Update Details:</h3>
      <ul>
        <li><strong>Reference ID:</strong> ${complaint._id}</li>
        <li><strong>Title:</strong> ${complaint.title}</li>
        <li><strong>Previous Status:</strong> ${oldStatus}</li>
        <li><strong>New Status:</strong> ${newStatus}</li>
        <li><strong>Updated on:</strong> ${new Date().toLocaleString()}</li>
      </ul>
      
      <p>We appreciate your patience and will continue working to resolve your complaint.</p>
      <p>You can view more details by visiting our tracking portal.</p>
      <p>Best regards,<br>CRM Support Team</p>
    `;

    const result = await resend.emails.send({
      from: emailFrom,
      to: complaint.customerEmail,
      subject: `Complaint Status Update - Reference ID: ${complaint._id}`,
      html: emailContent,
    });

    console.log("Status update email sent:", result);
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error("Failed to send status update email:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send comment notification email
 */
export const sendCommentNotificationEmail = async (complaint, comment) => {
  try {
    const emailContent = `
      <h2>New Comment on Your Complaint</h2>
      <p>Hello ${complaint.customerName},</p>
      <p>A new comment has been added to your complaint.</p>
      
      <h3>Comment Details:</h3>
      <p><strong>Comment:</strong> ${comment.message}</p>
      <p><strong>Added on:</strong> ${new Date(comment.createdAt).toLocaleString()}</p>
      
      <h3>Complaint Reference:</h3>
      <ul>
        <li><strong>Reference ID:</strong> ${complaint._id}</li>
        <li><strong>Title:</strong> ${complaint.title}</li>
        <li><strong>Current Status:</strong> ${complaint.status}</li>
      </ul>
      
      <p>You can view all updates by visiting our tracking portal.</p>
      <p>Best regards,<br>CRM Support Team</p>
    `;

    const result = await resend.emails.send({
      from: emailFrom,
      to: complaint.customerEmail,
      subject: `New Comment on Your Complaint - Reference ID: ${complaint._id}`,
      html: emailContent,
    });

    return { success: true, messageId: result.id };
  } catch (error) {
    console.error("Failed to send comment notification email:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send internal team notification (for assigned user)
 */
export const sendComplaintAssignmentEmail = async (complaint, assignedUserEmail, assignedUserName) => {
  try {
    const emailContent = `
      <h2>New Complaint Assigned to You</h2>
      <p>Hello ${assignedUserName},</p>
      <p>A new complaint has been assigned to you.</p>
      
      <h3>Complaint Details:</h3>
      <ul>
        <li><strong>Reference ID:</strong> ${complaint._id}</li>
        <li><strong>Title:</strong> ${complaint.title}</li>
        <li><strong>Customer Name:</strong> ${complaint.customerName}</li>
        <li><strong>Customer Phone:</strong> ${complaint.customerPhone}</li>
        <li><strong>Description:</strong> ${complaint.description}</li>
        <li><strong>Priority:</strong> ${complaint.priority}</li>
        <li><strong>Status:</strong> ${complaint.status}</li>
        <li><strong>Model:</strong> ${complaint.modelName || "N/A"}</li>
        <li><strong>Service Category:</strong> ${complaint.serviceCategoryName || "N/A"}</li>
      </ul>
      
      <p>Please log in to the CRM portal to view and manage this complaint.</p>
      <p>Best regards,<br>CRM System</p>
    `;

    const result = await resend.emails.send({
      from: emailFrom,
      to: assignedUserEmail,
      subject: `New Complaint Assigned - Reference ID: ${complaint._id}`,
      html: emailContent,
    });

    console.log("Complaint assignment email sent:", result);
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error("Failed to send assignment email:", error);
    return { success: false, error: error.message };
  }
};

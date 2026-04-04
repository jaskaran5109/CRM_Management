/**
 * Public Complaint APIs (no authentication required)
 */

const PUBLIC_BASE = "/api/public/complaints";

/**
 * Create a new complaint (public)
 */
export const createPublicComplaint = async (formData) => {
  try {
    const response = await fetch(PUBLIC_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create complaint");
    }

    return await response.json();
  } catch (error) {
    console.error("createPublicComplaint error:", error);
    throw error;
  }
};

/**
 * Track complaints by phone and email (public)
 */
export const trackComplaintsByPhone = async (customerPhone, customerEmail = "") => {
  try {
    const params = new URLSearchParams();
    params.append("customerPhone", customerPhone);
    if (customerEmail) {
      params.append("customerEmail", customerEmail);
    }

    const response = await fetch(`${PUBLIC_BASE}?${params.toString()}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch complaints");
    }

    return await response.json();
  } catch (error) {
    console.error("trackComplaintsByPhone error:", error);
    throw error;
  }
};

/**
 * Get public complaint details and comments (public)
 */
export const getPublicComplaintDetail = async (complaintId, customerPhone, customerEmail = "") => {
  try {
    const params = new URLSearchParams();
    params.append("customerPhone", customerPhone);
    if (customerEmail) {
      params.append("customerEmail", customerEmail);
    }

    const response = await fetch(`${PUBLIC_BASE}/${complaintId}?${params.toString()}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch complaint");
    }

    return await response.json();
  } catch (error) {
    console.error("getPublicComplaintDetail error:", error);
    throw error;
  }
};

/**
 * Add public comment to complaint (public)
 */
export const addPublicComment = async (complaintId, customerPhone, customerEmail, message) => {
  try {
    const response = await fetch(`${PUBLIC_BASE}/${complaintId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerPhone,
        customerEmail,
        message,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to add comment");
    }

    return await response.json();
  } catch (error) {
    console.error("addPublicComment error:", error);
    throw error;
  }
};

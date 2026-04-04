const BASE = import.meta.env.RENDER_API_URL + "/api/complaints";

const getHeaders = (token) => ({
  ...(token && { Authorization: `Bearer ${token}` }),
  "Content-Type": "application/json",
});

/**
 * Fetch complaints with advanced filtering, pagination, and sorting
 * @param {Object} filters - Filter options (status, priority, category, assignedTo, createdBy, search, startDate, endDate)
 * @param {Object} pagination - Pagination options (page, limit, sortBy, order)
 * @param {string} token - JWT token
 */
export const fetchComplaints = async (
  filters = {},
  pagination = { page: 1, limit: 10, sortBy: "createdAt", order: "desc" },
  token
) => {
  try {
    const params = new URLSearchParams();

    // Add pagination params
    params.append("page", pagination.page || 1);
    params.append("limit", pagination.limit || 10);
    params.append("sortBy", pagination.sortBy || "createdAt");
    params.append("order", pagination.order || "desc");

    // Add filters
    if (filters.status) params.append("status", filters.status);
    if (filters.priority) params.append("priority", filters.priority);
    if (filters.category) params.append("category", filters.category);
    if (filters.assignedTo) params.append("assignedTo", filters.assignedTo);
    if (filters.createdBy) params.append("createdBy", filters.createdBy);
    if (filters.search) params.append("search", filters.search);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);

    const res = await fetch(`${BASE}?${params.toString()}`, {
      method: "GET",
      headers: getHeaders(token),
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("fetchComplaints error:", error);
    throw error;
  }
};

/**
 * Create new complaint (admin panel)
 * @param {Object} complainData - Complaint data (title, description, customerName, customerEmail, customerPhone, etc.)
 * @param {string} token - JWT token
 */
export const createComplaint = async (complainData, token) => {
  try {
    // Ensure proper JSON serialization with correct headers
    const res = await fetch(`${BASE}`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(complainData),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("createComplaint error:", error);
    throw error;
  }
};

/**
 * Get single complaint with history
 * @param {string} id - Complaint ID
 * @param {string} token - JWT token
 */
export const fetchComplaintById = async (id, token) => {
  try {
    const res = await fetch(`${BASE}/${id}`, {
      method: "GET",
      headers: getHeaders(token),
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("fetchComplaintById error:", error);
    throw error;
  }
};

/**
 * Update complaint (PATCH - partial update)
 * @param {string} id - Complaint ID
 * @param {Object|FormData} updates - Update data
 * @param {string} token - JWT token
 */
export const updateComplaint = async (id, updates, token) => {
  try {
    const isFormData = updates instanceof FormData;
    const res = await fetch(`${BASE}/${id}`, {
      method: "PATCH",
      headers: isFormData ? { ...(token && { Authorization: `Bearer ${token}` }) } : getHeaders(token),
      body: isFormData ? updates : JSON.stringify(updates),
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("updateComplaint error:", error);
    throw error;
  }
};

/**
 * Delete complaint
 * @param {string} id - Complaint ID
 * @param {string} token - JWT token
 */
export const deleteComplaint = async (id, token) => {
  try {
    const res = await fetch(`${BASE}/${id}`, {
      method: "DELETE",
      headers: getHeaders(token),
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("deleteComplaint error:", error);
    throw error;
  }
};

/**
 * Get complaint history
 * @param {string} id - Complaint ID
 * @param {string} token - JWT token
 */
export const fetchHistory = async (id, token) => {
  try {
    const res = await fetch(`${BASE}/${id}/history`, {
      method: "GET",
      headers: getHeaders(token),
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("fetchHistory error:", error);
    throw error;
  }
};

/**
 * Get complaint statistics
 * @param {Object} filters - Filter options (startDate, endDate)
 * @param {string} token - JWT token
 */
export const fetchComplaintStats = async (filters = {}, token) => {
  try {
    const params = new URLSearchParams();
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);

    const res = await fetch(`${BASE}/stats?${params.toString()}`, {
      method: "GET",
      headers: getHeaders(token),
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("fetchComplaintStats error:", error);
    throw error;
  }
};

/**
 * Build FormData for file uploads
 * @param {Object} complaintData - Complaint data
 * @returns {FormData} - FormData object ready for upload
 */
export const buildFormDataForComplaint = (complaintData) => {
  const formData = new FormData();

  // Add text fields
  if (complaintData.title) formData.append("title", complaintData.title);
  if (complaintData.description) formData.append("description", complaintData.description);
  if (complaintData.category) formData.append("category", complaintData.category);
  if (complaintData.priority) formData.append("priority", complaintData.priority);
  if (complaintData.status) formData.append("status", complaintData.status);
  if (complaintData.assignedTo) formData.append("assignedTo", complaintData.assignedTo);
  if (complaintData.slaDeadline) formData.append("slaDeadline", complaintData.slaDeadline);
  if (complaintData.addInternalNote) formData.append("addInternalNote", complaintData.addInternalNote);

  // Add dynamic fields
  if (complaintData.dynamicFields) {
    for (const [key, value] of Object.entries(complaintData.dynamicFields)) {
      formData.append(`dynamicFields[${key}]`, value);
    }
  }

  // Add files
  if (complaintData.files && complaintData.files.length > 0) {
    complaintData.files.forEach((file) => {
      formData.append("attachments", file);
    });
  }

  return formData;
};

/**
 * Fetch comments for a complaint (placeholder for future implementation)
 * @param {string} id - Complaint ID
 * @param {string} token - JWT token
 */
export const fetchComments = async (id, token) => {
  try {
    const res = await fetch(`${BASE}/${id}/comments`, {
      method: "GET",
      headers: getHeaders(token),
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("fetchComments error:", error);
    throw error;
  }
};

/**
 * Add comment to a complaint (placeholder for future implementation)
 * @param {string} id - Complaint ID
 * @param {Object} payload - Comment payload
 * @param {string} token - JWT token
 */
export const addComment = async (id, payload, token) => {
  try {
    const res = await fetch(`${BASE}/${id}/comments`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("addComment error:", error);
    throw error;
  }
};

/**
 * Assign complaint to a user
 * @param {string} id - Complaint ID
 * @param {string} assignedToUserId - User ID to assign to
 * @param {string} token - JWT token
 */
export const assignComplaintToUser = async (id, assignedToUserId, token) => {
  try {
    const res = await fetch(`${BASE}/${id}/assign`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify({ assignedToUserId }),
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("assignComplaintToUser error:", error);
    throw error;
  }
};

/**
 * Update complaint status
 * @param {string} id - Complaint ID
 * @param {string} status - New status
 * @param {string} token - JWT token
 */
export const updateComplaintStatusAPI = async (id, status, token) => {
  try {
    const res = await fetch(`${BASE}/${id}/status`, {
      method: "PATCH",
      headers: getHeaders(token),
      body: JSON.stringify({ status }),
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("updateComplaintStatusAPI error:", error);
    throw error;
  }
};

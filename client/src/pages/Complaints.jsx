import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { MdEdit, MdDelete, MdComment } from "react-icons/md";
import "./Complaints.css";
import CommentsModal from "../components/complaints/CommentsModal";
import {
  fetchPublicComplaintModels,
  fetchPublicComplaintServiceCategories,
} from "../services/publicComplaintService";
import {
  listComplaints,
  createComplaintAction,
  updateComplaintAction,
  deleteComplaintAction,
  clearComplaintStatus,
} from "../redux/slices/complaintSlice";
import { fetchAllUserRoles } from "../redux/slices/adminSlices/userRoleSlice";

const initialForm = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  title: "",
  description: "",
  modelId: "",
  modelName: "",
  serviceCategoryId: "",
  serviceCategoryName: "",
  priority: "medium",
  status: "pending",
  complaintRole: "",
};

const getRoleNames = (roles = []) =>
  roles
    .map((role) => (typeof role === "string" ? role : role?.name || ""))
    .filter(Boolean);

const getPrimaryRoleId = (roles = []) =>
  (Array.isArray(roles) ? roles : [roles])
    .map((role) => (typeof role === "string" ? role : role?._id || ""))
    .find(Boolean) || "";

const normalizeRoleName = (value = "") =>
  String(value).trim().toLowerCase().replace(/[\s_-]+/g, " ");

export default function Complaints() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { list: userRoles = [] } = useSelector((state) => state.userRoles);

  const isAdmin = user.role === "admin";
  const complaintState = useSelector((state) => state.complaints);
  const { list: complaints = [], loading, error, success } = complaintState;

  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [models, setModels] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const currentEditComplaint = complaints.find((item) => item._id === editId) || null;
  const tellyCallingRole = userRoles.find(
    (role) => normalizeRoleName(role?.name) === "telly calling",
  );
  const tellyCallingRoleId = tellyCallingRole?._id || "";
  const roleOptions = userRoles.filter(
    (role) => role?._id && role._id !== tellyCallingRoleId,
  );

  useEffect(() => {
    dispatch(listComplaints({ queryString: "" }));
    return () => dispatch(clearComplaintStatus());
  }, [dispatch]);

  useEffect(() => {
    if (isAdmin) {
      dispatch(fetchAllUserRoles());
    }
  }, [dispatch, isAdmin]);

  useEffect(() => {
    const loadComplaintMetadata = async () => {
      try {
        setMetadataLoading(true);
        const [modelsData, categoriesData] = await Promise.all([
          fetchPublicComplaintModels(),
          fetchPublicComplaintServiceCategories(),
        ]);
        setModels(modelsData || []);
        setServiceCategories(categoriesData || []);
      } catch (loadError) {
        toast.error(loadError.message || "Failed to load complaint metadata");
      } finally {
        setMetadataLoading(false);
      }
    };

    loadComplaintMetadata();
  }, []);
  
  const onCommentAdded = useCallback(() => {
    dispatch(listComplaints({ queryString: "" }));
  }, [dispatch]);

  useEffect(() => {
    if (error && !toast.isActive("error-toast")) {
      toast.error(error, { toastId: "error-toast" });
      dispatch(clearComplaintStatus());
    }

    if (success && !toast.isActive("success-toast")) {
      toast.success(success, { toastId: "success-toast" });
      dispatch(clearComplaintStatus());
    }
  }, [error, success, dispatch]);

  const filteredComplaints = complaints.filter((item) => {
    if (
      searchTerm &&
      !item.title?.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    if (filters.status && item.status !== filters.status) return false;
    if (filters.priority && item.priority !== filters.priority) return false;
    // Note: category field removed from new schema
    return true;
  });

  const openCreateSidebar = () => {
    setEditId(null);
    setForm(initialForm);
    setShowSidebar(true);
  };

  const openEditSidebar = (item) => {
    setEditId(item._id);
    setForm({
      customerName: item.customerName || "",
      customerEmail: item.customerEmail || "",
      customerPhone: item.customerPhone || "",
      title: item.title || "",
      description: item.description || "",
      modelId:
        (typeof item.modelId === "object" ? item.modelId?._id : item.modelId) || "",
      modelName:
        item.modelName || (typeof item.modelId === "object" ? item.modelId?.name : "") || "",
      serviceCategoryId:
        (typeof item.serviceCategoryId === "object"
          ? item.serviceCategoryId?._id
          : item.serviceCategoryId) || "",
      serviceCategoryName:
        item.serviceCategoryName ||
        (typeof item.serviceCategoryId === "object"
          ? item.serviceCategoryId?.name
          : "") ||
        "",
      priority: item.priority || "medium",
      status: item.status || "pending",
      complaintRole: getPrimaryRoleId(item.role),
    });
    setShowSidebar(true);
  };

  const closeSidebar = () => {
    setShowSidebar(false);
    setEditId(null);
    setForm(initialForm);
  };

  const openCommentsModal = (complaint) => {
    setSelectedComplaint(complaint);
    setShowCommentsModal(true);
  };

  const closeCommentsModal = () => {
    setShowCommentsModal(false);
    setSelectedComplaint(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "modelId") {
      const selectedModel = models.find((item) => item._id === value);
      setForm((prev) => ({
        ...prev,
        modelId: value,
        modelName: selectedModel?.name || "",
      }));
      return;
    }

    if (name === "serviceCategoryId") {
      const selectedCategory = serviceCategories.find((item) => item._id === value);
      setForm((prev) => ({
        ...prev,
        serviceCategoryId: value,
        serviceCategoryName: selectedCategory?.name || "",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (
      !form.customerName.trim() ||
      !form.customerEmail.trim() ||
      !form.customerPhone.trim()
    ) {
      toast.error("Customer name, email, and phone are required");
      return;
    }

    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description are required");
      return;
    }

    // Construct payload with all fields
    const payload = {
      customerName: form.customerName.trim(),
      customerEmail: form.customerEmail.trim(),
      customerPhone: form.customerPhone.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      modelId: form.modelId || null,
      modelName: form.modelName.trim(),
      serviceCategoryId: form.serviceCategoryId || null,
      serviceCategoryName: form.serviceCategoryName.trim(),
      priority: form.priority.toLowerCase(),
      status: form.status.toLowerCase(),
    };

    if (editId) {
      const currentComplaintRoleId = getPrimaryRoleId(currentEditComplaint?.role);
      if (isAdmin && form.complaintRole && form.complaintRole !== currentComplaintRoleId) {
        payload.role = form.complaintRole;
      }

      // For updates, use PATCH and only send changed fields
      const result = await dispatch(
        updateComplaintAction({
          id: editId,
          updates: payload,
        }),
      );

      if (!result.error) {
        // Refresh the list to ensure it shows the latest data
        dispatch(listComplaints({ queryString: "" }));
        closeSidebar();
      }
      return;
    }

    // For new complaints, use POST with full payload
    const result = await dispatch(createComplaintAction({ formData: payload }));
    if (!result.error) {
      // Refresh the list to show the new complaint
      dispatch(listComplaints({ queryString: "" }));
      closeSidebar();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this complaint?")) return;
    dispatch(deleteComplaintAction({ id }));
  };

  return (
    <div className="complaints-page-wrapper">
      <div className="page-header">
        <div>
          <h1>Complaints Management</h1>
          <p>Track and manage all customer complaints</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-primary" onClick={openCreateSidebar}>
            + Add Complaint
          </button>
        </div>
      </div>

      <div className="search-filter-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search complaints..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          className={`btn-outline ${showFilters ? "active" : ""}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          Filters
        </button>
      </div>

      {showFilters && (
        <div className="filter-panel">
          <div className="filter-row">
            <div className="filter-item">
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div className="filter-item">
              <label>Priority</label>
              <select
                value={filters.priority}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    priority: e.target.value,
                  }))
                }
              >
                <option value="">All priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="filter-actions">
              <button
                className="btn-outline"
                onClick={() => {
                  setShowFilters(false);
                }}
              >
                Apply filters
              </button>
              <button
                className="btn-delete"
                onClick={() =>
                  setFilters({
                    status: "",
                    priority: "",
                  })
                }
              >
                Clear all
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="skeleton-global-container">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Created by</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, idx) => (
                  <tr key={idx}>
                    <td colSpan="6" style={{ textAlign: "center" }}>
                      Loading...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Customer</th>
                <th>Complaint Role</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Created by</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.map((item) => (
                <tr key={item._id}>
                  <td>
                    <span className="text-bold">{item.title}</span>
                  </td>
                  <td>{item.customerName}</td>
                  <td>
                    <span className="complaint-role-pill">
                      {getRoleNames(item.role).join(", ") || "Unassigned"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge status-${item.status?.replace(/_/g, "-")}`}
                    >
                      {item.status?.replace(/_/g, " ").charAt(0).toUpperCase() +
                        item.status?.slice(1).replace(/_/g, " ")}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`priority-badge priority-${item.priority}`}
                    >
                      {item.priority?.charAt(0).toUpperCase() +
                        item.priority?.slice(1)}
                    </span>
                  </td>
                  <td>{item.createdBy?.name || "System"}</td>
                  <td className="text-right">
                    <div className="action-btns">
                      <button
                        className="btn-role"
                        onClick={() => openCommentsModal(item)}
                        title="View comments"
                      >
                        <MdComment size={18} />
                      </button>
                      <button
                        className="btn-role"
                        onClick={() => openEditSidebar(item)}
                      >
                        <MdEdit size={18} />
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(item._id)}
                      >
                        <MdDelete size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredComplaints.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>
                    No complaints found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Right Sidebar Modal */}
      {showSidebar && (
        <>
          <div className="right-sidebar-backdrop" onClick={closeSidebar} />

          <div className="right-sidebar-modal">
            <div className="right-sidebar-header">
              <h3>{editId ? "Edit Complaint" : "Add Complaint"}</h3>
              <button className="sidebar-close-btn" onClick={closeSidebar}>
                ✕
              </button>
            </div>

            <div className="right-sidebar-body">
              {/* Customer Information - 2 Column Layout */}
              <div className="form-section-group">
                <h4>Customer Information</h4>
                <div className="form-row-two">
                  <div className="form-group">
                    <label>Customer Name *</label>
                    <input
                      type="text"
                      name="customerName"
                      value={form.customerName}
                      onChange={handleChange}
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone *</label>
                    <input
                      type="tel"
                      name="customerPhone"
                      value={form.customerPhone}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="form-row-two">
                  <div className="form-group">
                    <label>Customer Email *</label>
                    <input
                      type="email"
                      name="customerEmail"
                      value={form.customerEmail}
                      onChange={handleChange}
                      placeholder="Enter customer email"
                    />
                  </div>
                  {isAdmin && (
                    <div className="form-group">
                      <label>Priority</label>
                      <select
                        name="priority"
                        value={form.priority}
                        onChange={handleChange}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Complaint Details - 2 Column Layout */}
              <div className="form-section-group">
                <h4>Complaint Details</h4>
                {editId && isAdmin && (
                  <div className="form-group">
                    <label>Complaint Role</label>
                    <select
                      name="complaintRole"
                      value={form.complaintRole}
                      onChange={handleChange}
                    >
                      {form.complaintRole === tellyCallingRoleId && tellyCallingRoleId && (
                        <option value={tellyCallingRoleId}>
                          {tellyCallingRole?.name || "Telly Calling"} (current)
                        </option>
                      )}
                      <option value="">Select complaint role</option>
                      {roleOptions.map((role) => (
                        <option key={role._id} value={role._id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-row-two">
                  <div className="form-group">
                    <label>Model</label>
                    <select
                      name="modelId"
                      value={form.modelId}
                      onChange={handleChange}
                      disabled={metadataLoading}
                    >
                      <option value="">
                        {metadataLoading ? "Loading models..." : "Select model"}
                      </option>
                      {models.map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Service Category</label>
                    <select
                      name="serviceCategoryId"
                      value={form.serviceCategoryId}
                      onChange={handleChange}
                      disabled={metadataLoading}
                    >
                      <option value="">
                        {metadataLoading
                          ? "Loading service categories..."
                          : "Select service category"}
                      </option>
                      {serviceCategories.map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Full Width Fields */}
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Enter complaint title"
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Enter complaint description"
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            <div className="right-sidebar-footer">
              <button className="btn-delete" onClick={closeSidebar}>
                Cancel
              </button>
              <button
                className="btn-role"
                onClick={handleSubmit}
                disabled={
                  loading || !form.title.trim() || !form.description.trim()
                }
              >
                {loading ? "Saving..." : editId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Comments Modal */}
      {showCommentsModal && selectedComplaint && (
        <CommentsModal
          complaint={selectedComplaint}
          isOpen={showCommentsModal}
          onClose={closeCommentsModal}
          onCommentAdded={onCommentAdded}
        />
      )}
    </div>
  );
}

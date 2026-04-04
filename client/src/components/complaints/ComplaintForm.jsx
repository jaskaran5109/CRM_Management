import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createComplaintAction } from "../../redux/slices/complaintSlice";
import "./ComplaintForm.css";

export default function ComplaintForm({ onSuccess }) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.complaints);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium",
  });
  const [attachments, setAttachments] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = "Title is required";
    if (!formData.description.trim()) errors.description = "Description is required";
    if (!formData.category.trim()) errors.category = "Category is required";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      data.append(key, formData[key]);
    });
    if (attachments) {
      Array.from(attachments).forEach((file) => {
        data.append("attachments", file);
      });
    }

    await dispatch(createComplaintAction({ formData: data }));
    if (onSuccess) onSuccess();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="complaint-form-card">
      <div>
        <label htmlFor="title" className="complaint-form-label">
          Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={`complaint-form-input ${validationErrors.title ? "border-red-500" : ""}`}
          placeholder="Brief title for your complaint"
          required
        />
        {validationErrors.title && (
          <p className="complaint-form-error">{validationErrors.title}</p>
        )}
      </div>

      <div className="complaint-form-full-width">
        <label htmlFor="description" className="complaint-form-label">
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={5}
          className={`complaint-form-textarea ${validationErrors.description ? "border-red-500" : ""}`}
          placeholder="Detailed description of your complaint"
          required
        />
        {validationErrors.description && (
          <p className="complaint-form-error">{validationErrors.description}</p>
        )}
      </div>

      <div>
        <label htmlFor="category" className="complaint-form-label">
          Category *
        </label>
        <input
          type="text"
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className={`complaint-form-input ${validationErrors.category ? "border-red-500" : ""}`}
          placeholder="e.g., Product, Service, Billing"
          required
        />
        {validationErrors.category && (
          <p className="complaint-form-error">{validationErrors.category}</p>
        )}
      </div>

      <div>
        <label htmlFor="priority" className="complaint-form-label">
          Priority
        </label>
        <select
          id="priority"
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          className="complaint-form-select"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div className="complaint-form-full-width">
        <label htmlFor="attachments" className="complaint-form-file-label">
          Attachments
        </label>
        <input
          type="file"
          id="attachments"
          multiple
          onChange={(e) => setAttachments(e.target.files)}
          className="complaint-form-file-input"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
        <p className="complaint-form-file-preview">
          Upload images, PDFs, or documents (max 5MB each)
        </p>
      </div>

      {error && (
        <div className="complaint-form-error">
          {error}
        </div>
      )}

      <div className="complaint-form-actions">
        <button
          type="submit"
          disabled={loading}
          className="complaint-form-submit-btn"
        >
          {loading ? (
            <div className="complaint-form-loading">
              <div className="complaint-form-spinner"></div>
              Creating...
            </div>
          ) : (
            "Submit Complaint"
          )}
        </button>
      </div>
    </form>
  );
}

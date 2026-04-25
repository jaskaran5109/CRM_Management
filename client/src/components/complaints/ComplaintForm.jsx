import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createComplaintAction } from "../../redux/slices/complaintSlice";
import "./ComplaintForm.css";

export default function ComplaintForm({ onSuccess }) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.complaints);

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    title: "",
    description: "",
    modelName: "",
    serviceCategoryName: "",
    priority: "medium",
  });
  const [attachments, setAttachments] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    if (!formData.customerName.trim()) errors.customerName = "Customer name is required";
    if (!formData.customerEmail.trim()) errors.customerEmail = "Customer email is required";
    if (!formData.customerPhone.trim()) errors.customerPhone = "Customer phone is required";
    if (!formData.title.trim()) errors.title = "Title is required";
    if (!formData.description.trim()) errors.description = "Description is required";
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

    const result = await dispatch(createComplaintAction({ formData: data }));
    if (!result.error && onSuccess) onSuccess();
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
        <label htmlFor="customerName" className="complaint-form-label">
          Customer Name *
        </label>
        <input
          type="text"
          id="customerName"
          name="customerName"
          value={formData.customerName}
          onChange={handleChange}
          className={`complaint-form-input ${validationErrors.customerName ? "border-red-500" : ""}`}
          placeholder="Customer full name"
          required
        />
        {validationErrors.customerName && (
          <p className="complaint-form-error">{validationErrors.customerName}</p>
        )}
      </div>

      <div>
        <label htmlFor="customerEmail" className="complaint-form-label">
          Customer Email *
        </label>
        <input
          type="email"
          id="customerEmail"
          name="customerEmail"
          value={formData.customerEmail}
          onChange={handleChange}
          className={`complaint-form-input ${validationErrors.customerEmail ? "border-red-500" : ""}`}
          placeholder="customer@example.com"
          required
        />
        {validationErrors.customerEmail && (
          <p className="complaint-form-error">{validationErrors.customerEmail}</p>
        )}
      </div>

      <div>
        <label htmlFor="customerPhone" className="complaint-form-label">
          Customer Phone *
        </label>
        <input
          type="tel"
          id="customerPhone"
          name="customerPhone"
          value={formData.customerPhone}
          onChange={handleChange}
          className={`complaint-form-input ${validationErrors.customerPhone ? "border-red-500" : ""}`}
          placeholder="10-digit phone number"
          required
        />
        {validationErrors.customerPhone && (
          <p className="complaint-form-error">{validationErrors.customerPhone}</p>
        )}
      </div>

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
        <label htmlFor="modelName" className="complaint-form-label">
          Model Name
        </label>
        <input
          type="text"
          id="modelName"
          name="modelName"
          value={formData.modelName}
          onChange={handleChange}
          className="complaint-form-input"
          placeholder="Product or model name"
        />
      </div>

      <div>
        <label htmlFor="serviceCategoryName" className="complaint-form-label">
          Service Category
        </label>
        <input
          type="text"
          id="serviceCategoryName"
          name="serviceCategoryName"
          value={formData.serviceCategoryName}
          onChange={handleChange}
          className="complaint-form-input"
          placeholder="Installation, service, billing, etc."
        />
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

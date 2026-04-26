import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "../styles/PublicComplaintForm.css";
import {
  createPublicComplaint,
  fetchPublicComplaintModels,
  fetchPublicComplaintServiceCategories,
} from "../services/publicComplaintService";

export default function PublicComplaintForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [models, setModels] = useState([]);
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
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
  });

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        setMetadataLoading(true);
        const [modelsData, categoriesData] = await Promise.all([
          fetchPublicComplaintModels(),
          fetchPublicComplaintServiceCategories(),
        ]);
        setModels(modelsData || []);
        setCategories(categoriesData || []);
      } catch (error) {
        toast.error(error.message || "Failed to load complaint options");
      } finally {
        setMetadataLoading(false);
      }
    };

    loadMetadata();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "modelId") {
      const selectedModel = models.find((item) => item._id === value);
      setFormData((prev) => ({
        ...prev,
        modelId: value,
        modelName: selectedModel?.name || "",
      }));
      return;
    }

    if (name === "serviceCategoryId") {
      const selectedCategory = categories.find((item) => item._id === value);
      setFormData((prev) => ({
        ...prev,
        serviceCategoryId: value,
        serviceCategoryName: selectedCategory?.name || "",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (
        !formData.customerName.trim() ||
        !formData.customerEmail.trim() ||
        !formData.customerPhone.trim() ||
        !formData.title.trim() ||
        !formData.description.trim()
      ) {
        toast.error("Please fill in all required fields");
        setLoading(false);
        return;
      }

      // Create complaint
      const result = await createPublicComplaint(formData);
      const trackingId = result?.trackingId || result?.data?._id;

      if (!trackingId) {
        throw new Error("Complaint was created but tracking ID was not returned");
      }

      toast.success("Complaint submitted successfully! Check your email for confirmation.");
      
      // Redirect to tracking page with tracking ID
      navigate(`/track-complaint?id=${trackingId}&phone=${formData.customerPhone}`);
    } catch (error) {
      toast.error(error.message || "Failed to submit complaint");
      console.error("Submit error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="complaint-form-container">
      <div className="complaint-form-wrapper">
        <div className="form-header">
          <h1 >Submit a Complaint</h1>
          <p>We're here to help. Please provide details about your complaint.</p>
        </div>

        <form onSubmit={handleSubmit} className="complaint-form">
          {/* Customer Information Section */}
          <div className="form-section-group">
            <h4>Your Information</h4>

            {/* Row 1: Name, Phone */}
            <div className="form-row-two">
              <div className="form-group">
                <label htmlFor="customerName">
                  Full Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="customerPhone">
                  Phone Number <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  id="customerPhone"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  required
                />
                <small>This will be used to track your complaint</small>
              </div>
            </div>

            {/* Row 2: Email, Priority */}
            <div className="form-row-two">
              <div className="form-group">
                <label htmlFor="customerEmail">
                  Email Address <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="customerEmail"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  required
                />
              </div>
            </div>
          </div>

          {/* Complaint Details Section */}
          <div className="form-section-group">
            <h4>Complaint Details</h4>

            {/* Row 1: Model, Service Category */}
            <div className="form-row-two">
              <div className="form-group">
                <label htmlFor="modelId">Model</label>
                <select
                  id="modelId"
                  name="modelId"
                  value={formData.modelId}
                  onChange={handleChange}
                  disabled={metadataLoading}
                >
                  <option value="">
                    {metadataLoading ? "Loading models..." : "Select model"}
                  </option>
                  {models.map((model) => (
                    <option key={model._id} value={model._id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="serviceCategoryId">Service Category</label>
                <select
                  id="serviceCategoryId"
                  name="serviceCategoryId"
                  value={formData.serviceCategoryId}
                  onChange={handleChange}
                  disabled={metadataLoading}
                >
                  <option value="">
                    {metadataLoading
                      ? "Loading service categories..."
                      : "Select service category"}
                  </option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Title (full width) */}
            <div className="form-group">
              <label htmlFor="title">
                Complaint Title <span className="required">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Brief title of your complaint"
                required
              />
            </div>

            {/* Row 3: Description (full width) */}
            <div className="form-group">
              <label htmlFor="description">
                Description <span className="required">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your complaint in detail"
                rows="5"
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Complaint"}
            </button>
            <button
              type="reset"
              className="btn btn-outline"
              onClick={() => setFormData({
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
              })}
            >
              Clear Form
            </button>
          </div>
        </form>

        <div className="form-info">
          <h3>What happens next?</h3>
          <ul>
            <li>✓ You'll receive a confirmation email with your reference ID</li>
            <li>✓ Our team will review your complaint</li>
            <li>✓ You can track your complaint using your phone number</li>
            <li>✓ We'll update you via email on the status</li>
          </ul>
        </div>

        <div className="form-tracking-section">
          <h3>Already submitted a complaint?</h3>
          <p>Use your phone number to track the status of your complaint.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate("/track-complaint")}
          >
            View My Complaints
          </button>
        </div>
      </div>
    </div>
  );
}

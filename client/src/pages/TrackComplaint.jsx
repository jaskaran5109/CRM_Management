import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import "../styles/TrackComplaint.css";

export default function TrackComplaint() {
  const [searchLoading, setSearchLoading] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const params = new URLSearchParams(window.location.search);
  const initialPhone = params.get("phone") || "";

  const [searchForm, setSearchForm] = useState({
    customerPhone: initialPhone,
    customerEmail: "",
  });

  useEffect(() => {
    handleSearch({ preventDefault: () => {} });
  }, [initialPhone])
  

  // Handle search form change
  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle search submit
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchForm.customerPhone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }

    setSearchLoading(true);

    try {
      const params = new URLSearchParams();
      params.append("customerPhone", searchForm.customerPhone);
      if (searchForm.customerEmail) {
        params.append("customerEmail", searchForm.customerEmail);
      }

      const response = await fetch(`/api/public/complaints?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch complaints");
      }

      setComplaints(result.data || []);
      setSelectedComplaint(null);
      setComments([]);

      if (result.data?.length === 0) {
        toast.info("No complaints found for this phone number");
      } else {
        toast.success(`Found ${result.data.length} complaint(s)`);
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch complaints");
      console.error("Search error:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle complaint selection
  const handleSelectComplaint = async (complaint) => {
    setSelectedComplaint(complaint);
    
    // Fetch comments
    try {
      const params = new URLSearchParams();
      params.append("customerPhone", searchForm.customerPhone);
      if (searchForm.customerEmail) {
        params.append("customerEmail", searchForm.customerEmail);
      }

      const response = await fetch(
        `/api/public/complaints/${complaint._id}?${params.toString()}`
      );
      const result = await response.json();

      if (response.ok) {
        setComments(result.comments || []);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  // Handle add comment
  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    setCommentLoading(true);

    try {
      const response = await fetch(
        `/api/public/complaints/${selectedComplaint._id}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerPhone: searchForm.customerPhone,
            customerEmail: searchForm.customerEmail,
            message: commentText,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to add comment");
      }

      setComments((prev) => [...prev, result.data]);
      setCommentText("");
      toast.success("Comment added successfully");
    } catch (error) {
      toast.error(error.message || "Failed to add comment");
      console.error("Comment error:", error);
    } finally {
      setCommentLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    return `status-badge status-${status?.replace(" ", "-").toLowerCase()}`;
  };

  const getPriorityBadgeClass = (priority) => {
    return `priority-badge priority-${priority?.toLowerCase()}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="track-complaint-container">
      {/* Search Section */}
      <div className="search-section">
        <div className="search-wrapper">
          <h1>Track Your Complaint</h1>
          <p>Enter your phone number and email (optional) to view your complaints</p>

          <form onSubmit={handleSearch} className="search-form">
            <div className="form-group">
              <label htmlFor="customerPhone">Phone Number *</label>
              <input
                type="tel"
                id="customerPhone"
                name="customerPhone"
                value={searchForm.customerPhone}
                onChange={handleSearchChange}
                placeholder="Enter your phone number"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="customerEmail">Email (Optional)</label>
              <input
                type="email"
                id="customerEmail"
                name="customerEmail"
                value={searchForm.customerEmail}
                onChange={handleSearchChange}
                placeholder="Enter your email address"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={searchLoading}
            >
              {searchLoading ? "Searching..." : "Search Complaints"}
            </button>
          </form>
        </div>
      </div>

      {/* Results Section */}
      {complaints.length > 0 && (
        <div className="results-section">
          <div className="complaints-list">
            <h2>Your Complaints ({complaints.length})</h2>
            
            {complaints.map((complaint) => (
              <div
                key={complaint._id}
                className={`complaint-card ${selectedComplaint?._id === complaint._id ? "active" : ""}`}
                onClick={() => handleSelectComplaint(complaint)}
              >
                <div className="complaint-header">
                  <div style={{ textAlign: 'start'}}>
                    <h3>{complaint.title}</h3>
                    <p className="complaint-ref">Reference ID: {complaint._id}</p>
                  </div>
                  <span className={getStatusBadgeClass(complaint.status)}>
                    {complaint.status}
                  </span>
                </div>

                <div className="complaint-meta">
                  <span className={getPriorityBadgeClass(complaint.priority)}>
                    {complaint.priority}
                  </span>
                  <span className="date">{formatDate(complaint.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Detail Section */}
          {selectedComplaint && (
            <div className="complaint-detail">
              <div className="detail-header">
                <h2>Complaint Details</h2>
                <span className={getStatusBadgeClass(selectedComplaint.status)}>
                  {selectedComplaint.status}
                </span>
              </div>

              <div className="detail-content">
                <div className="detail-field">
                  <label>Reference ID</label>
                  <p>{selectedComplaint._id}</p>
                </div>

                <div className="detail-field">
                  <label>Title</label>
                  <p>{selectedComplaint.title}</p>
                </div>

                <div className="detail-field">
                  <label>Description</label>
                  <p>{selectedComplaint.description}</p>
                </div>

                <div className="detail-row">
                  <div className="detail-field">
                    <label>Priority</label>
                    <p className={`badge ${getPriorityBadgeClass(selectedComplaint.priority)}`}>
                      {selectedComplaint.priority}
                    </p>
                  </div>

                  <div className="detail-field">
                    <label>Model</label>
                    <p>{selectedComplaint.modelName || "N/A"}</p>
                  </div>

                  <div className="detail-field">
                    <label>Category</label>
                    <p>{selectedComplaint.serviceCategoryName || "N/A"}</p>
                  </div>
                </div>

                <div className="detail-row">
                  <div className="detail-field">
                    <label>Submitted</label>
                    <p>{formatDate(selectedComplaint.createdAt)}</p>
                  </div>

                  <div className="detail-field">
                    <label>Last Updated</label>
                    <p>{formatDate(selectedComplaint.updatedAt)}</p>
                  </div>
                </div>

                {selectedComplaint.assignedTo && (
                  <div className="detail-field">
                    <label>Assigned To</label>
                    <p>{selectedComplaint.assignedTo.name}</p>
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div className="comments-section">
                <h3>Updates & Comments</h3>

                <div className="comments-list">
                  {comments.length === 0 ? (
                    <p className="no-comments">No updates yet</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment._id} className="comment">
                        <div className="comment-header">
                          <strong>{comment.customerName || comment.userId?.name}</strong>
                          <span className="comment-date">{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="comment-message">{comment.message}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="add-comment-form">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add your comment here..."
                    rows="3"
                  />
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={commentLoading}
                  >
                    {commentLoading ? "Adding..." : "Add Comment"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {complaints.length === 0 && searchForm.customerPhone && !searchLoading && (
        <div className="empty-state">
          <p>No complaints found. Submit a new complaint to get started!</p>
        </div>
      )}
    </div>
  );
}

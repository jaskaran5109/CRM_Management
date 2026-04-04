import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import "./CommentsModal.css";

export default function CommentsModal({ complaint, isOpen, onClose, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch comments when modal opens
  useEffect(() => {
    if (isOpen && complaint?._id) {
      fetchComments();
    }
  }, [isOpen, complaint?._id]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `/api/complaints/${complaint._id}/comments?includeInternal=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }

      const result = await response.json();
      setComments(result.data || []);
    } catch (error) {
      console.error("Fetch comments error:", error);
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/complaints/${complaint._id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: commentText,
          isInternal,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      const result = await response.json();
      setComments((prev) => [...prev, result.data]);
      setCommentText("");
      setIsInternal(false);
      toast.success("Comment added successfully");

      // Call callback
      if (onCommentAdded) {
        onCommentAdded(result.data);
      }
    } catch (error) {
      console.error("Submit comment error:", error);
      toast.error(error.message || "Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="comments-modal-overlay" onClick={onClose}>
      <div className="comments-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Comments - {complaint?.title}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-content">
          {/* Comments List */}
          <div className="comments-list-container">
            <h3>All Comments</h3>
            {loading ? (
              <div className="loading">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="no-comments">No comments yet</div>
            ) : (
              <div className="comments-list">
                {comments.map((comment) => (
                  <div
                    key={comment._id}
                    className={`comment-item ${comment.isInternal ? "internal" : "public"}`}
                  >
                    <div className="comment-top">
                      <strong className="comment-author">
                        {comment.userId?.name || comment.customerName || "Customer"}
                      </strong>
                      {comment.isInternal && <span className="badge-internal">Internal</span>}
                      <span className="comment-date">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="comment-text">{comment.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Comment Form */}
          <div className="add-comment-section">
            <h3>Add Comment</h3>
            <form onSubmit={handleSubmitComment}>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Type your comment here..."
                rows="4"
              />

              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="isInternal"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                />
                <label htmlFor="isInternal">
                  Mark as internal (not visible to customer)
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Adding..." : "Add Comment"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

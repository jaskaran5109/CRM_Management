import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  getComplaint,
  updateComplaintAction,
  fetchComplaintHistoryAction,
  clearComplaintStatus,
} from "../redux/slices/complaintSlice";
import { fetchComments, addComment } from "../services/complaintService";
import ComplaintTimeline from "../components/complaints/ComplaintTimeline";
import "./ComplaintDetail.css";
import { fetchAllStatuses } from "../redux/slices/adminSlices/statusSlice";
import { fetchAllUsers } from "../redux/slices/userSlice";

const getStatusBadge = (status) => {
  const badges = {
    open: "complaint-detail-status-open",
    in_progress: "complaint-detail-status-in_progress",
    resolved: "complaint-detail-status-resolved",
    closed: "complaint-detail-status-closed",
  };
  return badges[status] || "complaint-detail-status-closed";
};

const getPriorityBadge = (priority) => {
  const badges = {
    low: "complaint-detail-priority-low",
    medium: "complaint-detail-priority-medium",
    high: "complaint-detail-priority-high",
  };
  return badges[priority] || "complaint-detail-priority-low";
};

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { current, history, loading, error, success } = useSelector(
    (state) => state.complaints,
  );
  const { user } = useSelector((state) => state.auth);
  const [comment, setComment] = useState("");
  const [commentList, setCommentList] = useState([]);
  const [status, setStatus] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [priority, setPriority] = useState("");
  const [assignedUser, setAssignedUser] = useState("");
  const { users } = useSelector((state) => state.users);    
console.log(current);

  useEffect(() => {
    dispatch(getComplaint({ id }));
    dispatch(fetchComplaintHistoryAction({ id }));
    dispatch(fetchAllUsers());

    const loadComments = async () => {
      setCommentsLoading(true);
      try {
        const token = user?.token;
        if (!token) return;
        const data = await fetchComments(id, token);
        setCommentList(data);
      } catch (err) {
        console.error("Failed to load comments:", err);
      } finally {
        setCommentsLoading(false);
      }
    };
    loadComments();
  }, [dispatch, id, user?.token]);

  useEffect(() => {
    if (current) {
      setStatus(current.status);
    }
    if(current?.priority) {
      setPriority(current.priority);
    }
    if(current?.assignedTo?._id) {
      setAssignedUser(current.assignedTo?._id || "");
    }
  }, [current]);

  useEffect(() => {
    if (success || error) {
      const timeout = setTimeout(() => {
        dispatch(clearComplaintStatus());
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [success, error, dispatch]);

  const handleStatusUpdate = async () => {
    if (!status || status === current.status) return;
    await dispatch(updateComplaintAction({ id, updates: { status } }));
    dispatch(fetchComplaintHistoryAction({ id }));
  };

  const handleInternalNote = async () => {
    if (!internalNote.trim()) return;
    await dispatch(updateComplaintAction({ id, updates: { internalNote } }));
    setInternalNote("");
    dispatch(fetchComplaintHistoryAction({ id }));
  };

  const handlePriorityUpdate = async () => {
    if (!priority || priority === current.priority) return;
    await dispatch(updateComplaintAction({ id, updates: { priority } }));
    dispatch(fetchComplaintHistoryAction({ id }));
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    const token = user?.token;
    try {
      const data = await addComment(id, { message: comment }, token);
      if (data._id) {
        setComment("");
        const comments = await fetchComments(id, token);
        setCommentList(comments);
        dispatch(fetchComplaintHistoryAction({ id }));
      }
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  const handleAssignUser = async () => {
    if (!assignedUser) return;
    await dispatch(
      updateComplaintAction({ id, updates: { assignedTo: assignedUser } }),
    );
    dispatch(fetchComplaintHistoryAction({ id }));
  };

  if (loading) {
    return (
      <div className="complaint-detail-container">
        <div className="complaint-detail-loading">
          <div className="complaint-detail-loading-item"></div>
          <div className="complaint-detail-loading-item"></div>
          <div className="complaint-detail-loading-item"></div>
          <div className="complaint-detail-loading-item"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="complaint-detail-container">
        <div className="complaint-detail-error">
          <div className="complaint-detail-error-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="complaint-detail-error-title">
            Error loading complaint
          </h3>
          <p className="complaint-detail-error-message">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="complaint-detail-error-btn"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="complaint-detail-container">
        <div className="complaint-detail-not-found">
          <div className="complaint-detail-not-found-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="complaint-detail-not-found-title">
            Complaint not found
          </h3>
          <button
            onClick={() => navigate(-1)}
            className="complaint-detail-error-btn"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="complaint-detail-container">
      {/* Header */}
      <div className="complaint-detail-header">
        <button
          onClick={() => navigate(-1)}
          className="complaint-detail-back-btn"
        >
          <svg
            className="complaint-detail-back-icon"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Complaints
        </button>
        <div className="complaint-detail-header-content">
          <div>
            <h1 className="complaint-detail-title">{current.title}</h1>
            <div className="complaint-detail-badges">
              <span
                className={`complaint-detail-priority-badge ${getPriorityBadge(current.priority)}`}
              >
                {current.priority}
              </span>
              <span
                className={`complaint-detail-status-badge ${getStatusBadge(current.status)}`}
              >
                {current.status.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {success && (
        <div className="complaint-detail-success-alert">
          <div className="complaint-detail-success-content">
            <div className="complaint-detail-success-icon">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="complaint-detail-success-text">
              <p className="complaint-detail-success-message">{success}</p>
            </div>
          </div>
        </div>
      )}

      <div className="complaint-detail-grid">
        {/* Main Content */}
        <div className="complaint-detail-main">
          {/* Complaint Details */}
          <div className="complaint-detail-card">
            <h2 className="complaint-detail-card-title">Details</h2>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="complaint-detail-description">
                {current.description}
              </p>
            </div>
            <div className="complaint-detail-meta">
              <div className="complaint-detail-meta-item">
                <span className="complaint-detail-meta-label">Category:</span>
                <span className="complaint-detail-meta-value">
                  {current.category}
                </span>
              </div>
              <div className="complaint-detail-meta-item">
                <span className="complaint-detail-meta-label">Created by:</span>
                <span className="complaint-detail-meta-value">
                  {current.createdBy?.name || "Unknown"}
                </span>
              </div>
              {current.assignedTo && (
                <div className="complaint-detail-meta-item">
                  <span className="complaint-detail-meta-label">
                    Assigned to:
                  </span>
                  <span className="complaint-detail-meta-value">
                    {current.assignedTo.name}
                  </span>
                </div>
              )}
              <div className="complaint-detail-meta-item">
                <span className="complaint-detail-meta-label">Created:</span>
                <span className="complaint-detail-meta-value">
                  {new Date(current.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="complaint-detail-card">
            <h2 className="complaint-detail-card-title">Comments</h2>
            <div className="complaint-detail-comments">
              {commentsLoading ? (
                <div className="complaint-detail-loading">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="complaint-detail-loading-item">
                      <div className="complaint-detail-loading-header"></div>
                      <div className="complaint-detail-loading-content"></div>
                    </div>
                  ))}
                </div>
              ) : commentList.length > 0 ? (
                commentList.map((c) => (
                  <div key={c._id} className="complaint-detail-comment">
                    <div className="complaint-detail-comment-header">
                      <span className="complaint-detail-comment-author">
                        {c.userId?.name || "Unknown"}
                      </span>
                      <span className="complaint-detail-comment-time">
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="complaint-detail-comment-text">{c.message}</p>
                  </div>
                ))
              ) : (
                <p className="complaint-detail-no-comments">No comments yet.</p>
              )}
            </div>

            <div className="complaint-detail-comment-form">
              <label
                htmlFor="comment"
                className="complaint-detail-comment-label"
              >
                Add a comment
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="complaint-detail-comment-input"
                placeholder="Write your comment here..."
              />
              <button
                onClick={handleComment}
                disabled={!comment.trim()}
                className="complaint-detail-btn complaint-detail-btn-primary"
              >
                Add Comment
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="complaint-detail-sidebar">
          {/* Update Status */}
          {(user?.role === "admin" || user?.role === "agent") && (
            <div className="complaint-detail-card">
              <h3 className="complaint-detail-card-title">Update Status</h3>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="complaint-detail-select"
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <button
                onClick={handleStatusUpdate}
                disabled={!status}
                className="complaint-detail-btn complaint-detail-btn-primary"
              >
                Update Status
              </button>
            </div>
          )}

          {/* Update Priority */}
          {(user?.role === "admin" || user?.role === "agent") && (
            <div className="complaint-detail-card">
              <h3 className="complaint-detail-card-title">Update Priority</h3>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="complaint-detail-select"
              >
                <option value="">Select Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <button
                onClick={handlePriorityUpdate}
                disabled={!priority}
                className="complaint-detail-btn complaint-detail-btn-primary"
              >
                Update Priority
              </button>
            </div>
          )}

          {/* Assign User */}
          {(user?.role === "admin" || user?.role === "agent") && (
            <div className="complaint-detail-card">
              <h3 className="complaint-detail-card-title">Assign User</h3>
              <select
                value={assignedUser}
                onChange={(e) => setAssignedUser(e.target.value)}
                className="complaint-detail-select"
              >
                <option value="">Select User</option>
                {users?.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAssignUser}
                disabled={!assignedUser}
                className="complaint-detail-btn complaint-detail-btn-primary"
              >
                Assign User
              </button>
            </div>
          )}

          {/* Internal Notes */}
          {(user?.role === "admin" || user?.role === "agent") && (
            <div className="complaint-detail-card">
              <h3 className="complaint-detail-card-title">Internal Notes</h3>
              <textarea
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                rows={3}
                className="complaint-detail-comment-input"
                placeholder="Add internal notes..."
              />
              <button
                onClick={handleInternalNote}
                disabled={!internalNote.trim()}
                className="complaint-detail-btn complaint-detail-btn-secondary"
              >
                Add Note
              </button>
            </div>
          )}

          {/* Timeline */}
          <div className="complaint-detail-card">
            <h3 className="complaint-detail-card-title">Activity Timeline</h3>
            <ComplaintTimeline complaintId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}

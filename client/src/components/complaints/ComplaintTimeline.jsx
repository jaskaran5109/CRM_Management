import "./ComplaintTimeline.css";

export default function ComplaintTimeline({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="complaint-timeline-empty">
        <div className="complaint-timeline-empty-icon">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="complaint-timeline-empty-title">No history yet</h3>
        <p className="complaint-timeline-empty-message">Activity will appear here as the complaint progresses.</p>
      </div>
    );
  }

  return (
    <div className="complaint-timeline-container">
      <h3 className="complaint-timeline-title">Activity Timeline</h3>
      <div className="complaint-timeline-list">
        {history.map((item, itemIdx) => (
          <div key={item._id} className="complaint-timeline-item">
            <div className="complaint-timeline-dot"></div>
            <div className="complaint-timeline-content">
              <div className="complaint-timeline-header">
                <p className="complaint-timeline-action">
                  {item.action.replace("_", " ")}
                </p>
                <p className="complaint-timeline-user">
                  {item.updatedBy?.name || "System"}
                </p>
              </div>
              <p className="complaint-timeline-message">{item.message}</p>
              <p className="complaint-timeline-time">
                {new Date(item.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

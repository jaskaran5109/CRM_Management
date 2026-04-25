import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearComplaintStatus } from "../redux/slices/complaintSlice";
import ComplaintForm from "../components/complaints/ComplaintForm";
import "./CreateComplaint.css";

export default function CreateComplaint() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { success } = useSelector((state) => state.complaints);

  useEffect(() => {
    if (success) {
      dispatch(clearComplaintStatus());
      navigate("/complaints");
    }
  }, [success, dispatch, navigate]);

  const handleSuccess = () => {
    navigate("/complaints");
  };

  return (
    <div className="create-complaint-container">
      <div className="create-complaint-header">
        <h1 className="create-complaint-title">Create New Complaint</h1>
        <p className="create-complaint-subtitle">
          Submit a complaint and we'll help resolve it as quickly as possible.
        </p>
      </div>

      <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-sm)]">
        <ComplaintForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}


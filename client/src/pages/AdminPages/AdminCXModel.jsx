import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Modal from "../../components/common/Modal";
import { TableSkeleton } from "../../components/common/Skeleton";
import "./Admin.css";
import {
  fetchAllCXModels,
  clearCXModelMessages,
  updateCXModel,
  createMultipleCXModels,
  deleteCXModel,
} from "../../redux/slices/adminSlices/cxModelSlice";
import { fetchAllStatuses } from "../../redux/slices/adminSlices/statusSlice";
import { toast } from "react-toastify";
import { MdDelete, MdEdit } from "react-icons/md";

export default function AdminCXModels() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const {
    list: cxModels,
    loading,
    error,
    successMessage,
  } = useSelector((state) => state.cxModels);

  const { list: statuses = [] } = useSelector((state) => state.statuses || {});

  const [showModal, setShowModal] = useState(false);
  const [cxModelInput, setCXModelInput] = useState("");
  const [cxModelList, setCXModelList] = useState([]);
  const [editId, setEditId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");

  const activeStatus = useMemo(() => {
    return statuses.find((s) => s.name?.toUpperCase() === "ACTIVE");
  }, [statuses]);

  useEffect(() => {
    dispatch(fetchAllCXModels());
    dispatch(fetchAllStatuses());

    return () => dispatch(clearCXModelMessages());
  }, [dispatch]);

  useEffect(() => {
    if (!error && !successMessage) return;

    const timer = setTimeout(() => {
      dispatch(clearCXModelMessages());
    }, 2000);

    return () => clearTimeout(timer);
  }, [error, successMessage, dispatch]);

  useEffect(() => {
    if (error && !toast.isActive("error-toast")) {
      toast.error(error, { toastId: "error-toast" });
      dispatch(clearCXModelMessages());
    }

    if (successMessage && !toast.isActive("success-toast")) {
      toast.success(successMessage, { toastId: "success-toast" });
      dispatch(clearCXModelMessages());
    }
  }, [error, successMessage]);

  const openAddModal = () => {
    setEditId(null);
    setCXModelList([]);
    setCXModelInput("");
    setSelectedStatus(activeStatus?._id || "");
    setShowModal(true);
  };

  const openEditModal = (cxModel) => {
    setEditId(cxModel._id);
    setCXModelInput(cxModel.name);
    setSelectedStatus(cxModel.status?._id || "");
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this CX model?")) {
      dispatch(deleteCXModel(id));
    }
  };

  const handleAddCXModel = () => {
    const trimmed = cxModelInput.trim();
    if (!trimmed) return;

    if (cxModelList.includes(trimmed)) return;

    setCXModelList([...cxModelList, trimmed]);
    setCXModelInput("");
  };

  const handleRemoveCXModel = (index) => {
    const updated = [...cxModelList];
    updated.splice(index, 1);
    setCXModelList(updated);
  };

  const handleSubmit = () => {
    if (editId) {
      if (!cxModelInput.trim() || !selectedStatus) return;

      dispatch(
        updateCXModel({
          id: editId,
          name: cxModelInput.trim(),
          status: selectedStatus,
        }),
      );

      closeModal();
      return;
    }

    let finalList = [...cxModelList];

    if (cxModelInput.trim()) {
      finalList.push(cxModelInput.trim());
    }

    finalList = [...new Set(finalList)];

    if (finalList.length === 0 || !selectedStatus) return;

    dispatch(
      createMultipleCXModels({
        cxModels: finalList,
        status: selectedStatus,
      }),
    );

    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setCXModelInput("");
    setCXModelList([]);
    setSelectedStatus("");
  };

  return (
    <div className="admin-page dashboard">
      <div className="dash-header">
        <div>
          <h2>Admin CX Models</h2>
          <p className="subtitle">Manage all CX models</p>
        </div>
        <div className="action-btns">
          <button className="btn-primary" onClick={openAddModal}>
            Add CX Model
          </button>
        </div>
      </div>

      {loading ? (
        <div className="skeleton-global-container">
          <TableSkeleton rows={6} cols={3} />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cxModels.map((model) => (
                <tr key={model._id}>
                  <td>{model.name}</td>
                  <td
                    style={{
                      marginTop: "15px",
                    }}
                  >
                    <span
                      className={`status-badge ${model.status?.name?.toLowerCase() || "unknown"}`}
                    >
                      {model.status?.name || "-"}{" "}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="action-btns">
                      <button
                        className="btn-role"
                        onClick={() => openEditModal(model)}
                      >
                          <MdEdit size={18} />
                      </button>

                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(model._id)}
                      >
                        <MdDelete size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editId ? "Edit CX Model" : "Add CX Model"}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {editId ? (
            <input
              type="text"
              value={cxModelInput}
              onChange={(e) => setCXModelInput(e.target.value)}
              placeholder="Update CX model name"
            />
          ) : (
            <>
              <div className="input-group">
                <input
                  type="text"
                  value={cxModelInput}
                  onChange={(e) => setCXModelInput(e.target.value)}
                  placeholder="Enter CX model"
                />
                <button className="btn-role" onClick={handleAddCXModel}>
                  Add
                </button>
              </div>

              <ul>
                {cxModelList.map((item, i) => (
                  <li key={i}>
                    {item}
                    <button
                      className="btn-delete"
                      onClick={() => handleRemoveCXModel(i)}
                    >
                      ✖
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">Select status</option>
            {statuses.map((status) => (
              <option key={status._id} value={status._id}>
                {status.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleSubmit}
            disabled={
              editId
                ? !cxModelInput.trim() || !selectedStatus || loading
                : (cxModelList.length === 0 && !cxModelInput.trim()) ||
                  !selectedStatus ||
                  loading
            }
            className="btn-role"
          >
            {loading ? "Saving..." : editId ? "Update" : "Submit"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  clearStatusMessages,
  createMultipleStatuses,
  deleteStatus,
  fetchAllStatuses,
  updateStatus,
} from "../../redux/slices/adminSlices/statusSlice";
import Modal from "../../components/common/Modal";
import { TableSkeleton } from "../../components/common/Skeleton";
import "./Admin.css";
import { toast } from "react-toastify";

export default function AdminStatus() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const {
    list: statuses,
    loading,
    error,
    successMessage,
  } = useSelector((state) => state.statuses);

  const [showModal, setShowModal] = useState(false);
  const [statusInput, setStatusInput] = useState("");
  const [statusList, setStatusList] = useState([]);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    dispatch(fetchAllStatuses());
    return () => dispatch(clearStatusMessages());
  }, [dispatch]);

  useEffect(() => {
    if (!error && !successMessage) return;

    const timer = setTimeout(() => {
      dispatch(clearStatusMessages());
    }, 2000);

    return () => clearTimeout(timer);
  }, [error, successMessage, dispatch]);

  useEffect(() => {
    if (error && !toast.isActive("error-toast")) {
      toast.error(error, { toastId: "error-toast" });
      dispatch(clearStatusMessages());
    }

    if (successMessage && !toast.isActive("success-toast")) {
      toast.success(successMessage, { toastId: "success-toast" });
      dispatch(clearStatusMessages());
    }
  }, [error, successMessage]);

  // ✅ Open Add
  const openAddModal = () => {
    setEditId(null);
    setStatusList([]);
    setStatusInput("");
    setShowModal(true);
  };

  // ✅ Open Edit
  const openEditModal = (status) => {
    setEditId(status._id);
    setStatusInput(status.name);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this status?")) {
      dispatch(deleteStatus(id));
    }
  };

  // ✅ Add to list (only in Add mode)
  const handleAddStatus = () => {
    if (!statusInput.trim()) return;

    // prevent duplicates
    if (statusList.includes(statusInput.trim())) return;

    setStatusList([...statusList, statusInput.trim()]);
    setStatusInput("");
  };

  const handleRemoveStatus = (index) => {
    const updated = [...statusList];
    updated.splice(index, 1);
    setStatusList(updated);
  };

  // ✅ Submit
  const handleSubmit = () => {
    if (editId) {
      if (!statusInput.trim()) return;

      dispatch(updateStatus({ id: editId, name: statusInput.trim() }));

      setShowModal(false);
      setStatusInput("");
      return;
    }

    let finalList = [...statusList];

    if (statusInput.trim()) {
      finalList.push(statusInput.trim());
    }

    if (finalList.length === 0) return;

    finalList = [...new Set(finalList)];

    dispatch(createMultipleStatuses({ statuses: finalList }));

    setShowModal(false);
    setStatusList([]);
    setStatusInput("");
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setStatusInput("");
    setStatusList([]);
  };

  return (
    <div className="admin-page dashboard">
      <div className="dash-header">
        <div>
          <h2>Admin Status</h2>
          <p className="subtitle">Manage all statuses</p>
        </div>
        <div className="action-btns">
          <button className="btn-primary" onClick={openAddModal}>
            Add Status
          </button>
        </div>
      </div>

      {loading ? (
        <div className="table-wrap">
          <TableSkeleton rowCount={8} columnCount={2} />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {statuses.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td className="text-right">
                    {u._id !== user._id && (
                      <div className="action-btns">
                        <button
                          className="btn-role"
                          onClick={() => openEditModal(u)}
                        >
                          Edit
                        </button>

                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(u._id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
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
        title={editId ? "Edit Status" : "Add Status"}
      >
        {editId ? (
          <>
            <input
              type="text"
              value={statusInput}
              onChange={(e) => setStatusInput(e.target.value)}
              placeholder="Update status name"
              style={{
                marginBottom: '10px'
              }}
            />
          </>
        ) : (
          <>
            <div className="input-group">
              <input
                type="text"
                value={statusInput}
                onChange={(e) => setStatusInput(e.target.value)}
                placeholder="Enter status"
              />
              <button className="btn-role" onClick={handleAddStatus}>
                Add
              </button>
            </div>

            <ul>
              {statusList.map((item, i) => (
                <li key={i}>
                  {item}
                  <button
                    className="btn-delete"
                    onClick={() => handleRemoveStatus(i)}
                  >
                    ✖
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        <button
          onClick={handleSubmit}
          disabled={
            editId
              ? !statusInput.trim()
              : (statusList.length === 0 && !statusInput.trim()) || loading
          }
          className="btn-role"
          style={{
            marginTop: '10px'
          }}
        >
          {loading ? "Saving..." : editId ? "Update" : "Submit"}
        </button>
      </Modal>
    </div>
  );
}

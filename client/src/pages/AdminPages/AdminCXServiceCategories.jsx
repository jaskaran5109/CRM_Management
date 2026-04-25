import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Modal from "../../components/common/Modal";
import { TableSkeleton } from "../../components/common/Skeleton";
import "./Admin.css";
import {
  fetchAllCXServiceCategories,
  clearCXServiceCategoryMessages,
  updateCXServiceCategory,
  createMultipleCXServiceCategories,
  deleteCXServiceCategory,
} from "../../redux/slices/adminSlices/cxServiceCategorySlice";
import { fetchAllStatuses } from "../../redux/slices/adminSlices/statusSlice";
import { toast } from "react-toastify";
import { MdDelete, MdEdit } from "react-icons/md";

export default function AdminCXServiceCategories() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const EMPTY_STATE = {
    list: [],
    loading: false,
    error: null,
    successMessage: null,
  };

  const {
    list: cxServiceCategories,
    loading,
    error,
    successMessage,
  } = useSelector((state) => state.cxServiceCategories ?? EMPTY_STATE);

  const statusesState = useSelector((state) => state.statuses);
  const statuses = statusesState?.list || [];

  const [showModal, setShowModal] = useState(false);
  const [cxServiceCategoryInput, setCXServiceCategoryInput] = useState("");
  const [cxServiceCategoryList, setCXServiceCategoryList] = useState([]);
  const [editId, setEditId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");

  const activeStatus = useMemo(() => {
    return statuses.find((s) => s.name?.toUpperCase() === "ACTIVE");
  }, [statuses]);

  useEffect(() => {
    dispatch(fetchAllCXServiceCategories());
    dispatch(fetchAllStatuses());

    return () => dispatch(clearCXServiceCategoryMessages());
  }, [dispatch]);

  useEffect(() => {
    if (!error && !successMessage) return;

    const timer = setTimeout(() => {
      dispatch(clearCXServiceCategoryMessages());
    }, 2000);

    return () => clearTimeout(timer);
  }, [error, successMessage, dispatch]);

  useEffect(() => {
    if (error && !toast.isActive("error-toast")) {
      toast.error(error, { toastId: "error-toast" });
      dispatch(clearCXServiceCategoryMessages());
    }

    if (successMessage && !toast.isActive("success-toast")) {
      toast.success(successMessage, { toastId: "success-toast" });
      dispatch(clearCXServiceCategoryMessages());
    }
  }, [error, successMessage]);

  const openAddModal = () => {
    setEditId(null);
    setCXServiceCategoryList([]);
    setCXServiceCategoryInput("");
    setSelectedStatus(activeStatus?._id || "");
    setShowModal(true);
  };

  const openEditModal = (category) => {
    setEditId(category._id);
    setCXServiceCategoryInput(category.name);
    setSelectedStatus(category.status?._id || "");
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this CX service category?")) {
      dispatch(deleteCXServiceCategory(id));
    }
  };

  const handleAddCXServiceCategory = () => {
    const trimmed = cxServiceCategoryInput.trim();
    if (!trimmed) return;

    const exists = cxServiceCategoryList.some(
      (item) => item.toLowerCase() === trimmed.toLowerCase(),
    );
    if (exists) return;

    setCXServiceCategoryList([...cxServiceCategoryList, trimmed]);
    setCXServiceCategoryInput("");
  };

  const handleRemoveCXServiceCategory = (index) => {
    const updated = [...cxServiceCategoryList];
    updated.splice(index, 1);
    setCXServiceCategoryList(updated);
  };

  const handleSubmit = () => {
    if (editId) {
      if (!cxServiceCategoryInput.trim() || !selectedStatus) return;

      dispatch(
        updateCXServiceCategory({
          id: editId,
          name: cxServiceCategoryInput.trim(),
          status: selectedStatus,
        }),
      );

      closeModal();
      return;
    }

    let finalList = [...cxServiceCategoryList];

    if (cxServiceCategoryInput.trim()) {
      finalList.push(cxServiceCategoryInput.trim());
    }

    finalList = finalList.filter(
      (item, index, arr) =>
        index === arr.findIndex((x) => x.toLowerCase() === item.toLowerCase()),
    );

    if (finalList.length === 0 || !selectedStatus) return;

    dispatch(
      createMultipleCXServiceCategories({
        cxServiceCategories: finalList,
        status: selectedStatus,
      }),
    );

    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setCXServiceCategoryInput("");
    setCXServiceCategoryList([]);
    setSelectedStatus("");
  };

  return (
    <div className="admin-page dashboard">
      <div className="dash-header">
        <div>
          <h2>Admin CX Service Categories</h2>
          <p className="subtitle">Manage all CX service categories</p>
        </div>
        <div className="action-btns">
          <button className="btn-primary" onClick={openAddModal}>
            Add CX Service Category
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
              {cxServiceCategories.map((category) => (
                <tr key={category._id}>
                  <td>{category.name}</td>
                  <td style={{ marginTop: "15px" }}>
                    <span
                      className={`status-badge ${
                        category.status?.name?.toLowerCase() || "unknown"
                      }`}
                    >
                      {category.status?.name || "-"}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="action-btns">
                      <button
                        className="btn-role"
                        onClick={() => openEditModal(category)}
                      >
                        <MdEdit size={18} />
                      </button>

                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(category._id)}
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
        title={editId ? "Edit CX Service Category" : "Add CX Service Category"}
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
              value={cxServiceCategoryInput}
              onChange={(e) => setCXServiceCategoryInput(e.target.value)}
              placeholder="Update CX service category name"
            />
          ) : (
            <>
              <div className="input-group">
                <input
                  type="text"
                  value={cxServiceCategoryInput}
                  onChange={(e) => setCXServiceCategoryInput(e.target.value)}
                  placeholder="Enter CX service category"
                />
                <button
                  className="btn-role"
                  onClick={handleAddCXServiceCategory}
                >
                  Add
                </button>
              </div>

              <ul>
                {cxServiceCategoryList.map((item, i) => (
                  <li key={i}>
                    {item}
                    <button
                      className="btn-delete"
                      onClick={() => handleRemoveCXServiceCategory(i)}
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
                ? !cxServiceCategoryInput.trim() || !selectedStatus || loading
                : (cxServiceCategoryList.length === 0 &&
                    !cxServiceCategoryInput.trim()) ||
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

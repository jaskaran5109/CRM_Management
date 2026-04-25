import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Modal from "../../components/common/Modal";
import { TableSkeleton } from "../../components/common/Skeleton";
import "./Admin.css";
import {
  fetchAllUserRoles,
  clearUserRolesMessages,
  updateUserRole,
  createMultipleUserRoles,
  deleteUserRole,
} from "../../redux/slices/adminSlices/userRoleSlice";
import { fetchAllStatuses } from "../../redux/slices/adminSlices/statusSlice";
import { toast } from "react-toastify";
import { MdDelete, MdEdit } from "react-icons/md";

export default function AdminUserRoles() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const {
    list: userRoles,
    loading,
    error,
    successMessage,
  } = useSelector((state) => state.userRoles);

  const { list: statuses = [] } = useSelector((state) => state.statuses || {});

  const [showModal, setShowModal] = useState(false);
  const [userRoleInput, setUserRoleInput] = useState("");
  const [userRoleList, setUserRoleList] = useState([]);
  const [editId, setEditId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");

  const activeStatus = useMemo(() => {
    return statuses.find((s) => s.name?.toUpperCase() === "ACTIVE");
  }, [statuses]);

  useEffect(() => {
    dispatch(fetchAllUserRoles());
    dispatch(fetchAllStatuses());

    return () => dispatch(clearUserRolesMessages());
  }, [dispatch]);

  useEffect(() => {
    if (!error && !successMessage) return;

    const timer = setTimeout(() => {
      dispatch(clearUserRolesMessages());
    }, 2000);

    return () => clearTimeout(timer);
  }, [error, successMessage, dispatch]);

  useEffect(() => {
    if (error && !toast.isActive("error-toast")) {
      toast.error(error, { toastId: "error-toast" });
      dispatch(clearUserRolesMessages());
    }

    if (successMessage && !toast.isActive("success-toast")) {
      toast.success(successMessage, { toastId: "success-toast" });
      dispatch(clearUserRolesMessages());
    }
  }, [error, successMessage]);

  const openAddModal = () => {
    setEditId(null);
    setUserRoleList([]);
    setUserRoleInput("");
    setSelectedStatus(activeStatus?._id || "");
    setShowModal(true);
  };

  const openEditModal = (userRole) => {
    setEditId(userRole._id);
    setUserRoleInput(userRole.name);
    setSelectedStatus(userRole.status?._id || "");
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this user role?")) {
      dispatch(deleteUserRole(id));
    }
  };

  const handleAddUserRole = () => {
    const trimmed = userRoleInput.trim();
    if (!trimmed) return;

    if (userRoleList.includes(trimmed)) return;

    setUserRoleList([...userRoleList, trimmed]);
    setUserRoleInput("");
  };

  const handleRemoveUserRole = (index) => {
    const updated = [...userRoleList];
    updated.splice(index, 1);
    setUserRoleList(updated);
  };

  const handleSubmit = () => {
    if (editId) {
      if (!userRoleInput.trim() || !selectedStatus) return;

      dispatch(
        updateUserRole({
          id: editId,
          name: userRoleInput.trim(),
          status: selectedStatus,
        }),
      );

      closeModal();
      return;
    }

    let finalList = [...userRoleList];

    if (userRoleInput.trim()) {
      finalList.push(userRoleInput.trim());
    }

    finalList = [...new Set(finalList)];

    if (finalList.length === 0 || !selectedStatus) return;

    dispatch(
      createMultipleUserRoles({
        userRoles: finalList,
        status: selectedStatus,
      }),
    );

    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setUserRoleInput("");
    setUserRoleList([]);
    setSelectedStatus("");
  };

  return (
    <div className="admin-page dashboard">
      <div className="dash-header">
        <div>
          <h2>Admin User Roles</h2>
          <p className="subtitle">Manage all user roles</p>
        </div>
        <div className="action-btns">
          <button className="btn-primary" onClick={openAddModal}>
            Add User Role
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
              {userRoles.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td
                    style={{
                      marginTop: "15px",
                    }}
                  >
                    <span
                      className={`status-badge ${u.status?.name?.toLowerCase() || "unknown"}`}
                    >
                      {u.status?.name || "-"}{" "}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="action-btns">
                      <button
                        className="btn-role"
                        onClick={() => openEditModal(u)}
                      >
                        <MdEdit size={18} />
                      </button>

                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(u._id)}
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
        title={editId ? "Edit User Role" : "Add User Role"}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: editId ? "10px" : "10px",
          }}
        >
          {editId ? (
            <input
              type="text"
              value={userRoleInput}
              onChange={(e) => setUserRoleInput(e.target.value)}
              placeholder="Update user role name"
            />
          ) : (
            <>
              <div className="input-group">
                <input
                  type="text"
                  value={userRoleInput}
                  onChange={(e) => setUserRoleInput(e.target.value)}
                  placeholder="Enter user role"
                />
                <button className="btn-role" onClick={handleAddUserRole}>
                  Add
                </button>
              </div>

              <ul>
                {userRoleList.map((item, i) => (
                  <li key={i}>
                    {item}
                    <button
                      className="btn-delete"
                      onClick={() => handleRemoveUserRole(i)}
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
                ? !userRoleInput.trim() || !selectedStatus || loading
                : (userRoleList.length === 0 && !userRoleInput.trim()) ||
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

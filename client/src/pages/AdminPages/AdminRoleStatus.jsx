import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Modal from "../../components/common/Modal";
import { TableSkeleton } from "../../components/common/Skeleton";
import "./Admin.css";

import {
  fetchAllRoleStatuses,
  createRoleStatus,
  createMultipleRoleStatuses,
  clearRoleStatusMessages,
  updateRoleStatusGroup,
  deleteRoleStatusGroup,
} from "../../redux/slices/adminSlices/roleStatusSlice";

import { fetchAllUserRoles } from "../../redux/slices/adminSlices/userRoleSlice";
import { toast } from "react-toastify";
import { fetchAllStatuses } from "../../redux/slices/adminSlices/statusSlice";
import { MdDelete, MdEdit } from "react-icons/md";

export default function AdminRoleStatus() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const {
    list: roleStatusList,
    loading,
    error,
    successMessage,
  } = useSelector((state) => state.roleStatuses);

  const { list: userRoles = [] } = useSelector((state) => state.userRoles);
  const { list: statuses = [] } = useSelector((state) => state.statuses);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedNextRoles, setSelectedNextRoles] = useState([]);
  const [nameInput, setNameInput] = useState("");
  const [nameList, setNameList] = useState([]);
  const [selectedUserRole, setSelectedUserRole] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [groupEditIds, setGroupEditIds] = useState([]);
  const [editNameIndex, setEditNameIndex] = useState(null);

  useEffect(() => {
    dispatch(fetchAllRoleStatuses());
    dispatch(fetchAllUserRoles());
    dispatch(fetchAllStatuses());

    return () => dispatch(clearRoleStatusMessages());
  }, [dispatch]);

  useEffect(() => {
    if (!error && !successMessage) return;

    const timer = setTimeout(() => {
      dispatch(clearRoleStatusMessages());
    }, 2000);

    return () => clearTimeout(timer);
  }, [error, successMessage, dispatch]);

  useEffect(() => {
    if (error && !toast.isActive("error-toast")) {
      toast.error(error, { toastId: "error-toast" });
      dispatch(clearRoleStatusMessages());
    }

    if (successMessage && !toast.isActive("success-toast")) {
      toast.success(successMessage, { toastId: "success-toast" });
      dispatch(clearRoleStatusMessages());
    }
  }, [error, successMessage]);

  const resetForm = () => {
    setEditId(null);
    setGroupEditIds([]);
    setNameInput("");
    setNameList([]);
    setSelectedUserRole("");
    setSelectedStatus("");
    setSelectedNextRoles([]);
    setEditNameIndex(null);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditName = (index) => {
    setNameInput(nameList[index]);
    setEditNameIndex(index);
  };

  const handleAddName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;

    const duplicateIndex = nameList.findIndex(
      (item, index) =>
        item.toLowerCase() === trimmed.toLowerCase() && index !== editNameIndex,
    );

    if (duplicateIndex !== -1) {
      setNameInput("");
      setEditNameIndex(null);
      return;
    }

    if (editNameIndex !== null) {
      const updated = [...nameList];
      updated[editNameIndex] = trimmed;
      setNameList(updated);
    } else {
      setNameList((prev) => [...prev, trimmed]);
    }

    setNameInput("");
    setEditNameIndex(null);
  };

  const handleRemoveName = (index) => {
    const updated = [...nameList];
    updated.splice(index, 1);
    setNameList(updated);

    if (editNameIndex === index) {
      setNameInput("");
      setEditNameIndex(null);
    }
  };

  const handleSubmit = () => {
    if (!selectedUserRole || !selectedStatus) return;

    if (editId === "group-edit") {
      if (nameList.length === 0 && !nameInput.trim()) return;

      let finalNames = [...nameList];

      if (nameInput.trim()) {
        const trimmed = nameInput.trim();
        const exists = finalNames.some(
          (item) => item.toLowerCase() === trimmed.toLowerCase(),
        );

        if (!exists) {
          finalNames.push(trimmed);
        }
      }

      dispatch(
        updateRoleStatusGroup({
          ids: groupEditIds,
          names: finalNames,
          userRole: selectedUserRole,
          status: selectedStatus,
          nextRoles: selectedNextRoles,
        }),
      );

      closeModal();
      return;
    }

    // add mode
    let finalNames = [...nameList];

    if (nameInput.trim()) {
      const trimmed = nameInput.trim();
      const exists = finalNames.some(
        (item) => item.toLowerCase() === trimmed.toLowerCase(),
      );

      if (!exists) {
        finalNames.push(trimmed);
      }
    }

    if (finalNames.length === 0) return;

    const roleStatusesPayload = finalNames.map((name) => ({
      name,
      userRole: selectedUserRole,
      status: selectedStatus,
      nextRoles: selectedNextRoles,
    }));

    if (roleStatusesPayload.length === 1) {
      dispatch(createRoleStatus(roleStatusesPayload[0]));
    } else {
      dispatch(
        createMultipleRoleStatuses({ roleStatuses: roleStatusesPayload }),
      );
    }

    closeModal();
  };

  const openGroupedEditModal = (group) => {
    setEditId("group-edit");
    setGroupEditIds(group.ids);
    setNameList(group.names || []);
    setNameInput("");
    setSelectedUserRole(group.userRoleId || "");
    setSelectedStatus(group.statusId || "");
    setEditNameIndex(null);
    setShowModal(true);
    setSelectedNextRoles(group.nextRoles?.map(r => r._id) || []);
  };
  
  const groupedRoleStatuses = Object.values(
    roleStatusList.reduce((acc, item) => {
      const userRoleId = item.userRole?._id || item.userRole;
      const statusId = item.status?._id || item.status;
      const key = `${userRoleId}-${statusId}`;

      if (!acc[key]) {
        acc[key] = {
          key,
          userRoleId,
          userRoleName: item.userRole?.name || "-",
          statusId,
          statusName: item.status?.name || "-",
          ids: [],
          names: [],
          items: [],
          nextRoles: item.nextRoles || [],
        };
      }

      acc[key].ids.push(item._id);
      acc[key].items.push(item);
      acc[key].names.push(item.name);      
      return acc;
    }, {}),
  );

  const handleDeleteGroup = (group) => {
    if (!window.confirm("Delete this role status group?")) return;

    dispatch(deleteRoleStatusGroup({ ids: group.ids }));
  };

  const handleNextRolesChange = (e) => {
    const options = Array.from(e.target.selectedOptions);
    const values = options.map((opt) => opt.value);
    setSelectedNextRoles(values);
  };

  const handleNextRoleCheckboxChange = (roleId) => {
    setSelectedNextRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h2>Admin Role Status</h2>
          <p className="subtitle">Manage all role statuses</p>
        </div>

        <div className="action-btns">
          <button className="btn-primary" onClick={openAddModal}>
            Add Role Status
          </button>
        </div>
      </div>

      {loading ? (
        <div className="skeleton-global-container">
          <TableSkeleton rows={6} cols={5} />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>User Role</th>
                <th>Permissions</th>
                <th>Status</th>
                <th>Next Roles</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {groupedRoleStatuses.length > 0 ? (
                groupedRoleStatuses.map((group) => (
                  <tr key={group.key}>
                    <td>{group.userRoleName}</td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "8px",
                        }}
                      >
                        {group.names.map((name, index) => (
                          <span key={index} className="name-chip">
                            {name}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`status-badge ${group.statusName.toLowerCase() || "unknown"}`}
                      >
                        {group.statusName}
                      </span>
                    </td>
                    <td>
                      {group.nextRoles?.length > 0 ? (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "6px",
                          }}
                        >
                          {group.nextRoles.map((roleId, i) => {
                            const role = userRoles.find(
                              (r) => r._id === roleId?._id,
                            );
                            return (
                              <span key={i} className="name-chip">
                                {role?.name || "Unknown"}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="text-right">
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "center",
                          justifyContent: "flex-end",
                        }}
                      >
                        <button
                          className="btn-role"
                          onClick={() => openGroupedEditModal(group)}
                        >
                          <MdEdit size={18} />
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteGroup(group)}
                        >
                          <MdDelete size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center">
                    No role statuses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editId ? "Edit Role Status Group" : "Add Role Status"}
      >
        <div className="input-group" style={{ marginBottom: "12px" }}>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Enter role status name"
          />
          <button className="btn-role" onClick={handleAddName} type="button">
            {editNameIndex !== null ? "Update Name" : "Add"}
          </button>
        </div>

        {nameList.length > 0 && (
          <ul style={{ marginBottom: "12px" }}>
            {nameList.map((item, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "6px",
                  gap: "8px",
                }}
              >
                <span>{item}</span>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className="btn-role"
                    type="button"
                    onClick={() => handleEditName(i)}
                  >
                    Edit
                  </button>

                  <button
                    className="btn-delete"
                    type="button"
                    onClick={() => handleRemoveName(i)}
                  >
                    ✖
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div style={{ marginBottom: "12px" }}>
          <label
            style={{ display: "block", marginBottom: "6px", fontWeight: "600", textAlign: "left", textAlign: "left" }}
          >
            User Role
          </label>
          <select
            value={selectedUserRole}
            onChange={(e) => setSelectedUserRole(e.target.value)}
            style={{ width: "100%", padding: "10px" }}
          >
            <option value="">Select user role</option>
            {userRoles.map((role) => (
              <option key={role._id} value={role._id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{ display: "block", marginBottom: "6px", fontWeight: "600", textAlign: "left" }}
          >
            Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ width: "100%", padding: "10px" }}
          >
            <option value="">Select status</option>
            {statuses.map((status) => (
              <option key={status._id} value={status._id}>
                {status.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{ display: "block", marginBottom: "6px", fontWeight: "600", textAlign: "left" }}
          >
            Next Roles (Who can update next)
          </label>

          <div className="checkbox-role-list">
            {userRoles.map((role) => (
              <label key={role._id} className="checkbox-role-item">
                <input
                  type="checkbox"
                  checked={selectedNextRoles.includes(role._id)}
                  onChange={() => handleNextRoleCheckboxChange(role._id)}
                />
                <span>{role.name}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={
            loading ||
            !selectedUserRole ||
            !selectedStatus ||
            (nameList.length === 0 && !nameInput.trim())
          }
          className="btn-role"
        >
          {loading ? "Saving..." : editId ? "Update" : "Submit"}
        </button>
      </Modal>
    </div>
  );
}

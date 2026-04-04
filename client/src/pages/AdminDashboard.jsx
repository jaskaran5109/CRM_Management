import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import "./AdminPages/Admin.css";
import { CardSkeleton, TableSkeleton, ChartSkeleton, FormSkeleton } from "../components/common/Skeleton";
import {
  fetchAllUsers,
  deleteUser,
  changeUserRole,
  clearUserMessages,
  bulkUploadUsers,
  createUser,
  updateUser,
} from "../redux/slices/userSlice";
import {
  clearUserRolesMessages,
  fetchAllUserRoles,
} from "../redux/slices/adminSlices/userRoleSlice";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { fetchAllStatuses } from "../redux/slices/adminSlices/statusSlice";
import './CXData.css'
import { MdDelete, MdEdit } from "react-icons/md";

export default function AdminDashboard() {
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const {
    list: users,
    loading,
    error,
    successMessage,
    page: currentPageState,
    total,
    totalPages,
    limit: currentLimit,
  } = useSelector((state) => state.users);

  const { list: userRoles, loading: userRolesLoading } = useSelector(
    (state) => state.userRoles,
  );

  const { list: statuses = [] } = useSelector((state) => state.statuses || {});

  const [selectedSystemRole, setSelectedSystemRole] = useState("user");
  const [selectedUserRoles, setSelectedUserRoles] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  // ===== BULK UPLOAD STATE =====
  const [showBulkUserModal, setShowBulkUserModal] = useState(false);
  const [bulkUsersData, setBulkUsersData] = useState([]); // Validated users
  const [bulkUsersErrors, setBulkUsersErrors] = useState([]); // Validation errors
  const [bulkUploadProgress, setBulkUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState("");

  // ===== SINGLE USER SIDEBAR =====
  const [showUserSidebar, setShowUserSidebar] = useState(false);
  const [editUser, setEditUser] = useState(null); // `null` = create mode
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
    role: "user", // 'user' or 'admin',
    userRoles: [], // array of user role _ids
    status:
      statuses?.find((s) => s.name?.toString()?.toUpperCase() === "ACTIVE")
        ?._id || "", // status _id
  });

  useEffect(() => {
    const activeStatus = statuses?.find(
      (s) => s.name?.toUpperCase() === "ACTIVE",
    );

    if (activeStatus?._id) {
      setUserForm((prev) => ({
        ...prev,
        status: activeStatus._id,
      }));
    }
  }, [statuses]);

  const [changePassword, setChangePassword] = useState(false); // Toggle for edit mode

  const isAdmin = () => user?.role === "admin";

  useEffect(() => {
    dispatch(fetchAllUserRoles());
    dispatch(fetchAllStatuses());
    return () => {
      dispatch(clearUserMessages());
      dispatch(clearUserRolesMessages());
    };
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchAllUsers({
        search: debouncedSearch,
        role: filterRole,
        status: filterStatus,
        page: currentPage,
        limit: pageSize,
        sort: sortConfig.key,
        order: sortConfig.direction,
      }),
    );
  }, [
    dispatch,
    debouncedSearch,
    filterRole,
    filterStatus,
    sortConfig,
    currentPage,
    pageSize,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setSelectedRows(new Set());
    setSelectAll(false);
  }, [
    debouncedSearch,
    filterRole,
    filterStatus,
    sortConfig,
    currentPage,
    pageSize,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterRole, filterStatus, sortConfig, pageSize]);

  useEffect(() => {
    if (!error && !successMessage) return;

    const timer = setTimeout(() => {
      dispatch(clearUserMessages());
    }, 2000);

    return () => clearTimeout(timer);
  }, [error, successMessage, dispatch]);

  useEffect(() => {
    if (error && !toast.isActive("error-toast")) {
      toast.error(error, { toastId: "error-toast" });
      dispatch(clearUserMessages());
    }

    if (successMessage && !toast.isActive("success-toast")) {
      toast.success(successMessage, { toastId: "success-toast" });
      dispatch(clearUserMessages());
    }
  }, [error, successMessage]);

  const handleDelete = (id) => {
    if (id === user?._id) {
      toast.error("You cannot delete your own account.");
      return;
    }
    if (window.confirm("Delete this user?")) {
      dispatch(deleteUser(id));
    }
  };

  const openBulkUserModal = () => setShowBulkUserModal(true);

  const closeBulkUserModal = () => {
    setShowBulkUserModal(false);
    setBulkUsersData([]);
    setBulkUsersErrors([]);
    setBulkUploadProgress(0);
    setUploadFileName("");
    // Reset file input
    // document.getElementById("bulk-user-file")?.value = "";
  };

  const downloadUserTemplate = () => {
    // Template columns: Name, Email, Password, Phone Number, Role (optional), Status (optional)
    const templateData = [
      {
        Name: "John Doe",
        Email: "john@company.com",
        Password: "SecurePass123",
        "Phone Number": "1234567890",
        Role: "user", // Options: user / admin
        Status: "Active", // Must match existing Status names
      },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    ws["!cols"] = [
      { wch: 20 }, // Name
      { wch: 25 }, // Email
      { wch: 15 }, // Password
      { wch: 15 }, // Phone Number
      { wch: 10 }, // Role
      { wch: 15 }, // Status
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Users Template");
    XLSX.writeFile(wb, "user-bulk-upload-template.xlsx");
  };

  const handleBulkUserFileUpload = (event) => {
    // Reset states
    setBulkUsersData([]);
    setBulkUsersErrors([]);
    setUploadFileName("");

    const file = event.target.files[0];
    if (!file) return;

    setUploadFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const validatedUsers = [];
        const errors = [];

        // Helper to get value (handles different header names)
        const getValue = (row, keys) => {
          const val = keys
            .map((key) => row[key])
            .find(
              (v) => v !== undefined && v !== null && String(v).trim() !== "",
            );
          return val ? String(val).trim() : "";
        };

        jsonData.forEach((row, index) => {
          const rowNumber = index + 2; // Row number in Excel (headers = row 1)
          const user = {};

          // *** REQUIRED FIELDS ***
          // Name
          const name = getValue(row, ["Name", "Full Name"]);
          if (!name) {
            errors.push(`Row ${rowNumber}: Name is required`);
          } else {
            user.name = name;
          }

          // Email
          const email = getValue(row, ["Email", "email"]);
          if (!email) {
            errors.push(`Row ${rowNumber}: Email is required`);
          } else {
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
              errors.push(`Row ${rowNumber}: Invalid email format`);
            } else {
              user.email = email;
            }
          }

          // Password
          const password = getValue(row, ["Password", "password"]);
          if (!password) {
            errors.push(`Row ${rowNumber}: Password is required`);
          } else if (password.length < 6) {
            errors.push(`Row ${rowNumber}: Password must be ≥6 characters`);
          } else {
            user.password = password; // *Will be hashed by backend*
          }

          // Phone Number (optional)
          const phoneNumber = getValue(row, ["Phone Number", "Phone", "phoneNumber"]);
          if (phoneNumber) {
            const phoneRegex = /^[0-9]{10}$/;
            if (!phoneRegex.test(phoneNumber)) {
              errors.push(`Row ${rowNumber}: Phone number must be 10 digits`);
            } else {
              user.phoneNumber = phoneNumber;
            }
          }

          // *** OPTIONAL FIELDS ***
          // Role
          const roleStr = getValue(row, ["Role", "role"]);
          user.role = roleStr.toLowerCase() === "admin" ? "admin" : "user";

          // Status (must match existing status names)
          const statusName = getValue(row, ["Status", "status"]);
          if (statusName) {
            const statusExists = statuses.some(
              (s) => s.name.toLowerCase() === statusName.toLowerCase(),
            );
            if (statusExists) {
              const statusObj = statuses.find(
                (s) => s.name.toLowerCase() === statusName.toLowerCase(),
              );
              user.status = statusObj._id;
            } else {
              errors.push(`Row ${rowNumber}: Status "${statusName}" not found`);
            }
          }

          // ✅ Add only if NO errors for this row
          if (
            !errors.some((err) => err.startsWith(`Row ${rowNumber}:`)) &&
            user.name &&
            user.email &&
            user.password
          ) {
            validatedUsers.push(user);
          }
        });

        setBulkUsersData(validatedUsers);
        setBulkUsersErrors(errors);
      } catch (err) {
        toast.error("Error reading file. Use a valid Excel/CSV file.");
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleBulkUserUpload = async () => {
    if (bulkUsersData.length === 0) {
      toast.info("No users to upload");
      return;
    }

    if (bulkUsersErrors.length > 0) {
      toast.error("Fix validation errors first!");
      return;
    }

    if (!window.confirm(`Upload ${bulkUsersData.length} users?`)) return;

    setBulkUploadProgress(0);

    try {
      // Simulate progress (in real app you could use WebSockets)
      const interval = setInterval(() => {
        setBulkUploadProgress((p) => (p >= 90 ? 90 : p + 10));
      }, 300);

      await dispatch(bulkUploadUsers(bulkUsersData)).unwrap();

      // Complete progress
      setBulkUploadProgress(100);
      clearInterval(interval);

      toast.success(`✅ ${bulkUsersData.length} users uploaded!`);
      closeBulkUserModal();

      // Refresh user list
      dispatch(fetchAllUsers());
    } catch (err) {
      setBulkUploadProgress(0);
      toast.error(err || "Upload failed");
    }
  };

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUserRoleCheckboxChange = (roleId) => {
    setSelectedUserRoles((prev) => {
      const newRoles = prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId];

      // Also update userForm.userRoles to keep them in sync
      setUserForm((prevForm) => ({
        ...prevForm,
        userRoles: newRoles,
      }));

      return newRoles;
    });
  };

  const closeUserSidebar = () => {
    const activeStatus =
      statuses?.find((s) => s.name?.toUpperCase() === "ACTIVE")?._id || "";

    setShowUserSidebar(false);
    setEditUser(null);
    setUserForm({
      name: "",
      email: "",
      password: "",
      phoneNumber: "",
      role: "user",
      status: activeStatus,
      userRoles: [],
    });
    setSelectedSystemRole("user");
    setSelectedUserRoles([]);
    setSelectedStatus(activeStatus);
    setChangePassword(false);
  };

  const openEditUserSidebar = (user) => {
    setEditUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      password: "", // Never show existing password
      phoneNumber: user.phoneNumber || "",
      role: user.role,
      status: user.status?._id || "",
      userRoles:
        user.userRole?.map((role) =>
          typeof role === "string" ? role : role._id,
        ) || [], // Include user roles
    });
    setSelectedSystemRole(user.role || "user");
    setSelectedUserRoles(
      user.userRole?.map((role) =>
        typeof role === "string" ? role : role._id,
      ) || [],
    );
    setSelectedStatus(user.status?._id || "");
    setChangePassword(false);
    setShowUserSidebar(true);
  };

  const openCreateUserSidebar = () => {
    const activeStatus =
      statuses?.find((s) => s.name?.toUpperCase() === "ACTIVE")?._id || "";

    setEditUser(null);
    setUserForm({
      name: "",
      email: "",
      password: "",
      phoneNumber: "",
      role: "user",
      status: activeStatus,
      userRoles: [],
    });
    setSelectedSystemRole("user");
    setSelectedUserRoles([]);
    setSelectedStatus(activeStatus);
    setChangePassword(false);
    setShowUserSidebar(true);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!userForm.name.trim()) return toast.error("Name is required");
    if (!userForm.email.trim()) return toast.error("Email is required");
    if (!editUser && !userForm.password.trim())
      return toast.error("Password is required for new users");
    if (userForm.password && userForm.password.length < 6)
      return toast.error("Password must be ≥6 characters");
    if (userForm.phoneNumber && !/^[0-9]{10}$/.test(userForm.phoneNumber))
      return toast.error("Phone number must be 10 digits");

    const userPayload = {
      name: userForm.name.trim(),
      email: userForm.email.trim(),
      phoneNumber: userForm.phoneNumber.trim() || "",
      role: userForm.role,
      status: userForm.status || null,
      userRoles:
        Array.isArray(selectedUserRoles) && selectedUserRoles.length > 0
          ? selectedUserRoles
          : Array.isArray(userForm.userRoles)
          ? userForm.userRoles
          : [],
      ...(userForm.password && { password: userForm.password }), // Only send if provided
    };

    try {
      if (editUser) {
        // UPDATE existing user - single API call handles all fields including roles
        await dispatch(
          updateUser({ id: editUser._id, updates: userPayload }),
        ).unwrap();
      } else {
        // CREATE new user
        const result = await dispatch(createUser(userPayload)).unwrap();

        // If roles were selected for new user, update them
        if (
          selectedUserRoles.length > 0 ||
          selectedSystemRole !== "user" ||
          selectedStatus
        ) {
          await dispatch(
            changeUserRole({
              userId: result.user._id, // Assuming the result contains the new user
              role: selectedSystemRole,
              userRoles: selectedUserRoles,
              status: selectedStatus,
            }),
          ).unwrap();
        }
      }
      closeUserSidebar();
      // success toast shown by slice-level successMessage useEffect
    } catch (err) {
      // Error handled globally via useEffect (toast)
    }
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return "⇅";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const onSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const toggleSelectRow = (id) => {
    setSelectedRows((prev) => {
      const updated = new Set(prev);
      if (updated.has(id)) updated.delete(id);
      else updated.add(id);

      const selectableCount = users.filter((u) => u._id !== user?._id).length;
      setSelectAll(updated.size === selectableCount);
      return updated;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set());
      setSelectAll(false);
    } else {
      const selectableUsers = users.filter((u) => u._id !== user?._id);
      setSelectedRows(new Set(selectableUsers.map((u) => u._id)));
      setSelectAll(selectableUsers.length > 0);
    }
  };

  const exportUsers = () => {
    const exportData = users.map((u) => ({
      Name: u.name,
      Email: u.email,
      Role: u.role,
      Status: u.status?.name || "",
      UserRoles: u.userRole
        ?.map((r) => (typeof r === "string" ? r : r.name))
        .join(", "),
      CreatedAt: new Date(u.createdAt).toLocaleString(),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, "users-export.xlsx");
  };

  const deleteSelectedUsers = async () => {
    if (selectedRows.size === 0) return;

    if (selectedRows.has(user?._id)) {
      toast.error("You cannot delete your own account.");
      return;
    }

    if (!window.confirm(`Delete ${selectedRows.size} selected user(s)?`))
      return;

    for (const id of Array.from(selectedRows)) {
      await dispatch(deleteUser(id));
    }

    setSelectedRows(new Set());
    setSelectAll(false);
    dispatch(fetchAllUsers());
    toast.success("Selected users deleted");
  };

  const canEditUser = useCallback(
    (u) => {
      // if (u?._id === user?._id) return false;
      return isAdmin();
    },
    [isAdmin, user?._id],
  );

  const getExportLabel = () => {
    if (selectedRows.size > 0) {
      return `⬇ Export Selected (${selectedRows.size})`;
    }

    return `⬇ Export All (${users.length})`;
  };

  const toggleChangePassword = () => setChangePassword(!changePassword);

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h2>Users</h2>
          <p className="subtitle">Manage all users</p>
        </div>
        <div
          className="actions-top"
        >
          <button
            className="btn-primary"
            onClick={openCreateUserSidebar}
            disabled={!isAdmin()}
          >
            + Add User
          </button>
          <button
            className="btn-outline"
            onClick={openBulkUserModal}
            disabled={!isAdmin()}
          >
            📤 Bulk Upload Users
          </button>
        </div>
      </div>

      <div className="table-actions">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="filter-select"
        >
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="">All Statuses</option>
          {statuses.map((st) => (
            <option key={st._id} value={st._id}>
              {st.name}
            </option>
          ))}
        </select>

        <button className="btn-outline" onClick={exportUsers} disabled={users.length === 0}>
          📥 {getExportLabel()}
        </button>
      </div>

      {loading ? (
        <div className="skeleton-global-container">
          <CardSkeleton count={1} />
          <TableSkeleton rows={8} cols={9} />
        </div>
      ) : (
        <div className="table-wrap">
          <div className="bulk-actions">
            <label>
              <input
                type="checkbox"
                checked={selectAll}
                onChange={toggleSelectAll}
              />
              Select all
            </label>
            <button
              className="btn-delete"
              onClick={deleteSelectedUsers}
              disabled={selectedRows.size === 0}
            >
              🗑 Delete ({selectedRows.size})
            </button>
          </div>
          <table className="users-table">
            <thead>
              <tr>
                <th></th>
                <th onClick={() => onSort("name")}>
                  Name {getSortIcon("name")}
                </th>
                <th onClick={() => onSort("email")}>
                  Email {getSortIcon("email")}
                </th>
                <th>Phone Number</th>
                <th onClick={() => onSort("role")}>
                  Role {getSortIcon("role")}
                </th>
                <th onClick={() => onSort("createdAt")}>
                  Joined {getSortIcon("createdAt")}
                </th>
                <th>User Roles</th>
                <th onClick={() => onSort("status.name")}>
                  Status {getSortIcon("status")}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u._id}
                  className={u._id === user._id ? "current-user" : ""}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(u._id)}
                      onChange={() => toggleSelectRow(u._id)}
                      disabled={u._id === user._id}
                    />
                  </td>
                  <td>
                    {u.name}
                    {u._id === user._id && (
                      <span className="you-badge">You</span>
                    )}
                  </td>
                  <td>{u.email}</td>
                  <td>{u.phoneNumber || "-"}</td>
                  <td>
                    <span className={`role-badge ${u.role}`}>{u.role}</span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="role-tags">
                      {u.userRole?.length ? (
                        u.userRole.map((role) => (
                          <span
                            key={typeof role === "string" ? role : role._id}
                            className="role-chip"
                          >
                            {typeof role === "string" ? role : role.name}
                          </span>
                        ))
                      ) : (
                        <span className="no-role-text">No roles assigned</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${u.status?.name?.toLowerCase() || "unknown"}`}
                    >
                      {u.status?.name || "-"}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button
                        className="btn-role"
                        onClick={() => openEditUserSidebar(u)}
                        disabled={!canEditUser(u)}
                      >
                        <MdEdit size={18} />
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(u._id)}
                        disabled={!canEditUser(u)}
                      >
                        <MdDelete size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination-wrapper">
            <div className="pagination-info">
              <span>Total Users: {total || users.length}</span>
            </div>

            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                ◀
              </button>

              {Array.from({ length: totalPages || 1 }, (_, i) => i + 1)
                .filter((num) => {
                  const distance = Math.abs(num - currentPage);
                  return (
                    distance <= 2 || num === 1 || num === (totalPages || 1)
                  );
                })
                .map((num, idx, arr) => (
                  <div key={num}>
                    {idx > 0 && arr[idx - 1] !== num - 1 && (
                      <span className="pagination-dots">...</span>
                    )}
                    <button
                      className={`pagination-btn ${currentPage === num ? "active" : ""}`}
                      onClick={() => setCurrentPage(num)}
                    >
                      {num}
                    </button>
                  </div>
                ))}

              <button
                className="pagination-btn"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages || 1, p + 1))
                }
                disabled={currentPage >= (totalPages || 1)}
              >
                ▶
              </button>
            </div>

            <div className="pagination-page-size">
              <label>Show per Page:</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ================= RIGHT SIDEBAR (SINGLE USER) ================= */}
      {showUserSidebar && (
        <>
          {/* Backdrop */}
          <div className="right-sidebar-backdrop" onClick={closeUserSidebar} />

          {/* Sidebar */}
          <div className="right-sidebar-modal">
            <div className="right-sidebar-header">
              <h3>{editUser ? "Edit User" : "Add New User"}</h3>
              <button className="sidebar-close-btn" onClick={closeUserSidebar}>
                ✕
              </button>
            </div>

            <div className="right-sidebar-body">
              <form onSubmit={handleUserSubmit}>
                {/* Name */}
                <div className="form-group">
                  <label>
                    Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={userForm.name}
                    onChange={handleUserChange}
                    required
                  />
                </div>

                {/* Email */}
                <div className="form-group">
                  <label>
                    Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={userForm.email}
                    onChange={handleUserChange}
                    required
                  />
                </div>

                {/* Phone Number */}
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={userForm.phoneNumber}
                    onChange={handleUserChange}
                    placeholder="10-digit number"
                    pattern="[0-9]{10}"
                    title="Phone number must be 10 digits"
                  />
                </div>

                {/* Password */}
                <div className="form-group">
                  <div className="d-flex align-items-center justify-content-between">
                    <label>
                      Password
                      {!editUser && <span className="text-danger">*</span>}
                    </label>
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={userForm.password}
                    onChange={handleUserChange}
                    disabled={editUser && !changePassword}
                    minLength={6}
                  />
                  {editUser && (
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={changePassword}
                        onChange={toggleChangePassword}
                      />{" "}
                      Change Password
                    </label>
                  )}
                  {!editUser && (
                    <small className="form-text text-muted">
                      Min 6 characters
                    </small>
                  )}
                </div>

                {/* Status */}
                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={userForm.status}
                    onChange={(e) => {
                      handleUserChange(e);
                      setSelectedStatus(e.target.value);
                    }}
                  >
                    <option value="">-- No status --</option>
                    {statuses.map((st) => (
                      <option key={st._id} value={st._id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* System Role */}
                <div className="form-group">
                  <label>System Role</label>
                  <select
                    value={selectedSystemRole}
                    onChange={(e) => {
                      setSelectedSystemRole(e.target.value);
                      setUserForm((prev) => ({
                        ...prev,
                        role: e.target.value,
                      }));
                    }}
                    disabled={editUser?._id === user._id} // Can't change own role
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {/* User Roles */}
                <div className="form-group">
                  <label>User Roles</label>
                  <div className="checkbox-role-list">
                    {userRolesLoading ? (
                      <div className="skeleton-form" style={{ padding: "8px", border: "none" }}>
                        {Array.from({ length: 3 }).map((_, idx) => (
                          <div className="skeleton-form-row" key={idx}>
                            <div className="skeleton-input" style={{ width: "100%", height: "16px" }} />
                          </div>
                        ))}
                      </div>
                    ) : userRoles.length ? (
                      userRoles.map((role) => (
                        <label key={role._id} className="checkbox-role-item">
                          <input
                            type="checkbox"
                            checked={selectedUserRoles.includes(role._id)}
                            onChange={() =>
                              handleUserRoleCheckboxChange(role._id)
                            }
                          />
                          <span>{role.name}</span>
                        </label>
                      ))
                    ) : (
                      <div className="no-role-text">
                        No user roles available
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>

            <div className="right-sidebar-footer">
              <button className="btn-delete" onClick={closeUserSidebar}>
                Cancel
              </button>
              <button
                className="btn-role"
                onClick={handleUserSubmit}
                disabled={loading}
              >
                {loading
                  ? "Saving..."
                  : editUser
                    ? "Update User"
                    : "Create User"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ===== BULK USER UPLOAD MODAL ===== */}
      {showBulkUserModal && (
        <div
          className="cx-data-modal"
          onClick={(e) => e.target === e.currentTarget && closeBulkUserModal()}
        >
          <div className="cx-data-modal-box bulk-upload-modal">
            {/* Header */}
            <div className="modal-header">
              <h3>Bulk Upload Users</h3>
              <button className="modal-close-btn" onClick={closeBulkUserModal}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Instructions */}
              <div className="upload-section">
                <div className="upload-info">
                  <h4>📋 Upload Instructions</h4>
                  <ul>
                    <li>
                      <strong>Required:</strong> Name, Email, Password
                    </li>
                    <li>Password must be ≥6 characters</li>
                    <li>
                      <strong>Phone Number:</strong> Optional, but if provided
                      must be 10 digits
                    </li>
                    <li>
                      <strong>Role:</strong> `user` or `admin` *(default =
                      user)*
                    </li>
                    <li>
                      <strong>Status:</strong> Must match an existing Status
                      name
                    </li>
                  </ul>
                  <button
                    className="btn-outline"
                    onClick={downloadUserTemplate}
                  >
                    📥 Download Template
                  </button>
                </div>

                <div className="file-upload">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleBulkUserFileUpload}
                    id="bulk-user-file"
                    style={{ display: "none" }}
                  />
                  <label htmlFor="bulk-user-file" className="file-upload-label">
                    📁 Choose Excel/CSV File
                  </label>
                  {uploadFileName && (
                    <p className="upload-file-name">
                      Selected: <strong>{uploadFileName}</strong>
                    </p>
                  )}
                </div>
              </div>

              {/* Preview */}
              {bulkUsersData.length > 0 && (
                <div className="upload-preview">
                  <h4>👀 Preview ({bulkUsersData.length} users)</h4>
                  <div className="preview-table-container">
                    <table className="preview-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Password</th>
                          <th>Role</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkUsersData.slice(0, 5).map((u, idx) => (
                          <tr key={idx}>
                            <td>{u.name}</td>
                            <td>{u.email}</td>
                            <td>{u.password.replace(/./g, "•")}</td>
                            <td>{u.role}</td>
                            <td>
                              {statuses.find((s) => s._id === u.status)?.name ||
                                "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {bulkUsersData.length > 5 && (
                    <p className="preview-note">
                      + {bulkUsersData.length - 5} more rows
                    </p>
                  )}
                </div>
              )}

              {/* Errors */}
              {bulkUsersErrors.length > 0 && (
                <div className="upload-errors">
                  <h4>❌ Validation Errors ({bulkUsersErrors.length})</h4>
                  <div className="error-list">
                    {bulkUsersErrors.slice(0, 10).map((err, idx) => (
                      <div key={idx} className="error-item">
                        {err}
                      </div>
                    ))}
                  </div>
                  {bulkUsersErrors.length > 10 && (
                    <p className="error-note">
                      + {bulkUsersErrors.length - 10} more errors
                    </p>
                  )}
                </div>
              )}

              {/* Progress Bar */}
              {bulkUploadProgress > 0 && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${bulkUploadProgress}%` }}
                    ></div>
                  </div>
                  <p>Uploading... {bulkUploadProgress}%</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button className="btn-delete" onClick={closeBulkUserModal}>
                Cancel
              </button>
              <button
                className="btn-role"
                onClick={handleBulkUserUpload}
                disabled={
                  bulkUsersData.length === 0 ||
                  bulkUsersErrors.length > 0 ||
                  loading
                }
              >
                {loading
                  ? "Uploading..."
                  : `Upload ${bulkUsersData.length} Users`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

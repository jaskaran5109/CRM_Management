import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { logout } from "../redux/slices/authSlice";
import "./Sidebar.css";

// Import icons
import {
  MdSpaceDashboard, // Dashboard
  MdPointOfSale, // Sales (used for Overview)
  MdCalendarMonth, // Calendar
  MdBarChart, // Reports
  MdSettings, // Settings
  MdPerson, // Profile
  MdAnalytics, // CX Data
  MdPeople, // Users
  MdCheckCircle, // Status
  MdOutlineManageAccounts, // User Roles
  MdOutlineTaskAlt, // Role Status
  MdPrecisionManufacturing, // CX Models
  MdCategory, // CX Service Categories
  MdLogout, // Logout Icon
} from "react-icons/md"; // Using Material Design icons

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const isActive = (path) => location.pathname === path;

  // Added icons to navItems
  const navItems = [
    { label: "Dashboard", path: "/", icon: <MdSpaceDashboard /> },
    { label: "Complaints", path: "/complaints", icon: <MdPointOfSale /> },
    // { label: "Profile", path: "/profile", icon: <MdPerson /> },
    user?.role === "admin" && {
      label: "CX Data",
      path: "/cx-data",
      icon: <MdAnalytics />,
    },
  ];

  // Added icons to adminItems
  const adminItems =
    user?.role === "admin"
      ? [
          { label: "Users", path: "/admin", icon: <MdPeople /> },
          // { label: "Status", path: "/admin/status", icon: <MdCheckCircle /> },
          {
            label: "User Roles",
            path: "/admin/user-roles",
            icon: <MdOutlineManageAccounts />,
          },
          {
            label: "Role Status",
            path: "/admin/role-statuses",
            icon: <MdOutlineTaskAlt />,
          },
          {
            label: "CX Models",
            path: "/admin/cx-models",
            icon: <MdPrecisionManufacturing />,
          },
          {
            label: "CX Service Categories",
            path: "/admin/cx-service-categories",
            icon: <MdCategory />,
          },
        ]
      : [];

  const handleNavigate = (path) => {
    navigate(path);
    setSidebarOpen(false); // Close sidebar on navigation for mobile
  };

  return (
    <>
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          <div className="sidebar-brand" onClick={() => handleNavigate("/")}>
            <div className="sidebar-logo">C</div>
            <div className="sidebar-brand-text">
              <h2>CRM</h2> {/* Changed to match image */}
              <span>Workspace</span>
            </div>
          </div>

          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="sidebar-scrollable-content">
          {" "}
          {/* Added for scrollability */}
          <div className="sidebar-section">
            <p className="sidebar-section-title">Main</p>

            <div className="sidebar-links">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  className={`sidebar-link ${
                    isActive(item.path) ? "active" : ""
                  }`}
                  onClick={() => handleNavigate(item.path)}
                  disabled={item.disabled}
                >
                  <span className="sidebar-icon">{item.icon}</span>{" "}
                  {/* Render icon */}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
          {adminItems.length > 0 && (
            <div className="sidebar-section">
              <p className="sidebar-section-title">Admin</p>

              <div className="sidebar-links">
                {adminItems.map((item) => (
                  <button
                    key={item.path}
                    className={`sidebar-link ${
                      isActive(item.path) ? "active" : ""
                    }`}
                    onClick={() => handleNavigate(item.path)}
                  >
                    <span className="sidebar-icon">{item.icon}</span>{" "}
                    {/* Render icon */}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

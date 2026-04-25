import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MdAnalytics,
  MdCategory,
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdLogout,
  MdOutlineManageAccounts,
  MdOutlineTaskAlt,
  MdPeople,
  MdPointOfSale,
  MdPrecisionManufacturing,
  MdSpaceDashboard,
} from "react-icons/md";
import { logout } from "../redux/slices/authSlice";

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  sidebarOpen,
  setSidebarOpen,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const navItems = [
    { label: "Dashboard", path: "/", icon: MdSpaceDashboard },
    { label: "Complaints", path: "/complaints", icon: MdPointOfSale },
    user?.role === "admin" && {
      label: "CX Data",
      path: "/cx-data",
      icon: MdAnalytics,
    },
  ].filter(Boolean);

  const adminItems =
    user?.role === "admin"
      ? [
          { label: "Users", path: "/admin", icon: MdPeople },
          {
            label: "User Roles",
            path: "/admin/user-roles",
            icon: MdOutlineManageAccounts,
          },
          {
            label: "Role Status",
            path: "/admin/role-statuses",
            icon: MdOutlineTaskAlt,
          },
          {
            label: "CX Models",
            path: "/admin/cx-models",
            icon: MdPrecisionManufacturing,
          },
          {
            label: "Service Categories",
            path: "/admin/cx-service-categories",
            icon: MdCategory,
          },
        ]
      : [];

  const handleNavigate = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const linkClasses = (active) =>
    `crm-sidebar__link ${active ? "is-active" : ""}`;

  const renderSection = (title, items) => (
    <div className="crm-sidebar__section">
      {!collapsed && (
        <p className="crm-sidebar__section-title">
          {title}
        </p>
      )}

      <div className="crm-sidebar__links">
        {items.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;

          return (
            <button
              key={item.path}
              className={linkClasses(active)}
              onClick={() => handleNavigate(item.path)}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="crm-sidebar__icon" />
              {!collapsed && <span className="crm-sidebar__label">{item.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {sidebarOpen && (
        <button
          aria-label="Close sidebar overlay"
          className="crm-sidebar__overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`crm-sidebar ${
          collapsed ? "is-collapsed" : ""
        } ${sidebarOpen ? "is-open" : ""}`}
      >
        <div className="crm-sidebar__header">
          <button
            className="crm-sidebar__brand"
            onClick={() => handleNavigate("/")}
          >
            <div className="crm-sidebar__brand-mark">
              CRM
            </div>
            {!collapsed && (
              <div className="crm-sidebar__brand-copy">
                <p className="crm-sidebar__brand-title">
                  CRM Dashboard
                </p>
                <p className="crm-sidebar__brand-subtitle">
                  Service workspace
                </p>
              </div>
            )}
          </button>

          <div className="crm-sidebar__header-actions">
            <button
              className="crm-sidebar__icon-button crm-sidebar__icon-button--mobile"
              onClick={() => setSidebarOpen(false)}
            >
              <MdClose />
            </button>
            <button
              className="crm-sidebar__icon-button crm-sidebar__icon-button--desktop"
              onClick={onToggleCollapse}
            >
              {collapsed ? <MdChevronRight /> : <MdChevronLeft />}
            </button>
          </div>
        </div>

        <div className="crm-sidebar__body">
          {renderSection("Main", navItems)}
          {adminItems.length > 0 && renderSection("Admin", adminItems)}
        </div>

        <div className="crm-sidebar__footer">
          <button
            className={`crm-sidebar__logout ${collapsed ? "is-collapsed" : ""}`}
            onClick={() => dispatch(logout())}
            title="Logout"
          >
            <MdLogout />
            {!collapsed && "Logout"}
          </button>
        </div>
      </aside>
    </>
  );
}

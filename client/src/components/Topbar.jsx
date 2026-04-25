import { useEffect, useMemo, useRef, useState } from "react";
import { BsMoon, BsSun } from "react-icons/bs";
import { MdLogout, MdMenu } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { logout } from "../redux/slices/authSlice";
import { toggleTheme } from "../redux/slices/themeSlice";

const TITLES = {
  "/": ["Dashboard", "Business health, complaints, and customer activity"],
  "/complaints": ["Complaints", "Track tickets, updates, and resolution flow"],
  "/complaints/new": ["Create Complaint", "Capture a new service issue with full context"],
  "/cx-data": ["Customer Data", "Manage leads, assignments, and service metadata"],
  "/admin": ["Users", "Manage workspace access and user accounts"],
  "/admin/user-roles": ["User Roles", "Define responsibilities across the CRM"],
  "/admin/role-statuses": ["Role Statuses", "Control the handoff path between teams"],
  "/admin/cx-models": ["CX Models", "Maintain supported product models"],
  "/admin/cx-service-categories": ["Service Categories", "Standardize service workflows"],
  "/profile": ["Profile", "Personal details and account settings"],
};

export default function Topbar({ onMenuClick }) {
  const { user } = useSelector((state) => state.auth);
  const { mode: theme } = useSelector((state) => state.theme);
  const dispatch = useDispatch();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [title, subtitle] = useMemo(() => {
    return TITLES[location.pathname] || [
      "CRM Workspace",
      "Operations, users, and customer service in one place",
    ];
  }, [location.pathname]);

  return (
    <header className="crm-topbar">
      <div className="crm-topbar__inner">
        <div className="crm-topbar__left">
          <button
            className="crm-topbar__menu"
            onClick={onMenuClick}
          >
            <MdMenu />
          </button>

          <div className="crm-topbar__title-block">
            <div className="crm-topbar__title-row">
              <h1 className="crm-topbar__title">
                {title}
              </h1>
            </div>
            <p className="crm-topbar__subtitle">{subtitle}</p>
          </div>
        </div>

        <div className="crm-topbar__right" ref={menuRef}>
          <button
            className="crm-topbar__theme-toggle"
            onClick={() => dispatch(toggleTheme())}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            aria-label="Toggle theme"
          >
            {theme === "light" ? <BsMoon /> : <BsSun />}
          </button>

          <button
            className="crm-topbar__profile"
            onClick={() => setOpen((value) => !value)}
          >
            <div className="crm-topbar__avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="crm-topbar__profile-copy">
              <p className="crm-topbar__profile-name">
                {user?.name || "Unknown user"}
              </p>
              <p className="crm-topbar__profile-email">
                {user?.email || "No email"}
              </p>
            </div>
          </button>

          {open && (
            <div className="crm-topbar__dropdown">
              <div className="crm-topbar__dropdown-header">
                <p className="crm-topbar__dropdown-name">
                  {user?.name}
                </p>
                <p className="crm-topbar__dropdown-role">{user?.role}</p>
              </div>

              <div className="crm-topbar__dropdown-actions">
                <Link
                  to="/profile"
                  className="crm-topbar__dropdown-link"
                  onClick={() => setOpen(false)}
                >
                  Profile
                </Link>
                <button
                  className="crm-topbar__dropdown-link crm-topbar__dropdown-link--danger"
                  onClick={() => dispatch(logout())}
                >
                  <MdLogout />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

import { MdLogout } from "react-icons/md";
import { BsSun, BsMoon } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import "./Topbar.css";
import { logout } from "../redux/slices/authSlice";
import { toggleTheme } from "../redux/slices/themeSlice";

export default function Topbar({ onMenuClick }) {
  const { user } = useSelector((state) => state.auth);
  const { mode: theme } = useSelector((state) => state.theme);
  const dispatch = useDispatch();

  const [open, setOpen] = useState(false);
  const menuRef = useRef();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-toggle" onClick={onMenuClick}>
          ☰
        </button>
        <div>
          <h1 className="topbar-title">Dashboard</h1>
          <p className="topbar-subtitle">Welcome back, {user?.name}</p>
        </div>
      </div>

      <div className="topbar-right" ref={menuRef}>
        {/* Theme Toggle Button */}
        <button
          className="theme-toggle-btn"
          onClick={() => dispatch(toggleTheme())}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          aria-label="Toggle theme"
        >
          {theme === "light" ? (
            <BsMoon className="theme-icon" />
          ) : (
            <BsSun className="theme-icon" />
          )}
        </button>

        {/* Profile Trigger */}
        <div
          className="topbar-user-chip clickable"
          onClick={() => setOpen(!open)}
        >
          <div className="topbar-user-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div className="topbar-user-text">
            <span>{user?.name}</span>
            <small>{user?.email}</small>
          </div>
        </div>

        {/* Dropdown */}
        {open && (
          <div className="profile-dropdown">
            <Link to="/profile" className="dropdown-item">
              Profile
            </Link>

            <button
              className="dropdown-item logout"
              onClick={() => dispatch(logout())}
            >
              <MdLogout /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
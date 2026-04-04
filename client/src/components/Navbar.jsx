import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/slices/authSlice";
import { useNavigate } from "react-router-dom";

export default function Navbar({ currentPage }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <div className="nav-logo">C</div>
        <span>CRM</span>
      </div>
      <div className="nav-links">
        <button
          className={`nav-link ${currentPage === "dashboard" ? "active" : ""}`}
          onClick={() => navigate("/")}
        >
          Dashboard
        </button>
        <button
          className={`nav-link ${currentPage === "profile" ? "active" : ""}`}
          onClick={() => navigate("/profile")}
        >
          Profile
        </button>
        <button
          className={`nav-link ${currentPage === "cx-data" ? "active" : ""}`}
          onClick={() => navigate("/cx-data")}
        >
          CX Data
        </button>
        {user?.role === "admin" && (
          <>
            <button
              className={`nav-link ${currentPage === "admin" ? "active" : ""}`}
              onClick={() => navigate("/admin")}
            >
              Users
            </button>
            <button
              className={`nav-link ${currentPage === "status" ? "active" : ""}`}
              onClick={() => navigate("/admin/status")}
            >
              Status
            </button>

            <button
              className={`nav-link ${currentPage === "user-roles" ? "active" : ""}`}
              onClick={() => navigate("/admin/user-roles")}
            >
              User Roles
            </button>

            <button
              className={`nav-link ${currentPage === "role-statuses" ? "active" : ""}`}
              onClick={() => navigate("/admin/role-statuses")}
            >
              Role Status
            </button>

            <button
              className={`nav-link ${currentPage === "cx-models" ? "active" : ""}`}
              onClick={() => navigate("/admin/cx-models")}
            >
              CX Models
            </button>

            <button
              className={`nav-link ${currentPage === "cx-service-categories" ? "active" : ""}`}
              onClick={() => navigate("/admin/cx-service-categories")}
            >
              CX Service Categories
            </button>
          </>
        )}
      </div>
      <div className="nav-right">
        <span className="nav-user">{user?.name}</span>
        <span className={`role-badge ${user?.role}`}>{user?.role}</span>
        <button className="btn-logout" onClick={() => dispatch(logout())}>
          Logout
        </button>
      </div>
    </nav>
  );
}

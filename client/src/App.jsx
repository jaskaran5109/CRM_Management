import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useSelector } from "react-redux";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import AdminStatus from "./pages/AdminPages/AdminStatus";
import { ProtectedRoute } from "./protectedRoute/ProtectedRoute";
import { AdminRoute } from "./protectedRoute/AdminRoute";
import AuthLayout from "./AuthLayout";
import AdminUserRoles from "./pages/AdminPages/AdminUserRoles";
import AdminRoleStatus from "./pages/AdminPages/AdminRoleStatus";
import AdminCXModels from "./pages/AdminPages/AdminCXModel";
import AdminCXServiceCategories from "./pages/AdminPages/AdminCXServiceCategories";
import CXData from "./pages/CXData";
import Complaints from "./pages/Complaints";
import CreateComplaint from "./pages/CreateComplaint";
import ComplaintDetail from "./pages/ComplaintDetail";
import PublicComplaintForm from "./pages/PublicComplaintForm";
import TrackComplaint from "./pages/TrackComplaint";
import AppShell from "./components/AppShell";
import ThemeInitializer from "./components/ThemeInitializer";

export default function App() {
  const { user } = useSelector((state) => state.auth);

  return (
    <>
      <ThemeInitializer />
      <Router>
        <Routes>
          <Route
            path="/login"
            element={
              !user ? (
                <AuthLayout>
                  <Login />
                </AuthLayout>
              ) : (
                <Navigate to="/" />
              )
            }
          />

          <Route
            path="/signup"
            element={
              !user ? (
                <AuthLayout>
                  <Signup />
                </AuthLayout>
              ) : (
                <Navigate to="/" />
              )
            }
          />

          <Route
            path="/forgot-password"
            element={
              !user ? (
                <AuthLayout>
                  <ForgotPassword />
                </AuthLayout>
              ) : (
                <Navigate to="/" />
              )
            }
          />

          <Route
            path="/reset-password/:token"
            element={
              !user ? (
                <AuthLayout>
                  <ResetPassword />
                </AuthLayout>
              ) : (
                <Navigate to="/" />
              )
            }
          />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell>
                  <Dashboard />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppShell>
                  <Profile />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/cx-data"
            element={
              <ProtectedRoute>
                <AppShell>
                  <CXData />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/complaints"
            element={
              <ProtectedRoute>
                <AppShell>
                  <Complaints />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/complaints/new"
            element={
              <ProtectedRoute>
                <AppShell>
                  <CreateComplaint />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/complaints/:id"
            element={
              <ProtectedRoute>
                <AppShell>
                  <ComplaintDetail />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AppShell>
                  <AdminDashboard />
                </AppShell>
              </AdminRoute>
            }
          />

          <Route
            path="/admin/status"
            element={
              <AdminRoute>
                <AppShell>
                  <AdminStatus />
                </AppShell>
              </AdminRoute>
            }
          />

          <Route
            path="/admin/user-roles"
            element={
              <AdminRoute>
                <AppShell>
                  <AdminUserRoles />
                </AppShell>
              </AdminRoute>
            }
          />

          <Route
            path="/admin/role-statuses"
            element={
              <AdminRoute>
                <AppShell>
                  <AdminRoleStatus />
                </AppShell>
              </AdminRoute>
            }
          />

          <Route
            path="/admin/cx-models"
            element={
              <AdminRoute>
                <AppShell>
                  <AdminCXModels />
                </AppShell>
              </AdminRoute>
            }
          />

          <Route
            path="/admin/cx-service-categories"
            element={
              <AdminRoute>
                <AppShell>
                  <AdminCXServiceCategories />
                </AppShell>
              </AdminRoute>
            }
          />

          {/* Public Complaint Portal Routes (No Authentication Required) */}
          <Route path="/complaint-form" element={<PublicComplaintForm />} />

          <Route path="/track-complaint" element={<TrackComplaint />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </>
  );
}

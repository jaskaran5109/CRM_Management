import { useAuth } from '../context/AuthContext';

// Wraps any component — redirects to auth if not logged in
export default function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return (
      <div className="center-screen">
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#888', fontSize: 14 }}>You must be logged in to view this page.</p>
        </div>
      </div>
    );
  }

  if (adminOnly && user.role !== 'admin') {
    return (
      <div className="center-screen">
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#e94560', fontSize: 14, fontWeight: 600 }}>Access Denied</p>
          <p style={{ color: '#888', fontSize: 13, marginTop: 6 }}>This page is for admins only.</p>
        </div>
      </div>
    );
  }

  return children;
}
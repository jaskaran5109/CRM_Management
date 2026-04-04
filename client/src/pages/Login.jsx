import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearMessages } from '../redux/slices/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { AuthCard } from '../components/AuthCard';

export default function Login() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  useEffect(() => { dispatch(clearMessages()); }, [dispatch]);

  useEffect(() => {
    if (error && !toast.isActive("error-toast")) {
      toast.error(error, { toastId: "error-toast" });
      dispatch(clearMessages());
    }
  }, [error]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.email.trim() || !form.password.trim()) {
      return toast.error("Please enter email and password");
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(form.email)) {
      return toast.error("Email is invalid");
    }

    dispatch(loginUser(form));
  };

  return (
    <motion.main
      className="auth-screen-new"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <section className="auth-grid">
        <article className="auth-hero">
          <div className="auth-hero-text">
            <h1>Welcome back</h1>
            <p>Login to access your dashboard and manage your performance in one place.</p>
          </div>
          <div className="hero-illustration" aria-hidden="true">
            <svg viewBox="0 0 980 600" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="zigzagColor" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22b8cf" />
                  <stop offset="100%" stopColor="#5c7cfa" />
                </linearGradient>
              </defs>
              <path d="M0 120 L120 60 L240 146 L360 80 L480 180 L600 130 L720 220 L840 160 L980 230 V310 H0 Z" fill="url(#zigzagColor)" opacity="0.22" />
              <circle cx="200" cy="340" r="80" fill="#60a5fa" opacity="0.42" />
              <circle cx="680" cy="270" r="95" fill="#7dd3fc" opacity="0.45" />
              <circle cx="490" cy="420" r="55" fill="#0ea5e9" opacity="0.6" />
            </svg>
          </div>
          <div className="hero-wave" />
        </article>

        <article className="auth-form-wrapper">
          <AuthCard
            title="Login"
            subtitle="Securely sign in to your account"
            footer={
              <p className="switch-text">
                Don't have an account?{' '}
                <Link to="/signup" className="link">Sign up</Link>
              </p>
            }
          >
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>

              <div className="forgot-password">
                <Link to="/forgot-password" className="link">Forgot Password?</Link>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </AuthCard>
        </article>
      </section>
    </motion.main>
  );
}
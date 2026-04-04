import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { forgotPassword, clearMessages } from '../redux/slices/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { AuthCard } from '../components/AuthCard';

export default function ForgotPassword() {
  const dispatch = useDispatch();
  const { loading, error, successMessage } = useSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => { dispatch(clearMessages()); }, [dispatch]);

  useEffect(() => {
    if (error && !toast.isActive("error-toast")) {
      toast.dismiss("loading");
      toast.error(`❌ ${error}`, { 
        toastId: "error-toast", 
        autoClose: 4000 
      });
      dispatch(clearMessages());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (successMessage && !toast.isActive("success-toast")) {
      toast.dismiss("loading");
      toast.success(successMessage, { 
        toastId: "success-toast", 
        autoClose: 5000,
        position: "top-center"
      });
      dispatch(clearMessages());
      // Clear the email field after successful submission
      setEmail('');
    }
  }, [successMessage, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.warning("⚠️ Please enter your email address");
      return;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      toast.warning("⚠️ Please enter a valid email address");
      return;
    }

    toast.loading("📧 Sending reset link...", { toastId: "loading" });
    dispatch(forgotPassword(email));
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
            <h1>Forgot Password</h1>
            <p>Securely reset your password in a few quick steps.</p>
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
            title="Reset password"
            subtitle="Enter your account email to get a reset link"
            footer={
              <p className="switch-text">
                Remembered your password?{' '}
                <Link to="/login" className="link">Sign in</Link>
              </p>
            }
          >
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Sending reset link...' : 'Send Reset Link'}
              </button>
            </form>
          </AuthCard>
        </article>
      </section>
    </motion.main>
  );
}
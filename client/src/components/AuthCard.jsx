import { motion } from "framer-motion";

export function AuthCard({ title, subtitle, children, footer }) {
  return (
    <motion.div
      className="auth-card"
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <div className="auth-card-head">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="auth-card-body">{children}</div>
      <div className="auth-card-footer">{footer}</div>
    </motion.div>
  );
}

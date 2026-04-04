const AuthLayout = ({ children }) => {
  return (
    <div className="auth-screen">
      <div className="auth-container">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
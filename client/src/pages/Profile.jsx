import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile, changePassword, clearMessages } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';
import './ProfileStyles.css';

export default function Profile() {
  const dispatch = useDispatch();
  const { user, loading, error, successMessage } = useSelector((state) => state.auth);

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [passError, setPassError] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled || false);
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    activityAlerts: true,
  });

  // UI states
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    return () => dispatch(clearMessages());
  }, [dispatch]);

  useEffect(() => {
    if (error && !toast.isActive("error-toast")) {
      toast.error(error, { toastId: "error-toast" });
      dispatch(clearMessages());
    }

    if (successMessage && !toast.isActive("success-toast")) {
      toast.success(successMessage, { toastId: "success-toast" });
      dispatch(clearMessages());
    }
  }, [error, successMessage, dispatch]);

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error('Name and email are required');
      return;
    }
    if (phone && !/^[0-9]{10}$/.test(phone)) {
      toast.error('Phone number must be 10 digits');
      return;
    }
    dispatch(updateProfile({ name, phoneNumber: phone, status: user?.status?._id || null }));
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPassError('');
    if (passwords.newPass.length < 6) {
      return setPassError('New password must be at least 6 characters');
    }
    if (passwords.newPass !== passwords.confirm) {
      return setPassError('Passwords do not match');
    }
    dispatch(changePassword({
      currentPassword: passwords.current,
      newPassword: passwords.newPass,
    })).then((res) => {
      if (!res.error) {
        setPasswords({ current: '', newPass: '', confirm: '' });
        setActiveTab('security');
      }
    });
  };

  const handleNotificationChange = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTwoFactorToggle = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    // Add API call here to enable/disable 2FA
  };  

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-header-content">
          <h2>My Profile</h2>
          <p className="subtitle">Manage your account settings and preferences</p>
        </div>
      </div>

      <div className="profile-container">
        {/* Left Sidebar - Avatar Card */}
        <aside className="profile-sidebar">
          <div className="profile-avatar-card">
            <div className="avatar-container">
              <div className="avatar-circle">{user?.name?.charAt(0)?.toUpperCase()}</div>
              <label className="avatar-upload-btn" title="Upload profile picture">
                <span>📷</span>
              </label>
            </div>
            <h3>{user?.name}</h3>
            <p className="email-display">{user?.email}</p>
            <span className={`role-badge ${user?.role}`}>
              {user?.role?.toUpperCase()}
            </span>
            
            <div className="profile-meta">
              <div className="meta-item">
                <span className="meta-label">Member Since</span>
                <span className="meta-value">{new Date(user?.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Account Status</span>
                <span className="meta-value status-active">{user?.status?.name}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Account ID</span>
                <span className="meta-value mono">{user?._id?.slice(-8)}...</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          {/* <div className="quick-stats">
            <div className="stat-item">
              <span className="stat-value">5</span>
              <span className="stat-label">Connected Devices</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">12</span>
              <span className="stat-label">Recent Activities</span>
            </div>
          </div> */}
        </aside>

        {/* Main Content Area */}
        <main className="profile-main">
          {/* Tab Navigation */}
          <div className="profile-tabs">
            <button
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <span>👤</span> Overview
            </button>
            <button
              className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <span>🔒</span> Security
            </button>
            {/* <button
              className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <span>🔔</span> Notifications
            </button>
            <button
              className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              <span>📊</span> Activity
            </button> */}
          </div>

          {/* TAB: Overview */}
          {activeTab === 'overview' && (
            <div className="tab-content">
              <div className="section-card">
                <div className="section-header">
                  <h3>Personal Information</h3>
                  {!editMode && (
                    <button
                      className="btn-edit"
                      onClick={() => setEditMode(true)}
                    >
                      ✏️ Edit
                    </button>
                  )}
                </div>

                {editMode ? (
                  <form onSubmit={handleProfileSubmit}>
                    <div className="form-grid">
                      <div className="field">
                        <label>Full Name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                      <div className="field">
                        <label>Email Address</label>
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                      <div className="field">
                        <label>Phone Number</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          placeholder="Enter your phone number"
                        />
                      </div>
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Saving...' : '💾 Save Changes'}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          setEditMode(false);
                          setName(user?.name);
                          setEmail(user?.email);
                          setPhone(user?.phoneNumber || '');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="info-display">
                    <div className="info-row">
                      <span className="info-label">Full Name</span>
                      <span className="info-value">{user?.name}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Email Address</span>
                      <span className="info-value">{user?.email}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Phone Number</span>
                      <span className="info-value">{phone || 'Not provided'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Role</span>
                      <span className={`role-badge small ${user?.role}`}>{user?.role}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: Security */}
          {activeTab === 'security' && (
            <div className="tab-content">
              {/* Change Password */}
              <div className="section-card">
                <h3>Change Password</h3>
                <p className="section-subtitle">Keep your account secure by using a strong password</p>
                {passError && <div className="error-msg">{passError}</div>}
                <form onSubmit={handlePasswordSubmit}>
                  <div className="form-grid">
                    <div className="field full-width">
                      <label>Current Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={passwords.current}
                        onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                        required
                      />
                    </div>
                    <div className="field full-width">
                      <label>New Password</label>
                      <input
                        type="password"
                        placeholder="Min. 6 characters"
                        value={passwords.newPass}
                        onChange={e => setPasswords({ ...passwords, newPass: e.target.value })}
                        required
                      />
                    </div>
                    <div className="field full-width">
                      <label>Confirm New Password</label>
                      <input
                        type="password"
                        placeholder="Repeat new password"
                        value={passwords.confirm}
                        onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={loading}>
                      {loading ? 'Updating...' : '🔄 Update Password'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Two-Factor Authentication */}
              {/* <div className="section-card">
                <div className="section-header">
                  <div>
                    <h3>Two-Factor Authentication</h3>
                    <p className="section-subtitle">Add an extra layer of security to your account</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={twoFactorEnabled}
                      onChange={handleTwoFactorToggle}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                {twoFactorEnabled && (
                  <div className="security-info">
                    <p>📱 Two-factor authentication is enabled for your account.</p>
                    <p>You will be asked to provide a code from your authenticator app when logging in.</p>
                  </div>
                )}
              </div> */}

              {/* Connected Devices */}
              {/* <div className="section-card">
                <h3>Connected Devices</h3>
                <p className="section-subtitle">Manage devices that have access to your account</p>
                <div className="devices-list">
                  <div className="device-item">
                    <div className="device-icon">💻</div>
                    <div className="device-info">
                      <p className="device-name">Windows Desktop</p>
                      <p className="device-details">Last active: 2 minutes ago</p>
                    </div>
                    <button className="btn-small">Remove</button>
                  </div>
                  <div className="device-item">
                    <div className="device-icon">📱</div>
                    <div className="device-info">
                      <p className="device-name">iPhone 14</p>
                      <p className="device-details">Last active: 1 hour ago</p>
                    </div>
                    <button className="btn-small">Remove</button>
                  </div>
                </div>
              </div> */}
            </div>
          )}

          {/* TAB: Notifications */}
          {activeTab === 'notifications' && (
            <div className="tab-content">
              <div className="section-card">
                <h3>Notification Preferences</h3>
                <p className="section-subtitle">Control how and when you receive notifications</p>
                
                <div className="notifications-list">
                  <div className="notification-item">
                    <div className="notification-content">
                      <p className="notification-title">Email Notifications</p>
                      <p className="notification-desc">Receive important updates via email</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notifications.emailNotifications}
                        onChange={() => handleNotificationChange('emailNotifications')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="notification-item">
                    <div className="notification-content">
                      <p className="notification-title">Push Notifications</p>
                      <p className="notification-desc">Get instant alerts in your browser</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notifications.pushNotifications}
                        onChange={() => handleNotificationChange('pushNotifications')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="notification-item">
                    <div className="notification-content">
                      <p className="notification-title">Activity Alerts</p>
                      <p className="notification-desc">Get notified about unusual account activity</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notifications.activityAlerts}
                        onChange={() => handleNotificationChange('activityAlerts')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn-primary">💾 Save Preferences</button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Activity */}
          {activeTab === 'activity' && (
            <div className="tab-content">
              <div className="section-card">
                <h3>Account Activity</h3>
                <p className="section-subtitle">Recent login and account activity</p>
                
                <div className="activity-list">
                  <div className="activity-item">
                    <div className="activity-icon">✓</div>
                    <div className="activity-detail">
                      <p className="activity-action">Login from Windows (192.168.1.1)</p>
                      <p className="activity-time">Today at 2:30 PM</p>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon">✎</div>
                    <div className="activity-detail">
                      <p className="activity-action">Profile updated</p>
                      <p className="activity-time">Yesterday at 4:15 PM</p>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon">🔐</div>
                    <div className="activity-detail">
                      <p className="activity-action">Password changed</p>
                      <p className="activity-time">3 days ago</p>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon">✓</div>
                    <div className="activity-detail">
                      <p className="activity-action">Login from iPhone (203.0.113.42)</p>
                      <p className="activity-time">1 week ago</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="section-card danger-zone">
                <h3 style={{ color: '#e94560' }}>Danger Zone</h3>
                <p className="section-subtitle">Irreversible actions</p>
                
                {showDeleteConfirm ? (
                  <div className="delete-confirmation">
                    <p className="warning-text">⚠️ This action cannot be undone. All your data will be permanently deleted.</p>
                    <div className="form-actions">
                      <button className="btn-delete">🗑️ Delete Account</button>
                      <button
                        className="btn-secondary"
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="btn-danger"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    🗑️ Delete Account
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
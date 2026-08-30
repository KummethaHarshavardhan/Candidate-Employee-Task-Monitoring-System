import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Shield, UserCheck, User, LogOut, Bell } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { Breadcrumbs } from '../Breadcrumbs';
import { notificationService } from '../../../services/notificationService';
import './Topbar.css';

export const Topbar = ({ onToggleMobileSidebar }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = React.useState([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [showNotifications, setShowNotifications] = React.useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications();
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  React.useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await notificationService.markRead(notification._id);
      fetchNotifications();
    }
  };

  const notificationRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showNotifications]);

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'ADMIN':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: 'rgba(239, 68, 68, 0.3)', icon: Shield };
      case 'REVIEWER':
        return { bg: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd', border: 'rgba(139, 92, 246, 0.3)', icon: UserCheck };
      default:
        return { bg: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', border: 'rgba(59, 130, 246, 0.3)', icon: User };
    }
  };

  const badgeStyle = getRoleBadgeStyle(user?.role);
  const RoleIcon = badgeStyle.icon;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          onClick={onToggleMobileSidebar}
          className="mobile-menu-toggle"
          aria-label="Toggle sidebar menu"
        >
          <Menu size={22} />
        </button>
        <div className="topbar-breadcrumbs-wrapper">
          <Breadcrumbs />
        </div>
      </div>

      <div className="topbar-right">
        {/* Notifications Dropdown */}
        <div className="notifications-wrapper" ref={notificationRef}>
          <button
            type="button"
            onClick={() => setShowNotifications((current) => !current)}
            className="topbar-icon-btn"
            title="Notifications"
            aria-label="Notifications"
            aria-expanded={showNotifications}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="topbar-badge-count">{unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <>
              <div
                className="notifications-backdrop"
                onClick={() => setShowNotifications(false)}
              />
              <div className="notifications-popover">
                <div className="notifications-header">
                  <strong>Notifications</strong>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={async () => { await notificationService.markAllRead(); fetchNotifications(); }}
                      className="notifications-mark-read-btn"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="notifications-list">
                  {notifications.length === 0 ? (
                    <p className="notifications-empty">
                      No notifications
                    </p>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification._id}
                        type="button"
                        onClick={() => handleNotificationClick(notification)}
                        className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                      >
                        <strong className="notification-title">{notification.title}</strong>
                        <span className="notification-message">
                          {notification.message}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Info */}
        <Link
          to="/profile"
          className="topbar-profile-link"
          title={`Profile: ${user?.name}`}
        >
          <div className="topbar-avatar">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <span className="topbar-user-name">{user?.name || 'User'}</span>
        </Link>

        {/* Role Badge */}
        <div
          className={`topbar-role-badge ${user?.role === 'ADMIN' ? 'topbar-admin-badge' : ''}`}
          style={{
            backgroundColor: badgeStyle.bg,
            color: badgeStyle.color,
            border: `1px solid ${badgeStyle.border}`,
          }}
        >
          <RoleIcon size={13} />
          <span>{user?.role || 'GUEST'}</span>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={logout}
          className="topbar-icon-btn topbar-logout-btn"
          title="Sign Out"
          aria-label="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};

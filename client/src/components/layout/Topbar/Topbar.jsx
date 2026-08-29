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
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
          }}
          className="mobile-menu-toggle"
          aria-label="Toggle sidebar menu"
        >
          <Menu size={22} />
        </button>
        <Breadcrumbs />
      </div>

      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowNotifications((current) => !current)}
            style={{ position: 'relative', display: 'flex', padding: '0.4rem', background: 'transparent', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', cursor: 'pointer' }}
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && <span style={{ position: 'absolute', top: '-6px', right: '-6px', minWidth: '17px', height: '17px', padding: '0 3px', borderRadius: 'var(--radius-full)', background: 'var(--danger)', color: '#fff', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</span>}
          </button>
          {showNotifications && <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 0.5rem)', width: '320px', maxWidth: 'calc(100vw - 2rem)', maxHeight: '360px', overflowY: 'auto', padding: '0.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 50 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <strong>Notifications</strong>
              {unreadCount > 0 && <button type="button" onClick={async () => { await notificationService.markAllRead(); fetchNotifications(); }} style={{ border: 0, background: 'transparent', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.75rem' }}>Mark all read</button>}
            </div>
            {notifications.length === 0 ? <p style={{ padding: '1rem 0.5rem', fontSize: '0.8rem' }}>No notifications</p> : notifications.map((notification) => <button key={notification._id} type="button" onClick={() => handleNotificationClick(notification)} style={{ width: '100%', textAlign: 'left', padding: '0.65rem 0.5rem', background: notification.read ? 'transparent' : 'var(--primary-light)', border: 0, borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-primary)', cursor: 'pointer' }}><strong style={{ display: 'block', fontSize: '0.8rem' }}>{notification.title}</strong><span style={{ display: 'block', marginTop: '0.2rem', whiteSpace: 'pre-line', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{notification.message}</span></button>)}
          </div>}
        </div>
        {/* User Info */}
        <Link
          to="/profile"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.35rem 0.65rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
            textDecoration: 'none',
            fontSize: '0.825rem',
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            {user?.name?.charAt(0) || 'U'}
          </div>
          <span style={{ fontWeight: 600 }}>{user?.name || 'User'}</span>
        </Link>

        {/* Role Badge */}
        <div
          className={`topbar-role-badge ${user?.role === 'ADMIN' ? 'topbar-admin-badge' : ''}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: badgeStyle.bg,
            color: badgeStyle.color,
            border: `1px solid ${badgeStyle.border}`,
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
          }}
        >
          <RoleIcon size={13} />
          <span>{user?.role || 'GUEST'}</span>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={logout}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-muted)',
            padding: '0.4rem',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
          title="Sign Out"
          aria-label="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};

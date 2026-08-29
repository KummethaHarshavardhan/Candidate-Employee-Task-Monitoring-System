import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  TrendingUp,
  Send,
  ClipboardCheck,
  BarChart3,
  User,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import spaxiosLogo from '../../../assets/spaxios-logo.svg';
import './Sidebar.css';

export const Sidebar = ({ isMobileOpen, setIsMobileOpen, isDesktopOpen, setIsDesktopOpen }) => {
  const { user, logout, role } = useAuth();

  const isAdmin = role === 'ADMIN';
  const isReviewer = role === 'REVIEWER';
  const isCandidate = role === 'CANDIDATE';

  const closeMobile = () => {
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  const closeSidebar = () => {
    closeMobile();
    if (setIsDesktopOpen) setIsDesktopOpen(false);
  };

  return (
    <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''} ${isDesktopOpen ? '' : 'desktop-closed'}`}>
      <div className="sidebar-header">
        <Link to="/dashboard" className="sidebar-brand" onClick={closeMobile} aria-label="SPAXIOS INNOVATION Dashboard">
          <img
            src={spaxiosLogo}
            alt="SPAXIOS INNOVATION"
            className="brand-logo-img"
          />
        </Link>
        {(setIsMobileOpen || setIsDesktopOpen) && (
          <button
            onClick={closeSidebar}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              padding: '4px',
            }}
            className="mobile-close-btn"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Overview</div>
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          onClick={closeMobile}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <div className="nav-section-title">Core Modules</div>
        {/* Candidates - Admin & Reviewer */}
        {(isAdmin || isReviewer) && (
          <NavLink
            to="/candidates"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''} nav-item-employees nav-item-candidates`}
            onClick={closeMobile}
          >
            <Users size={18} />
            <span>Candidates</span>
          </NavLink>
        )}

        {/* Task Allocation - All users */}
        <NavLink
          to="/tasks"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          onClick={closeMobile}
        >
          <CheckSquare size={18} />
          <span>{isCandidate ? 'My Assigned Tasks' : 'Task Allocation'}</span>
        </NavLink>

        {/* Task Progress - All users */}
        <NavLink
          to="/progress"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          onClick={closeMobile}
        >
          <TrendingUp size={18} />
          <span>Progress Tracking</span>
        </NavLink>

        {/* Submissions - Candidates & Admins */}
        <NavLink
          to="/submissions"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          onClick={closeMobile}
        >
          <Send size={18} />
          <span>{isCandidate ? 'Submit Work' : 'Submissions'}</span>
        </NavLink>

        {/* Reviews - Reviewers & Admins */}
        {(isAdmin || isReviewer) && (
          <NavLink
            to="/reviews"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMobile}
          >
            <ClipboardCheck size={18} />
            <span>Review Queue</span>
          </NavLink>
        )}

        {/* Reports - All users (role-tailored) */}
        <div className="nav-section-title">Analytics</div>
        <NavLink
          to="/reports"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          onClick={closeMobile}
        >
          <BarChart3 size={18} />
          <span>Reports & Analytics</span>
        </NavLink>

        <div className="nav-section-title">Account</div>
        <NavLink
          to="/profile"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          onClick={closeMobile}
        >
          <User size={18} />
          <span>My Profile</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              color: '#818cf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
              border: '1px solid var(--primary-border)',
            }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
            >
              {user?.name || 'User'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {user?.role || 'Guest'}
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.45rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--danger-light)';
            e.currentTarget.style.color = 'var(--danger)';
            e.currentTarget.style.borderColor = 'var(--danger-border)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

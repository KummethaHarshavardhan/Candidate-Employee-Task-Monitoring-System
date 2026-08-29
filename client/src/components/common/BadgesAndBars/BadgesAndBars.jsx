import React from 'react';
import './BadgesAndBars.css';

export const Badge = ({
  children,
  variant = 'default', // 'primary', 'success', 'warning', 'danger', 'info', 'purple'
  className = '',
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  );
};

export const StatusBadge = ({ status, isOverdue = false, className = '' }) => {
  // If overdue is true and not completed, we can display Overdue badge or highlight it
  if (isOverdue && status !== 'COMPLETED') {
    return (
      <span className={`badge badge-status-OVERDUE ${className}`} title="Task is overdue!">
        <span className="badge-dot" />
        OVERDUE
      </span>
    );
  }

  const formatStatus = (s) => {
    switch (s) {
      case 'IN_PROGRESS':
        return 'IN PROGRESS';
      case 'REWORK_REQUIRED':
        return 'REWORK REQUIRED';
      default:
        return s || 'PENDING';
    }
  };

  const statusKey = status || 'PENDING';

  return (
    <span className={`badge badge-status-${statusKey} ${className}`}>
      <span className="badge-dot" />
      {formatStatus(statusKey)}
    </span>
  );
};

export const PriorityBadge = ({ priority, className = '' }) => {
  const p = (priority || 'MEDIUM').toUpperCase();
  return (
    <span className={`badge badge-priority-${p} ${className}`}>
      {p}
    </span>
  );
};

export const ProgressBar = ({
  percentage = 0,
  showLabel = true,
  height = 8,
  variant = 'auto', // 'auto', 'primary', 'success', 'warning', 'danger'
  className = '',
}) => {
  const clamped = Math.min(100, Math.max(0, Math.round(percentage)));

  let fillClass = 'progress-fill-primary';
  if (variant === 'auto') {
    if (clamped >= 100) fillClass = 'progress-fill-success';
    else if (clamped >= 50) fillClass = 'progress-fill-primary';
    else if (clamped > 20) fillClass = 'progress-fill-warning';
    else fillClass = 'progress-fill-danger';
  } else {
    fillClass = `progress-fill-${variant}`;
  }

  return (
    <div className={className} style={{ width: '100%' }}>
      {showLabel && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.775rem',
            fontWeight: 600,
            marginBottom: '0.25rem',
            color: 'var(--text-secondary)',
          }}
        >
          <span>Progress</span>
          <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{clamped}%</span>
        </div>
      )}
      <div className="progress-bar-container" style={{ height: `${height}px` }}>
        <div
          className={`progress-bar-fill ${fillClass}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};

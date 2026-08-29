import React from 'react';
import './Card.css';

export const Card = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  children,
  className = '',
  style = {},
  noPadding = false,
}) => {
  return (
    <div className={`card ${className}`} style={style}>
      {(title || subtitle || actions) && (
        <div className="card-header">
          <div>
            {title && (
              <h3 className="card-title">
                {Icon && <Icon size={18} color="var(--primary)" />}
                {title}
              </h3>
            )}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {actions && <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>{actions}</div>}
        </div>
      )}
      <div className="card-body" style={noPadding ? { padding: 0 } : {}}>
        {children}
      </div>
    </div>
  );
};

import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const routeNameMap = {
    dashboard: 'Dashboard',
    candidates: 'Candidates',
    tasks: 'Task Allocation',
    create: 'New Task',
    progress: 'Progress Monitoring',
    teams: 'Team Progress',
    submissions: 'Submissions',
    reviews: 'Review Queue',
    reports: 'Reports & Analytics',
    profile: 'My Profile',
    edit: 'Edit',
  };

  return (
    <nav
      aria-label="Breadcrumb"
      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem' }}
    >
      <Link
        to="/dashboard"
        style={{
          display: 'flex',
          alignItems: 'center',
          color: 'var(--text-muted)',
          transition: 'color var(--transition-fast)',
        }}
        aria-label="Home"
      >
        <Home size={15} />
      </Link>
      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const name = routeNameMap[value.toLowerCase()] || value;

        return (
          <React.Fragment key={to}>
            <ChevronRight size={13} color="var(--border-default)" />
            {isLast ? (
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{name}</span>
            ) : (
              <Link to={to} style={{ color: 'var(--text-muted)' }}>
                {name}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

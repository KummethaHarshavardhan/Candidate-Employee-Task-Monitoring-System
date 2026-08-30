import React from 'react';
import './DataComponents.css';
import { Search, ChevronLeft, ChevronRight, AlertCircle, Inbox } from 'lucide-react';
import { Button } from '../Button/Button';

export const Table = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No records found',
  emptySubtext = 'Try adjusting your search or filters',
  onRowClick,
  className = '',
}) => {
  if (loading) {
    return (
      <div className="table-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading data...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <Inbox size={28} />
        </div>
        <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{emptyMessage}</h4>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{emptySubtext}</p>
      </div>
    );
  }

  return (
    <div className={`table-container ${className}`}>
      <table className="custom-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                style={col.headerStyle || {}}
                className={col.headerClassName || ''}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr
              key={row._id || row.id || rowIdx}
              onClick={() => onRowClick && onRowClick(row)}
              style={onRowClick ? { cursor: 'pointer' } : {}}
            >
              {columns.map((col, colIdx) => (
                <td
                  key={col.key || colIdx}
                  style={col.cellStyle || {}}
                  className={col.cellClassName || ''}
                >
                  {col.render ? col.render(row, rowIdx) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="table-pagination">
      <div className="pagination-info">
        {totalItems !== undefined && (
          <span>
            Total: <strong style={{ color: 'var(--text-primary)' }}>{totalItems}</strong> entries
          </span>
        )}
      </div>
      <div className="pagination-actions">
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          icon={ChevronLeft}
        >
          Previous
        </Button>
        <span className="pagination-pages">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
};

export const SearchBar = ({
  value = '',
  onChange,
  placeholder = 'Search...',
  className = '',
}) => {
  return (
    <div className={`search-input-wrapper ${className}`}>
      <Search className="search-icon" size={16} />
      <input
        type="text"
        className="form-control"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export const LoadingSpinner = ({ size = 28, text = 'Loading...' }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1rem',
        gap: '0.75rem',
      }}
    >
      <div className="spinner" style={{ width: `${size}px`, height: `${size}px` }} />
      {text && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{text}</p>}
    </div>
  );
};

export const SkeletonLoader = ({ count = 3, height = 40, style = {} }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', ...style }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: `${height}px`, width: '100%' }} />
      ))}
    </div>
  );
};

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No Data Available',
  description = 'There is currently no information to display here.',
  action,
}) => {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon size={30} />
      </div>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>{title}</h3>
      <p style={{ maxWidth: '420px', marginBottom: action ? '1.25rem' : 0 }}>{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export const ErrorState = ({
  title = 'Failed to Load Data',
  message = 'An error occurred while fetching information.',
  onRetry,
}) => {
  return (
    <div className="empty-state" style={{ borderColor: 'var(--danger-border)' }}>
      <div
        className="empty-icon"
        style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}
      >
        <AlertCircle size={30} />
      </div>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem', color: 'var(--danger)' }}>{title}</h3>
      <p style={{ maxWidth: '420px', marginBottom: onRetry ? '1.25rem' : 0 }}>{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};

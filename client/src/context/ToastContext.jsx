import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type = 'info', message, title, duration = 4000 }) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast = { id, type, message, title };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const toast = {
    success: (message, title = 'Success') => addToast({ type: 'success', message, title }),
    error: (message, title = 'Error') => addToast({ type: 'error', message, title, duration: 6000 }),
    warning: (message, title = 'Warning') => addToast({ type: 'warning', message, title }),
    info: (message, title = 'Info') => addToast({ type: 'info', message, title }),
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={20} color="var(--success)" />;
      case 'error':
        return <XCircle size={20} color="var(--danger)" />;
      case 'warning':
        return <AlertTriangle size={20} color="var(--warning)" />;
      default:
        return <Info size={20} color="var(--info)" />;
    }
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <div style={{ flexShrink: 0, marginTop: '2px' }}>{getIcon(t.type)}</div>
            <div style={{ flex: 1 }}>
              {t.title && <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '2px' }}>{t.title}</div>}
              <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>{t.message}</div>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
              }}
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

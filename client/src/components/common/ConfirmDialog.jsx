import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button/Button';
import { AlertTriangle, Info } from 'lucide-react';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  loading = false,
  icon: Icon = AlertTriangle,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-md)',
            backgroundColor:
              confirmVariant === 'danger' ? 'var(--danger-light)' : 'var(--warning-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: confirmVariant === 'danger' ? 'var(--danger)' : 'var(--warning)',
            flexShrink: 0,
          }}
        >
          <Icon size={22} />
        </div>
        <div>
          <p style={{ color: 'var(--text-primary)', fontSize: '0.925rem', lineHeight: '1.5' }}>
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
};

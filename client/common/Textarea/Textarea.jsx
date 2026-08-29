import React from 'react';
import './Textarea.css';

export const Textarea = ({
  label,
  id,
  name,
  value,
  onChange,
  placeholder,
  rows = 4,
  error,
  hint,
  required = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const textareaId = id || name;

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={textareaId} className="form-label">
          {label} {required && <span className="required">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        required={required}
        className="form-textarea"
        {...props}
      />
      {error && <span className="form-error">{error}</span>}
      {hint && !error && <span className="form-hint">{hint}</span>}
    </div>
  );
};

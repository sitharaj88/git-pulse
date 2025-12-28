import React, { forwardRef } from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  inputSize?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  iconLeft,
  iconRight,
  inputSize = 'md',
  fullWidth = true,
  className = '',
  ...props
}, ref) => {
  const sizeClasses = {
    sm: 'input-size-sm',
    md: 'input-size-md',
    lg: 'input-size-lg',
  };

  const inputClasses = [
    'input',
    sizeClasses[inputSize],
    iconLeft ? 'input-icon-left' : '',
    iconRight ? 'input-icon-right' : '',
    error ? 'input-error' : '',
    fullWidth ? 'input-full-width' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className="input-container">
      {label && <label className="input-label">{label}</label>}
      <div className="input-wrapper">
        {iconLeft && <span className="input-icon input-icon-left-pos">{iconLeft}</span>}
        <input
          ref={ref}
          className={inputClasses}
          {...props}
        />
        {iconRight && <span className="input-icon input-icon-right-pos">{iconRight}</span>}
      </div>
      {error && <span className="input-error-text">{error}</span>}
      {helperText && !error && <span className="input-helper-text">{helperText}</span>}
      
      <style>{`
        .input-container { 
          display: flex; 
          flex-direction: column; 
          gap: var(--space-xs);
        }
        .input-label {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-secondary);
        }
        .input-size-sm { padding: 6px 10px; font-size: 0.8rem; }
        .input-size-md { padding: 10px 14px; font-size: 0.9rem; }
        .input-size-lg { padding: 14px 18px; font-size: 1rem; }
        .input-full-width { width: 100%; }
        .input-error { 
          border-color: var(--color-danger) !important; 
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
        }
        .input-error-text {
          font-size: 0.75rem;
          color: var(--color-danger);
        }
        .input-helper-text {
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }
      `}</style>
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  type = 'button',
  title,
}) => {
  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'btn',
    secondary: 'btn btn-secondary',
    danger: 'btn btn-danger',
    ghost: 'btn btn-ghost',
  };

  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'btn-size-sm',
    md: 'btn-size-md',
    lg: 'btn-size-lg',
  };

  const classes = [
    variantClasses[variant],
    sizeClasses[size],
    loading ? 'btn-loading' : '',
    fullWidth ? 'btn-full-width' : '',
    icon && !children ? 'btn-icon' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <>
      <button
        type={type}
        className={classes}
        onClick={onClick}
        disabled={disabled || loading}
        title={title}
      >
        {loading ? (
          <span className="btn-spinner" />
        ) : (
          <>
            {icon && iconPosition === 'left' && <span className="btn-icon-wrapper">{icon}</span>}
            {children && <span className="btn-text">{children}</span>}
            {icon && iconPosition === 'right' && <span className="btn-icon-wrapper">{icon}</span>}
          </>
        )}
      </button>
      <style>{`
        .btn-size-sm { padding: 6px 12px; font-size: 0.75rem; }
        .btn-size-md { padding: 8px 16px; font-size: 0.85rem; }
        .btn-size-lg { padding: 12px 24px; font-size: 1rem; }
        .btn-full-width { width: 100%; }
        .btn-icon-wrapper { display: flex; align-items: center; }
        .btn-text { }
        .btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
};

export default Button;

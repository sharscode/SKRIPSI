import './Button.css';

export default function Button({
  children, variant = 'primary', size = 'md',
  loading = false, disabled = false, icon = null,
  onClick, type = 'button', className = '', ...props
}) {
  return (
    <button
      type={type} onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn-${variant} btn-${size} ${loading ? 'btn-loading' : ''} ${className}`}
      {...props}
    >
      {loading && <span className="btn-spinner" aria-hidden="true" />}
      {!loading && icon && <span className="btn-icon">{icon}</span>}
      {children}
    </button>
  );
}

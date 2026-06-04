import './Input.css';

export default function Input({ label, error, icon, suffix, id, className = '', ...props }) {
  return (
    <div className={`input-wrapper ${className}`}>
      {label && <label htmlFor={id} className="input-label">{label}</label>}
      <div className={`input-field-wrap ${icon ? 'has-icon' : ''} ${suffix ? 'has-suffix' : ''}`}>
        {icon && <span className="input-icon">{icon}</span>}
        <input id={id} className={`input-field ${error ? 'input-error' : ''}`} {...props} />
        {suffix && <span className="input-suffix">{suffix}</span>}
      </div>
      {error && <p className="input-err-msg">{error}</p>}
    </div>
  );
}

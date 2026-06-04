import './Select.css';
export default function Select({ label, options = [], error, icon, id, placeholder, className = '', ...props }) {
  return (
    <div className={`select-wrapper ${className}`}>
      {label && <label htmlFor={id} className="select-label">{label}</label>}
      <div className={`select-field-wrap ${icon ? 'has-icon' : ''}`}>
        {icon && <span className="select-icon">{icon}</span>}
        <select id={id} className={`select-field ${error ? 'select-error' : ''}`} {...props}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
          ))}
        </select>
      </div>
      {error && <p className="select-err-msg">{error}</p>}
    </div>
  );
}

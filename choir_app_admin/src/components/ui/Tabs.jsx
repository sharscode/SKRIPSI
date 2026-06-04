import { useState } from 'react';
import './Tabs.css';
export default function Tabs({ tabs = [], children }) {
  const [active, setActive] = useState(0);
  return (
    <div className="tabs-root">
      <div className="tabs-bar" role="tablist">
        {tabs.map((t, i) => (
          <button key={i} role="tab" aria-selected={i === active} className={`tab-btn ${i === active ? 'tab-active' : ''}`}
            onClick={() => setActive(i)}>
            {t.icon && <span className="tab-icon">{t.icon}</span>}{t.label}
            {t.badge !== undefined && <span className="tab-badge">{t.badge}</span>}
          </button>
        ))}
      </div>
      <div className="tab-content">{Array.isArray(children) ? children[active] : children}</div>
    </div>
  );
}

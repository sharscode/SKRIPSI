import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import pcuLogo from '../assets/pcu_choir_logo.png';
import './Sidebar.css';

const navItems = [
  { to: '/dashboard',  icon: '📊', label: 'Dashboard' },
  { to: '/anggota',    icon: '👥', label: 'Anggota' },
  { to: '/anggota-ukm',icon: '🎖', label: 'Keanggotaan UKM' },
  { to: '/acara',      icon: '🎵', label: 'Acara' },
  { to: '/latihan',    icon: '📅', label: 'Latihan' },
  { to: '/partitur',   icon: '🎼', label: 'Partitur' },
  { to: '/skkk',       icon: '📋', label: 'SKKK' },
  { to: '/rekap',      icon: '📊', label: 'Rekap Kegiatan' },
  { to: '/admin',      icon: '🔐', label: 'Kelola Admin', superAdminOnly: true },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <img src={pcuLogo} alt="PCU Choir" className="sidebar-logo-img" />
        {!collapsed && (
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-title">PCU Choir</span>
            <span className="sidebar-logo-sub">Admin Panel</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" role="navigation" aria-label="Main navigation">
        {navItems
          .filter(item => !item.superAdminOnly || user?.role === 'super_admin')
          .map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-label">{item.label}</span>}
            </NavLink>
          ))
        }
      </nav>

      {/* User info */}
      <div className="sidebar-user">
        <div className="sidebar-avatar">
          {user?.nama?.[0]?.toUpperCase() || 'A'}
        </div>
        {!collapsed && (
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{user?.nama || 'Admin'}</p>
            <p className="sidebar-user-role">
              {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </p>
          </div>
        )}
        {!collapsed && (
          <button
            className="sidebar-logout"
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        className="sidebar-toggle"
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? '›' : '‹'}
      </button>
    </aside>
  );
}

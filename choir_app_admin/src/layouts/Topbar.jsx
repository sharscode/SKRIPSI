import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Topbar.css';

const breadcrumbMap = {
  '/dashboard':   'Dashboard',
  '/anggota':     'Anggota',
  '/anggota-ukm': 'Keanggotaan UKM',
  '/acara':       'Acara',
  '/latihan':     'Latihan',
  '/partitur':    'Partitur',
  '/skkk':        'Laporan SKKK',
  '/admin':       'Kelola Admin',
};

const pageIcons = {
  '/dashboard': '📊', '/anggota': '👥', '/anggota-ukm': '🎖',
  '/acara': '🎵', '/latihan': '📅', '/partitur': '🎼',
  '/skkk': '📋', '/admin': '🔐',
};

export default function Topbar({ sidebarCollapsed, onMenuClick }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const base = '/' + pathname.split('/')[1];
  const title = breadcrumbMap[base] || 'PCU Choir';
  const icon  = pageIcons[base] || '🎵';

  return (
    <header
      className={`topbar ${sidebarCollapsed ? 'topbar-collapsed' : ''}`}
    >
      <div className="topbar-left">
        <button className="topbar-menu-btn" onClick={onMenuClick} aria-label="Toggle menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="17" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
        <h1 className="topbar-page-title">{title}</h1>
      </div>

      <div className="topbar-right">
        <div className="topbar-badge">
          🎶 PCU Choir
        </div>
        <div className="topbar-user">
          <div className="topbar-avatar">
            {user?.nama?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="topbar-user-text">
            <span className="topbar-user-name">{user?.nama || 'Admin'}</span>
            <span className="topbar-user-role">
              {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

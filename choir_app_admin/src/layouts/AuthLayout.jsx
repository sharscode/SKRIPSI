import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './AuthLayout.css';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="auth-layout">
        <div className="auth-layout__container" style={{ justifyContent: 'center' }}>
          <div className="animate-pulse text-center">
            <p>Memuat...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="auth-layout">
      <div className="auth-layout__container">
        <div className="auth-layout__brand">
          <div className="auth-layout__logo">
            <span className="auth-layout__logo-icon material-symbols-outlined">music_note</span>
          </div>
          <h1 className="auth-layout__title">PCU Choir</h1>
          <p className="auth-layout__subtitle">
            Sistem Administrasi UKM Paduan Suara Petra Christian University
          </p>
        </div>
        <div className="auth-layout__form-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

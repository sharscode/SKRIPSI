import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import pcuLogo from '../assets/pcu_choir_logo.png';
import '../layouts/AuthLayout.css';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal. Periksa email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* ── Left Branding Panel ── */}
      <div className="auth-left">
        <div className="auth-logo-wrap">
          <img src={pcuLogo} alt="PCU Choir Logo" className="auth-logo" />
          <div>
            <div className="auth-brand-name">PCU Choir</div>
            <div className="auth-brand-sub">Management System</div>
          </div>
        </div>

        <div className="auth-features">
          {[
            { icon: '👥', title: 'Kelola Anggota', desc: 'Data anggota dan bagian suara' },
            { icon: '🎵', title: 'Manajemen Acara', desc: 'Pendaftaran dan persetujuan' },
            { icon: '📋', title: 'Absensi & SKKK', desc: 'QR Code & laporan otomatis' },
            { icon: '🎼', title: 'Koleksi Partitur', desc: 'Upload dan kelola partitur' },
          ].map((f) => (
            <div key={f.title} className="auth-feature">
              <span className="auth-feature-icon">{f.icon}</span>
              <div className="auth-feature-text">
                <strong>{f.title}</strong>
                <span>{f.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <h2>Selamat datang 👋</h2>
            <p>Masuk ke panel admin PCU Choir</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form" id="login-form">
            {error && (
              <div className="auth-error" role="alert">
                <span>⚠️</span> {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '.8125rem', fontWeight: 600, color: 'var(--c-neutral-600)' }}>
                Email
              </label>
              <div className="auth-input-group">
                <span className="auth-input-icon">✉️</span>
                <input
                  id="login-email"
                  type="email"
                  className="auth-input"
                  placeholder="admin@pcu.ac.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '.8125rem', fontWeight: 600, color: 'var(--c-neutral-600)' }}>
                Password
              </label>
              <div className="auth-input-group">
                <span className="auth-input-icon">🔒</span>
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? 'Sembunyikan password' : 'Tampilkan password'}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '.9rem', color: 'var(--c-neutral-400)',
                  }}
                >
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="auth-btn"
              id="login-submit"
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />
                  Memproses...
                </span>
              ) : 'Masuk ke Dashboard →'}
            </button>
          </form>

          <p className="auth-footer">
            <strong>Universitas Kristen Petra</strong> © 2025
          </p>
        </div>
      </div>
    </div>
  );
}

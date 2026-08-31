import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/ui/Badge';
import { formatDate } from '../utils/formatDate';
import { useToast } from '../components/ui/Toast';
import './DashboardPage.css';

function StatCard({ icon, label, value, color, loading, delay = 0 }) {
  const colors = {
    primary: { accent: '#6B91B8', bg: '#EEF3F8', glow: 'rgba(107,145,184,.25)' },
    success: { accent: '#10B981', bg: '#D1FAE5', glow: 'rgba(16,185,129,.2)' },
    warning: { accent: '#F59E0B', bg: '#FEF3C7', glow: 'rgba(245,158,11,.2)' },
    info:    { accent: '#3B82F6', bg: '#DBEAFE', glow: 'rgba(59,130,246,.2)' },
  };
  const c = colors[color] || colors.primary;

  return (
    <div
      className="stat-card"
      style={{ '--stat-color': c.accent, '--stat-bg': c.bg, animationDelay: `${delay}s` }}
    >
      <div className="stat-card-icon">{icon}</div>
      {loading ? (
        <div style={{ height: 36, borderRadius: 8 }} className="shimmer" />
      ) : (
        <div className="stat-card-value">{value}</div>
      )}
      <div className="stat-card-label">{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [stats, setStats]       = useState(null);
  const [events, setEvents]     = useState([]);
  const [latihan, setLatihan]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [periode, setPeriode]   = useState('2025/2026');
  const [periods, setPeriods]   = useState([]);

  // Raw datasets for dynamic filtering
  const [rawEvents, setRawEvents]     = useState([]);
  const [rawLatihan, setRawLatihan]   = useState([]);
  const [rawMembers, setRawMembers]   = useState([]);
  const [totalAnggota, setTotalAnggota] = useState(0);
  // Acara yang sudah selesai tapi evaluasinya belum ditulis.
  const [belumEval, setBelumEval] = useState([]);
  // Acara selesai yang SKKK-nya belum diajukan ke BAKA.
  const [belumSkkk, setBelumSkkk] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/anggota?limit=1'),
      api.get('/acara'),
      api.get('/latihan'),
      api.get('/anggota-ukm?status_keaktifan=aktif'),
      api.get('/settings/active-periode'),
      api.get('/settings/periodes'),
      api.get('/acara-evaluasi/belum-dievaluasi'),
      api.get('/skkk/belum-diajukan'),
    ]).then(([a, ac, l, aukm, s, p, be, bs]) => {
      setBelumEval(be.data.data || []);
      setBelumSkkk(bs.data.data?.acara || []);
      const activePeriode = s.data.data?.periode || '2025/2026';
      const totAnggota = a.data.data.pagination?.total ?? a.data.data.length;
      
      setTotalAnggota(totAnggota);
      setRawEvents(ac.data.data || []);
      setRawLatihan(l.data.data || []);
      setRawMembers(aukm.data.data || []);
      setPeriode(activePeriode);
      setPeriods(p.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Compute statistics whenever selected period or datasets change
  useEffect(() => {
    if (loading) return;

    // Helper to check if a date falls within a YYYY/YYYY academic period (August 1st to July 31st)
    const isDateInPeriod = (dateStr, periodStr) => {
      if (!dateStr || !periodStr) return false;
      const [startYear, endYear] = periodStr.split('/').map(Number);
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // 1-12
      return month >= 8 ? year === startYear : year === endYear;
    };

    const activeEvents = rawEvents.filter(e => e.status === 'aktif' && isDateInPeriod(e.tanggal, periode));
    const activeMembersCount = rawMembers.filter(m => m.periode === periode).length;
    const periodLatihan = rawLatihan.filter(lt => isDateInPeriod(lt.tanggal, periode));

    setStats({
      totalAnggota,
      anggotaAktif: activeMembersCount,
      acaraAktif:   activeEvents.length,
      totalLatihan: periodLatihan.length,
    });

    setEvents(activeEvents.slice(0, 5));

    const upcoming = periodLatihan
      .filter((lt) => new Date(lt.tanggal) >= new Date())
      .slice(0, 5);
      
    setLatihan(upcoming);
  }, [periode, rawEvents, rawLatihan, rawMembers, totalAnggota, loading]);

  /**
   * Ganti periode yang ditampilkan di dashboard.
   *
   * Sengaja hanya mengubah tampilan, tidak lagi menulis settings.active_periode.
   * Setting itu dipakai lima modul sebagai kebenaran sistem — siapa anggota
   * aktif, siapa penerima notifikasi — dan sekarang diturunkan otomatis dari
   * tanggal. Melihat data tahun lalu tidak boleh sampai mengubahnya.
   */
  const handleUpdateActivePeriod = (newPeriod) => {
    setPeriode(newPeriod);
  };

  /**
   * Salin anggota aktif dari periode sebelumnya ke periode berjalan.
   * Sengaja dipicu admin, bukan otomatis: keanggotaan tahun baru adalah
   * keputusan pengurus, dan menyalinnya diam-diam berisiko mempertahankan
   * anggota yang sudah lulus.
   */
  const salinPeriode = async () => {
    setMenyalin(true);
    try {
      const res = await api.post('/anggota-ukm/salin-periode');
      toast(res.data.message, 'success');
      window.location.reload();
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal menyalin anggota.', 'error');
    } finally { setMenyalin(false); }
  };

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Selamat Pagi' : hour < 17 ? 'Selamat Siang' : 'Selamat Malam';
  const today    = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="dashboard">
      {/* Hero Header */}
      <div className="dashboard-hero">
        <div style={{ zIndex: 1 }}>
          <h2 className="dash-greeting">{greeting}, {user?.nama?.split(' ')[0] || 'Admin'}! 👋</h2>
          <p className="dash-date">{today}</p>
        </div>
        <div className="dash-hero-badge" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="dash-hero-badge-label">Periode Berjalan</div>
          <select 
            value={periode} 
            onChange={(e) => handleUpdateActivePeriod(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none',
              textAlign: 'center',
              padding: '4px 10px',
              borderRadius: '8px',
              marginTop: '4px',
              fontFamily: 'inherit'
            }}
          >
            {periods.length === 0 ? (
              <option value={periode} style={{ color: '#334155', backgroundColor: '#fff' }}>{periode}</option>
            ) : (
              periods.map(p => (
                <option key={p} value={p} style={{ color: '#334155', backgroundColor: '#fff' }}>
                  {p}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Periode akademik baru dimulai tapi belum ada anggota terdaftar.
          Keanggotaan dicatat per periode, jadi ini normal terjadi tiap Agustus —
          tapi harus terlihat, karena selama kosong tidak ada yang menerima
          notifikasi dan absensi latihan rutin ikut kosong. */}
      {!loading && stats?.anggotaAktif === 0 && totalAnggota > 0 && (
        <div className="dash-periode-baru">
          <div>
            <p className="dash-periode-title">Periode {periode} belum punya anggota terdaftar</p>
            <p className="dash-periode-sub">
              Tahun akademik sudah berganti. Selama daftar ini kosong, notifikasi
              tidak terkirim dan absensi latihan rutin ikut kosong.
            </p>
          </div>
          <button type="button" onClick={salinPeriode} disabled={menyalin}>
            {menyalin ? 'Menyalin…' : 'Salin dari periode sebelumnya'}
          </button>
        </div>
      )}

      {/* Perlu Tindakan — pengingat digabung agar tidak mendorong statistik ke bawah */}
      {!loading && (belumEval.length > 0 || belumSkkk.length > 0) && (
        <div className="dash-todo">
          <p className="dash-todo-title">Perlu Tindakan</p>
          <ul className="dash-todo-list">
            {belumEval.map((e) => (
              <li key={'ev' + e.id}>
                <button type="button" onClick={() => navigate('/acara/' + e.id)}>
                  <span className="dash-todo-tag tag-eval">Evaluasi</span>
                  <span className="dash-todo-name">{e.nama_acara}</span>
                  <span className="dash-todo-meta">belum dievaluasi</span>
                </button>
              </li>
            ))}
            {belumSkkk.map((e) => (
              <li key={'sk' + e.id}>
                <button type="button" onClick={() => navigate('/skkk')}>
                  <span className="dash-todo-tag tag-skkk">SKKK</span>
                  <span className="dash-todo-name">{e.nama_acara}</span>
                  <span className="dash-todo-meta">{e.jumlah_memenuhi} memenuhi syarat</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}


      {/* Stat Cards */}
      <div className="dash-stats">
        <StatCard icon="👥" label="Total Anggota"  value={stats?.totalAnggota ?? '—'} color="primary" loading={loading} delay={0}    />
        <StatCard icon="⭐" label="Anggota Aktif"  value={stats?.anggotaAktif ?? '—'} color="info"    loading={loading} delay={0.05} />
        <StatCard icon="🎵" label="Acara Aktif"    value={stats?.acaraAktif ?? '—'}   color="success" loading={loading} delay={0.1}  />
        <StatCard icon="📅" label="Total Latihan"  value={stats?.totalLatihan ?? '—'} color="warning" loading={loading} delay={0.15} />
        <StatCard icon="🎓" label="Tahun Akademik" value={periode}                    color="info"    loading={loading} delay={0.2}  />
      </div>

      {/* Content Grid */}
      <div className="dash-grid">
        {/* Active Events */}
        <div className="dash-section">
          <div className="dash-section-header">
            <h3 className="dash-section-title">🎵 Acara Aktif</h3>
            {!loading && <span className="dash-section-count">{events.length} acara</span>}
          </div>
          <div className="dash-section-body">
            {loading ? (
              <> <div className="dash-skeleton"/> <div className="dash-skeleton"/> <div className="dash-skeleton"/> </>
            ) : events.length === 0 ? (
              <div className="dash-empty">
                <div className="dash-empty-icon">🎵</div>
                <div className="dash-empty-text">Belum ada acara aktif</div>
              </div>
            ) : (
              <ul>
                {events.map((e) => (
                  <li key={e.id} className="dash-event-item">
                    <div className="dash-event-dot" />
                    <div className="dash-event-info">
                      <p className="dash-event-name">{e.nama_acara}</p>
                      <p className="dash-event-meta">{formatDate(e.tanggal)} · {e.lokasi}</p>
                    </div>
                    <Badge status={e.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Upcoming Latihan */}
        <div className="dash-section">
          <div className="dash-section-header">
            <h3 className="dash-section-title">📅 Latihan Mendatang</h3>
            {!loading && <span className="dash-section-count">{latihan.length} sesi</span>}
          </div>
          <div className="dash-section-body">
            {loading ? (
              <> <div className="dash-skeleton"/> <div className="dash-skeleton"/> <div className="dash-skeleton"/> </>
            ) : latihan.length === 0 ? (
              <div className="dash-empty">
                <div className="dash-empty-icon">📅</div>
                <div className="dash-empty-text">Tidak ada jadwal mendatang</div>
              </div>
            ) : (
              <ul>
                {latihan.map((l) => (
                  <li key={l.id} className="dash-latihan-item">
                    <div className="dash-latihan-date">
                      <p className="date-day">{new Date(l.tanggal).getDate()}</p>
                      <p className="date-month">{new Date(l.tanggal).toLocaleDateString('id-ID', { month: 'short' })}</p>
                    </div>
                    <div className="dash-latihan-info">
                      <p className="dash-latihan-time">{l.jam} WIB</p>
                      <p className="dash-latihan-loc">{l.lokasi}</p>
                      {l.nama_acara && <p className="dash-latihan-event">🎵 {l.nama_acara}</p>}
                    </div>
                    <Badge
                      status={l.tipe_latihan}
                      variant={l.tipe_latihan === 'rutin' ? 'info' : 'primary'}
                      label={l.tipe_latihan === 'rutin' ? 'Rutin' : 'Acara'}
                      size="sm"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../config/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { formatDate } from '../../utils/formatDate';
import { STATUS_ABSENSI } from '../../utils/constants';
import './AbsensiPage.css';

export default function AbsensiPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [latihan, setLatihan]   = useState(null);
  const [absensi, setAbsensi]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [qrData, setQrData]     = useState(null);
  const [qrLoading, setQrLoad]  = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [sessionTime, setSessionTime] = useState(600); // 10 minutes in seconds
  const [rotationTime, setRotationTime] = useState(5); // 5 seconds token rotation
  
  const timerRef = useRef(null);
  const pollTimerRef = useRef(null);

  const fetchData = (silent = false) => {
    if (!silent) setLoading(true);
    Promise.all([
      api.get(`/latihan/${id}`),
      api.get(`/absensi/latihan/${id}`),
    ]).then(([l, a]) => {
      setLatihan(l.data.data);
      setAbsensi(a.data.data);
    }).catch(() => {
      if (!silent) toast('Gagal memuat data absensi.', 'error');
    }).finally(() => {
      if (!silent) setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [id]);

  const fetchNextQr = async () => {
    setQrLoad(true);
    try {
      const res = await api.post(`/latihan/${id}/generate-qr`);
      setQrData(res.data.data);
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal memperbarui QR code.', 'error');
    } finally {
      setQrLoad(false);
    }
  };

  const stopQrSession = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setShowQrModal(false);
    setQrData(null);
  };

  const startQrSession = async () => {
    setSessionTime(600);
    setRotationTime(5);
    setShowQrModal(true);
    setQrLoad(true);

    try {
      const res = await api.post(`/latihan/${id}/generate-qr`);
      setQrData(res.data.data);
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal generate QR.', 'error');
      setShowQrModal(false);
      setQrLoad(false);
      return;
    } finally {
      setQrLoad(false);
    }

    if (timerRef.current) clearInterval(timerRef.current);
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    pollTimerRef.current = setInterval(() => {
      fetchData(true); // Silent fetch in background
    }, 5000);

    timerRef.current = setInterval(() => {
      setSessionTime((prevSession) => {
        if (prevSession <= 1) {
          stopQrSession();
          toast('Sesi QR Code telah selesai (10 menit).', 'info');
          fetchData(true);
          return 0;
        }
        return prevSession - 1;
      });

      setRotationTime((prevRotation) => {
        if (prevRotation <= 1) {
          fetchNextQr();
          return 5;
        }
        return prevRotation - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const updateStatus = async (anggota_id, status) => {
    try {
      await api.put('/absensi/status', { latihan_id: +id, anggota_id, status });
      toast(`Status absensi diperbarui ke "${status}".`);
      fetchData(true);
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal update status.', 'error');
    }
  };

  if (loading) {
    return <div className="page anim-slide-up"><div className="dash-skeleton" style={{ height: 200, borderRadius: 12 }} /></div>;
  }

  if (!latihan) return <div className="page"><p>Latihan tidak ditemukan.</p></div>;

  const stats = {
    hadir: absensi.filter((a) => a.status === 'hadir').length,
    izin: absensi.filter((a) => a.status === 'izin').length,
    sakit: absensi.filter((a) => a.status === 'sakit').length,
    alpha: absensi.filter((a) => a.status === 'alpha').length,
  };

  return (
    <div className="page anim-slide-up">
      <div className="page-header">
        <div>
          <h2 className="page-title">Absensi Latihan</h2>
          <p className="page-subtitle">
            {formatDate(latihan.tanggal)} · {latihan.jam} WIB · {latihan.lokasi}
            {latihan.nama_acara && <> · <strong>{latihan.nama_acara}</strong></>}
          </p>
        </div>
        <div className="row-actions">
          <Button variant="secondary" onClick={() => navigate(-1)}>← Kembali</Button>
          <Button variant="primary" onClick={startQrSession} loading={qrLoading} id="btn-generate-qr">
            📱 Generate QR Code
          </Button>
        </div>
      </div>

      {/* QR Code Modal Display */}
      <Modal
        open={showQrModal}
        onClose={stopQrSession}
        title="Scan QR Code Absensi"
        size="md"
      >
        <div className="qr-modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '10px 0' }}>
          {qrLoading && !qrData ? (
            <div className="qr-loading-spinner" style={{ width: 380, height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="spinner" style={{ width: '50px', height: '50px', border: '4px solid rgba(107, 145, 184, 0.2)', borderTopColor: 'var(--c-primary-500)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
            </div>
          ) : qrData ? (
            <div className="qr-image-container" style={{ position: 'relative', background: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 12px 40px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.05)', marginBottom: '24px' }}>
              <img 
                src={qrData.qr_image} 
                alt="QR Code" 
                style={{ width: 360, height: 360, display: 'block', transition: 'opacity 0.3s ease', opacity: qrLoading ? 0.6 : 1 }} 
              />
              {qrLoading && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.7)', borderRadius: '20px' }}>
                  <span className="spinner" style={{ width: '40px', height: '40px', border: '4px solid rgba(107, 145, 184, 0.2)', borderTopColor: 'var(--c-primary-500)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-danger" style={{ margin: '100px 0' }}>Gagal memuat QR Code.</p>
          )}

          <div className="qr-meta" style={{ width: '100%' }}>
            <p style={{ margin: '0 0 20px', fontSize: 'var(--text-sm)', color: 'var(--c-neutral-500)', lineHeight: '1.6' }}>
              Arahkan kamera HP anggota ke QR code ini.<br />Kode akan otomatis berubah secara berkala.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.08)', color: 'var(--c-danger)', padding: '12px 20px', borderRadius: '14px', fontWeight: 'bold', fontSize: 'var(--text-base)', maxWidth: '320px', margin: '0 auto' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'pulse 1.5s infinite' }}>
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>Sesi QR Berakhir: {formatTime(sessionTime)}</span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Attendance Stats */}
      <div className="absensi-stats">
        <div className="abs-stat abs-stat-hadir"><span className="abs-stat-count">{stats.hadir}</span><span className="abs-stat-label">Hadir</span></div>
        <div className="abs-stat abs-stat-izin"><span className="abs-stat-count">{stats.izin}</span><span className="abs-stat-label">Izin</span></div>
        <div className="abs-stat abs-stat-sakit"><span className="abs-stat-count">{stats.sakit}</span><span className="abs-stat-label">Sakit</span></div>
        <div className="abs-stat abs-stat-alpha"><span className="abs-stat-count">{stats.alpha}</span><span className="abs-stat-label">Alpha</span></div>
        <div className="abs-stat abs-stat-total"><span className="abs-stat-count">{absensi.length}</span><span className="abs-stat-label">Total</span></div>
      </div>

      {/* Attendance Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>NRP</th>
              <th>Nama</th>
              <th>Suara</th>
              <th>Status</th>
              <th>Waktu Checkin</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {absensi.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-muted" style={{ padding: 'var(--sp-8) 0' }}>
                  Belum ada data absensi. Generate QR atau tambahkan manual.
                </td>
              </tr>
            ) : (
              absensi.map((row) => (
                <tr key={row.id}>
                  <td>{row.nrp}</td>
                  <td><strong>{row.nama_lengkap}</strong></td>
                  <td><Badge status={row.bagian_suara} /></td>
                  <td><Badge status={row.status} /></td>
                  <td>
                    {row.waktu_checkin
                      ? new Date(row.waktu_checkin).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </td>
                  <td>
                    <Select
                      id={`abs-${row.id}`}
                      value={row.status}
                      options={STATUS_ABSENSI.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
                      onChange={(e) => updateStatus(row.anggota_id, e.target.value)}
                      className="abs-select"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

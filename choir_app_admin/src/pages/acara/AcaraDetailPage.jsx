import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../config/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import Tabs from '../../components/ui/Tabs';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { formatDate, formatDateTime } from '../../utils/formatDate';
import { APPROVAL_STATUS, STATUS_PESERTA, API_URL } from '../../utils/constants';
import './AcaraDetailPage.css';

export default function AcaraDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [acara, setAcara]       = useState(null);
  const [peserta, setPeserta]   = useState([]);
  const [latihan, setLatihan]   = useState([]);
  const [partitur, setPartitur] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [statusModal, setStatusModal] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [searchPeserta, setSearchPeserta] = useState('');

  // Modals for adding peserta & partitur
  const [showPesertaModal, setShowPesertaModal] = useState(false);
  const [showPartiturModal, setShowPartiturModal] = useState(false);
  const [anggotaList, setAnggotaList] = useState([]);
  const [allPartiturList, setAllPartiturList] = useState([]);
  const [selectedAnggota, setSelectedAnggota] = useState('');
  const [selectedPartitur, setSelectedPartitur] = useState('');
  const [pesertaSubmitting, setPesertaSubmitting] = useState(false);
  const [partiturSubmitting, setPartiturSubmitting] = useState(false);

  // Approval and documentation states
  const [showApprovalListModal, setShowApprovalListModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [alasanReject, setAlasanReject] = useState('');
  const [newStatusPeserta, setNewStatusPeserta] = useState('');
  const [alasanPerubahan, setAlasanPerubahan] = useState('');
  const [showRejected, setShowRejected] = useState(false);

  const [dokumentasi, setDokumentasi] = useState([]);
  const [showDokumentasiModal, setShowDokumentasiModal] = useState(false);
  const [docFiles, setDocFiles] = useState([]);
  const [docKeterangan, setDocKeterangan] = useState('');
  const [docSubmitting, setDocSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // ── Evaluasi kegiatan (hanya untuk acara berstatus 'selesai') ──
  const [evaluasi, setEvaluasi] = useState(null);
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [evalForm, setEvalForm] = useState({ skor: '', catatan: '', kendala: '', saran: '', is_publik: false });
  const [evalSubmitting, setEvalSubmitting] = useState(false);

  const openEvalModal = () => {
    setEvalForm({
      skor: evaluasi?.skor ?? '',
      catatan: evaluasi?.catatan ?? '',
      kendala: evaluasi?.kendala ?? '',
      saran: evaluasi?.saran ?? '',
      is_publik: !!evaluasi?.is_publik,
    });
    setShowEvalModal(true);
  };

  const submitEvaluasi = async () => {
    if (!evalForm.catatan.trim()) {
      toast('Catatan evaluasi wajib diisi.', 'error');
      return;
    }
    setEvalSubmitting(true);
    try {
      await api.put(`/acara-evaluasi/${id}`, {
        skor: evalForm.skor === '' ? null : Number(evalForm.skor),
        catatan: evalForm.catatan.trim(),
        kendala: evalForm.kendala.trim() || null,
        saran: evalForm.saran.trim() || null,
        is_publik: evalForm.is_publik,
      });
      toast('Evaluasi tersimpan.');
      setShowEvalModal(false);
      fetchAll();
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal menyimpan evaluasi.', 'error');
    } finally {
      setEvalSubmitting(false);
    }
  };

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.get(`/acara/${id}`),
      api.get(`/peserta-acara/acara/${id}`),
      api.get(`/latihan?acara_id=${id}`),
      api.get(`/partitur/acara/${id}`),
      api.get(`/dokumentasi/acara/${id}`),
      api.get(`/acara-evaluasi/${id}`),
    ]).then(([a, p, l, pt, d, ev]) => {
      setAcara(a.data.data);
      setPeserta(p.data.data);
      setLatihan(l.data.data);
      setPartitur(pt.data.data);
      setDokumentasi(d.data.data || []);
      setEvaluasi(ev.data.data || null);
    }).catch(() => toast('Gagal memuat detail acara.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, [id]);

  const updateAcaraStatus = async (status) => {
    try {
      await api.patch(`/acara/${id}/status`, { status });
      toast(`Status acara diubah ke "${status}".`);
      fetchAll();
    } catch (err) { toast(err.response?.data?.message || 'Gagal mengubah status.', 'error'); }
  };

  const updateApproval = async () => {
    try {
      if (statusModal.approval_status === 'menunggu') {
        await api.put(`/peserta-acara/${statusModal.id}/approval`, {
          approval_status: newStatus,
          alasan_reject: newStatus === 'ditolak' ? alasanReject : null
        });
      } else if (statusModal.approval_status === 'disetujui') {
        await api.put(`/peserta-acara/${statusModal.id}/status`, {
          status_peserta: newStatusPeserta,
          alasan_perubahan: newStatusPeserta === 'batal' ? alasanPerubahan : null
        });
      }
      toast('Status peserta berhasil diperbarui.');
      setStatusModal(null);
      fetchAll();
    } catch (err) { toast(err.response?.data?.message || 'Gagal update status.', 'error'); }
  };

  const openAddPeserta = async () => {
    try {
      // 1. Fetch active period
      const periodRes = await api.get('/settings/active-periode');
      const activePeriod = periodRes.data.data?.periode || '';

      // 2. Fetch active members for that period
      const res = await api.get('/anggota-ukm', {
        params: {
          periode: activePeriod,
          status_keaktifan: 'aktif'
        }
      });

      const registeredIds = peserta.map((p) => p.anggota_id);
      
      // 3. Map members to standard format, filtering out registered ones and preventing duplicates
      const uniqueAvailable = [];
      const seen = new Set(registeredIds);
      for (const a of (res.data.data || [])) {
        if (a.anggota_id && !seen.has(a.anggota_id)) {
          seen.add(a.anggota_id);
          uniqueAvailable.push({
            id: a.anggota_id,
            nrp: a.nrp,
            nama_lengkap: a.nama_lengkap,
            bagian_suara: a.bagian_suara
          });
        }
      }

      setAnggotaList(uniqueAvailable);
    } catch {
      toast('Gagal memuat daftar anggota.', 'error');
    }
    setSelectedAnggota('');
    setShowPesertaModal(true);
  };

  const handleAddPeserta = async (e) => {
    e.preventDefault();
    if (!selectedAnggota) {
      toast('Pilih anggota terlebih dahulu.', 'error');
      return;
    }
    setPesertaSubmitting(true);
    try {
      await api.post('/peserta-acara/manual', { anggota_id: +selectedAnggota, acara_id: +id });
      toast('Peserta berhasil ditambahkan.');
      setShowPesertaModal(false);
      fetchAll();
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal menambahkan peserta.', 'error');
    } finally {
      setPesertaSubmitting(false);
    }
  };

  const removePeserta = async (pesertaId) => {
    if (!window.confirm('Yakin ingin mengeluarkan peserta ini dari acara?')) return;
    try {
      await api.delete(`/peserta-acara/${pesertaId}`);
      toast('Peserta berhasil dikeluarkan.');
      fetchAll();
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal mengeluarkan peserta.', 'error');
    }
  };

  const openLinkPartitur = async () => {
    try {
      const res = await api.get('/partitur?limit=100');
      const linkedIds = partitur.map((p) => p.id);
      const available = (res.data.data || []).filter((p) => !linkedIds.includes(p.id));
      setAllPartiturList(available);
    } catch {
      toast('Gagal memuat daftar partitur.', 'error');
    }
    setSelectedPartitur('');
    setShowPartiturModal(true);
  };

  const handleLinkPartitur = async (e) => {
    e.preventDefault();
    if (!selectedPartitur) {
      toast('Pilih partitur terlebih dahulu.', 'error');
      return;
    }
    setPartiturSubmitting(true);
    try {
      await api.post('/partitur/link-acara', { acara_id: +id, partitur_id: +selectedPartitur });
      toast('Partitur berhasil dihubungkan.');
      setShowPartiturModal(false);
      fetchAll();
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal menghubungkan partitur.', 'error');
    } finally {
      setPartiturSubmitting(false);
    }
  };

  const unlinkPartitur = async (partiturId) => {
    if (!window.confirm('Yakin ingin memutuskan hubungan partitur ini dari acara?')) return;
    try {
      await api.delete('/partitur/unlink-acara', { data: { acara_id: +id, partitur_id: +partiturId } });
      toast('Partitur berhasil dilepas.');
      fetchAll();
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal melepas partitur.', 'error');
    }
  };

  const handleDirectApprove = async (pesertaId) => {
    try {
      await api.put(`/peserta-acara/${pesertaId}/approval`, { approval_status: 'disetujui' });
      toast('Peserta berhasil disetujui.');
      fetchAll();
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal menyetujui peserta.', 'error');
    }
  };

  const openRejectPrompt = (p) => {
    setRejectModal(p);
    setAlasanReject('');
  };

  const handleRejectSubmit = async () => {
    if (!alasanReject.trim()) {
      toast('Alasan penolakan wajib diisi.', 'error');
      return;
    }
    try {
      await api.put(`/peserta-acara/${rejectModal.id}/approval`, {
        approval_status: 'ditolak',
        alasan_reject: alasanReject
      });
      toast('Pendaftaran ditolak.');
      setRejectModal(null);
      fetchAll();
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal menolak pendaftaran.', 'error');
    }
  };

  const handleUploadDokumentasi = async (e) => {
    e.preventDefault();
    if (!docFiles || docFiles.length === 0) {
      toast('Pilih minimal satu file foto.', 'error');
      return;
    }
    setDocSubmitting(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < docFiles.length; i++) {
        formData.append('files', docFiles[i]);
      }
      if (docKeterangan) {
        formData.append('keterangan', docKeterangan);
      }
      await api.post(`/dokumentasi/acara/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast('Dokumentasi berhasil diunggah.');
      setShowDokumentasiModal(false);
      setDocFiles([]);
      setDocKeterangan('');
      fetchAll();
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal mengunggah dokumentasi.', 'error');
    } finally {
      setDocSubmitting(false);
    }
  };

  const deleteDokumentasi = async (docId) => {
    if (!window.confirm('Yakin ingin menghapus dokumentasi ini?')) return;
    try {
      await api.delete(`/dokumentasi/${docId}`);
      toast('Dokumentasi berhasil dihapus.');
      fetchAll();
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal menghapus dokumentasi.', 'error');
    }
  };

  const downloadImage = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'dokumentasi.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      toast('Gagal mengunduh gambar.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="page anim-slide-up">
        <div className="detail-skeleton-header"><div className="dash-skeleton" style={{ width: 300, height: 28 }} /><div className="dash-skeleton" style={{ width: 200, height: 16, marginTop: 8 }} /></div>
        <div className="dash-skeleton" style={{ height: 200, borderRadius: 12, marginTop: 24 }} />
      </div>
    );
  }

  if (!acara) return <div className="page"><p>Acara tidak ditemukan.</p></div>;

  const pendingPeserta = peserta.filter((p) => p.approval_status === 'menunggu');

  const displayedPeserta = peserta.filter((p) => {
    if (showRejected && p.approval_status === 'ditolak') return true;
    return p.status_peserta === 'ikut' && p.approval_status === 'disetujui';
  });

  const filteredPeserta = displayedPeserta.filter((p) =>
    p.nama_lengkap.toLowerCase().includes(searchPeserta.toLowerCase()) ||
    p.nrp.toLowerCase().includes(searchPeserta.toLowerCase())
  );

  const pesertaColumns = [
    { key: 'nrp', label: 'NRP', width: 100 },
    { key: 'nama_lengkap', label: 'Nama' },
    { key: 'bagian_suara', label: 'Suara', render: (v) => <Badge status={v} /> },
    { key: 'approval_status', label: 'Approval', render: (v) => <Badge status={v} /> },
    { key: 'alasan_reject', label: 'Alasan Ditolak', render: (v) => v || '-' },
    { key: 'status_peserta', label: 'Status', render: (v) => <Badge status={v} /> },
    { key: 'alasan_perubahan', label: 'Alasan Batal', render: (v) => v || '-' },
    {
      key: 'actions', label: 'Aksi', width: 140,
      render: (_, row) => (
        <div className="row-actions">
          {row.approval_status !== 'ditolak' && (
            <Button size="sm" variant="ghost" onClick={() => {
              setStatusModal(row);
              setNewStatus(row.approval_status);
              setAlasanReject(row.alasan_reject || '');
              setNewStatusPeserta(row.status_peserta);
              setAlasanPerubahan(row.alasan_perubahan || '');
            }}>Ubah</Button>
          )}
          <Button size="sm" variant="danger" onClick={() => removePeserta(row.id)}>Hapus</Button>
        </div>
      ),
    },
  ];

  const latihanColumns = [
    { key: 'tanggal', label: 'Tanggal', render: (v) => formatDate(v, { month: 'short' }) },
    { key: 'jam', label: 'Jam', width: 80 },
    { key: 'lokasi', label: 'Lokasi' },
    { key: 'keterangan', label: 'Keterangan' },
    {
      key: 'actions', label: 'Aksi', width: 100,
      render: (_, row) => <Button size="sm" variant="secondary" onClick={() => navigate(`/latihan/${row.id}/absensi`)}>Absensi</Button>,
    },
  ];

  const partiturColumns = [
    { key: 'judul', label: 'Judul',
      render: (v, row) => (
        <a href={`${API_URL}/uploads/${row.file_pdf}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--c-primary-500)', fontWeight: 600, textDecoration: 'none' }}>
          {v} 📄
        </a>
      )
    },
    { key: 'komposer', label: 'Komposer' },
    { key: 'jenis_lagu', label: 'Jenis' },
    { key: 'jumlah_suara', label: 'Suara', width: 70 },
    {
      key: 'actions', label: 'Aksi', width: 180,
      render: (_, row) => (
        <div className="row-actions">
          <Button size="sm" variant="secondary" onClick={() => window.open(`${API_URL}/uploads/${row.file_pdf}`, '_blank')}>Lihat PDF</Button>
          <Button size="sm" variant="danger" onClick={() => unlinkPartitur(row.id)}>Hapus</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page anim-slide-up">
      <div className="page-header">
        <div>
          <h2 className="page-title">{acara.nama_acara}</h2>
          <p className="page-subtitle">{acara.jenis_kegiatan} · {formatDate(acara.tanggal)} · {acara.lokasi}</p>
        </div>
        <div className="row-actions">
          <Button variant="secondary" onClick={() => navigate('/acara')}>← Kembali</Button>
          <Button variant="outline" onClick={() => navigate(`/acara/${id}/edit`)}>Edit Acara</Button>
        </div>
      </div>

      {/* Event Info Card */}
      <Card className="detail-info-card">
        <div className="detail-grid">
          <div className="detail-field"><span className="detail-label">Status</span><Badge status={acara.status} size="lg" /></div>
          <div className="detail-field"><span className="detail-label">Penyelenggara</span><span className="detail-value">{acara.penyelenggara}</span></div>
          <div className="detail-field"><span className="detail-label">Penanggung Jawab</span><span className="detail-value">{acara.penanggung_jawab}</span></div>
          <div className="detail-field"><span className="detail-label">Jenis SKKK</span><span className="detail-value">{acara.jenis_skkk}</span></div>
          <div className="detail-field"><span className="detail-label">Dibuat oleh</span><span className="detail-value">{acara.created_by_nama}</span></div>
        </div>
        <div className="detail-actions">
          {acara.status === 'aktif' && <>
            <Button size="sm" variant="primary" onClick={() => updateAcaraStatus('selesai')}>✓ Selesaikan</Button>
            <Button size="sm" variant="danger" onClick={() => updateAcaraStatus('dibatalkan')}>✕ Batalkan</Button>
          </>}
          {acara.status === 'dibatalkan' && <Button size="sm" variant="primary" onClick={() => updateAcaraStatus('aktif')}>Aktifkan Kembali</Button>}
        </div>
      </Card>

      {/* Tabs: Peserta, Latihan, Partitur, Dokumentasi */}
      <Tabs tabs={[
        { label: 'Peserta', badge: peserta.filter((p) => p.status_peserta === 'ikut' && p.approval_status === 'disetujui').length },
        { label: 'Latihan', badge: latihan.length },
        { label: 'Partitur', badge: partitur.length },
        { label: 'Dokumentasi', badge: dokumentasi.length },
      ]}>
        <div>
          <div className="tab-actions-header" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="show-rejected-checkbox"
                  checked={showRejected}
                  onChange={(e) => setShowRejected(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="show-rejected-checkbox" style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--c-neutral-600)', cursor: 'pointer' }}>
                  Tampilkan Peserta Ditolak
                </label>
              </div>
              <Input
                id="search-peserta"
                placeholder="Cari nama atau NRP..."
                value={searchPeserta}
                onChange={(e) => setSearchPeserta(e.target.value)}
                className="filter-search"
                style={{ margin: 0, width: '220px', display: 'inline-flex' }}
                icon="🔍"
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button variant="outline" size="sm" onClick={() => setShowApprovalListModal(true)} style={{ borderColor: 'var(--c-primary-500)', color: 'var(--c-primary-600)' }}>
                🔔 Persetujuan Peserta ({pendingPeserta.length})
              </Button>
              <Button variant="primary" size="sm" onClick={openAddPeserta}>+ Tambah Peserta</Button>
            </div>
          </div>
          <Card padding={false}>
            <DataTable columns={pesertaColumns} data={filteredPeserta} loading={false} emptyMessage="Belum ada peserta terdaftar." />
          </Card>
        </div>
        <div>
          <div className="tab-actions-header" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" size="sm" onClick={() => navigate(`/latihan/new?acara_id=${id}`)}>+ Tambah Latihan</Button>
          </div>
          <Card padding={false}>
            <DataTable columns={latihanColumns} data={latihan} loading={false} emptyMessage="Belum ada jadwal latihan." />
          </Card>
        </div>
        <div>
          <div className="tab-actions-header" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" size="sm" onClick={openLinkPartitur}>+ Hubungkan Partitur</Button>
          </div>
          <Card padding={false}>
            <DataTable columns={partiturColumns} data={partitur} loading={false} emptyMessage="Belum ada partitur yang dihubungkan." />
          </Card>
        </div>
        <div>
          <div className="tab-actions-header" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" size="sm" onClick={() => { setShowDokumentasiModal(true); setDocFiles([]); setDocKeterangan(''); }}>+ Tambah Dokumentasi</Button>
          </div>
          <Card>
            {dokumentasi.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--c-neutral-400)' }}>
                Belum ada foto dokumentasi untuk acara ini.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                {dokumentasi.map((d) => {
                  const imgUrl = d.file_path.startsWith('uploads/') ? `${API_URL}/${d.file_path}` : `${API_URL}/uploads/${d.file_path}`;
                  return (
                    <div key={d.id} className="dokumentasi-card" style={{
                      borderRadius: 'var(--r-xl)',
                      border: '1px solid rgba(107, 145, 184, 0.15)',
                      overflow: 'hidden',
                      background: 'rgba(255,255,255,0.6)',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative'
                    }}>
                      <div style={{ width: '100%', height: '160px', overflow: 'hidden', position: 'relative', background: '#f1f5f9' }}>
                        <img
                          src={imgUrl}
                          alt={d.keterangan || 'Dokumentasi'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                          onClick={() => setPreviewImage({ url: imgUrl, keterangan: d.keterangan })}
                        />
                        <button onClick={() => deleteDokumentasi(d.id)} style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(239, 68, 68, 0.9)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                        }} title="Hapus">✕</button>
                      </div>
                      <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--c-neutral-700)', margin: 0, fontWeight: 500 }}>
                          {d.keterangan || <em style={{ color: 'var(--c-neutral-400)' }}>Tanpa keterangan</em>}
                        </p>
                        <span style={{ fontSize: '10px', color: 'var(--c-neutral-400)', marginTop: '8px', display: 'block' }}>
                          Diunggah: {formatDateTime(d.uploaded_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </Tabs>

      {/* Evaluasi Kegiatan — hanya relevan setelah acara berakhir */}
      {acara.status === 'selesai' && (
        <Card className="eval-card">
          <div className="eval-head">
            <div>
              <h3 className="eval-title">Evaluasi Kegiatan</h3>
              <p className="eval-sub">
                {evaluasi
                  ? 'Catatan ini ikut tercetak pada Rekap Kegiatan.'
                  : 'Belum ada evaluasi. Catat hasil dan pelajaran dari kegiatan ini.'}
              </p>
            </div>
            <div className="row-actions">
              {evaluasi && <Badge status={evaluasi.is_publik ? 'aktif' : 'menunggu'} />}
              <Button size="sm" variant="primary" onClick={openEvalModal}>
                {evaluasi ? 'Ubah Evaluasi' : '+ Tulis Evaluasi'}
              </Button>
            </div>
          </div>

          {evaluasi ? (
            <div className="eval-body">
              {evaluasi.skor != null && (
                <div className="eval-score">
                  <span className="eval-score-value">{evaluasi.skor}</span>
                  <span className="eval-score-max">dari 5</span>
                </div>
              )}
              <div className="eval-blocks">
                <div className="eval-block">
                  <span className="detail-label">Catatan</span>
                  <p className="eval-text">{evaluasi.catatan}</p>
                </div>
                {evaluasi.kendala && (
                  <div className="eval-block">
                    <span className="detail-label">Kendala</span>
                    <p className="eval-text">{evaluasi.kendala}</p>
                  </div>
                )}
                {evaluasi.saran && (
                  <div className="eval-block">
                    <span className="detail-label">Saran Perbaikan</span>
                    <p className="eval-text">{evaluasi.saran}</p>
                  </div>
                )}
              </div>
              <p className="eval-meta">
                {evaluasi.is_publik
                  ? 'Terlihat oleh anggota (hanya catatan & penilaian).'
                  : 'Internal — tidak terlihat oleh anggota.'}
                {evaluasi.nama_admin ? ` · Dicatat oleh ${evaluasi.nama_admin}` : ''}
              </p>
            </div>
          ) : null}
        </Card>
      )}

      {/* Approval Modal */}
      <Modal open={!!statusModal} onClose={() => setStatusModal(null)} title={`Ubah Status: ${statusModal?.nama_lengkap}`} size="sm"
        footer={<>
          <Button variant="secondary" onClick={() => setStatusModal(null)}>Batal</Button>
          <Button variant="primary" onClick={updateApproval}>Simpan</Button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {statusModal?.approval_status === 'menunggu' ? (
            <>
              <Select id="approval-select" label="Status Approval" value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)} icon="✍️"
                options={APPROVAL_STATUS.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))} />
              
              {newStatus === 'ditolak' && (
                <Input
                  id="alasan-reject-main"
                  label="Alasan Ditolak"
                  placeholder="Masukkan alasan penolakan..."
                  value={alasanReject}
                  onChange={(e) => setAlasanReject(e.target.value)}
                  icon="📝"
                />
              )}
            </>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--c-neutral-400)', textTransform: 'uppercase' }}>
                  Status Approval
                </span>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--c-primary-600)' }}>
                  Disetujui
                </span>
              </div>
              
              <Select id="status-peserta-main" label="Status Peserta" value={newStatusPeserta}
                onChange={(e) => setNewStatusPeserta(e.target.value)} icon="🏃"
                options={STATUS_PESERTA.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))} />
              
              {newStatusPeserta === 'batal' && (
                <Input
                  id="alasan-perubahan-main"
                  label="Alasan Batal"
                  placeholder="Masukkan alasan pembatalan..."
                  value={alasanPerubahan}
                  onChange={(e) => setAlasanPerubahan(e.target.value)}
                  icon="📝"
                />
              )}
            </>
          )}
        </div>
      </Modal>

      {/* Add Peserta Modal */}
      <Modal open={showPesertaModal} onClose={() => setShowPesertaModal(false)} title="Tambah Peserta Acara" size="sm"
        footer={<>
          <Button variant="secondary" onClick={() => setShowPesertaModal(false)}>Batal</Button>
          <Button variant="primary" onClick={handleAddPeserta} loading={pesertaSubmitting}>Tambah</Button>
        </>}
      >
        <form onSubmit={handleAddPeserta}>
          <Select
            id="select-anggota-acara"
            label="Pilih Anggota"
            placeholder="Pilih nama / NRP..."
            icon="👤"
            options={anggotaList.map((a) => ({ value: a.id, label: `${a.nama_lengkap} - ${a.nrp} (${a.bagian_suara})` }))}
            value={selectedAnggota}
            onChange={(e) => setSelectedAnggota(e.target.value)}
          />
        </form>
      </Modal>

      {/* Link Partitur Modal */}
      <Modal open={showPartiturModal} onClose={() => setShowPartiturModal(false)} title="Hubungkan Partitur Lagu" size="sm"
        footer={<>
          <Button variant="secondary" onClick={() => setShowPartiturModal(false)}>Batal</Button>
          <Button variant="primary" onClick={handleLinkPartitur} loading={partiturSubmitting}>Hubungkan</Button>
        </>}
      >
        <form onSubmit={handleLinkPartitur}>
          <Select
            id="select-partitur-acara"
            label="Pilih Partitur"
            placeholder="Pilih judul lagu..."
            icon="🎼"
            options={allPartiturList.map((p) => ({ value: p.id, label: `${p.judul} (${p.komposer})` }))}
            value={selectedPartitur}
            onChange={(e) => setSelectedPartitur(e.target.value)}
          />
        </form>
      </Modal>

      {/* Approval List Modal */}
      <Modal open={showApprovalListModal} onClose={() => setShowApprovalListModal(false)} title="Persetujuan Pendaftaran Acara" size="lg"
        footer={<Button variant="secondary" onClick={() => setShowApprovalListModal(false)}>Tutup</Button>}
      >
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid rgba(107, 145, 184, 0.15)', paddingBottom: '8px' }}>
                <th style={{ padding: '12px 8px' }}>NRP</th>
                <th style={{ padding: '12px 8px' }}>Nama</th>
                <th style={{ padding: '12px 8px' }}>Suara</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pendingPeserta.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--c-neutral-400)' }}>Tidak ada permintaan pendaftaran yang menanti persetujuan.</td>
                </tr>
              ) : (
                pendingPeserta.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(107, 145, 184, 0.1)' }}>
                    <td style={{ padding: '12px 8px' }}>{p.nrp}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{p.nama_lengkap}</td>
                    <td style={{ padding: '12px 8px' }}><Badge status={p.bagian_suara} /></td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <Button size="sm" variant="primary" onClick={() => handleDirectApprove(p.id)}>Setujui</Button>
                        <Button size="sm" variant="danger" onClick={() => openRejectPrompt(p)}>Tolak</Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Reject Reason Modal */}
      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title={`Tolak Pendaftaran: ${rejectModal?.nama_lengkap}`} size="sm"
        footer={<>
          <Button variant="secondary" onClick={() => setRejectModal(null)}>Batal</Button>
          <Button variant="danger" onClick={handleRejectSubmit}>Tolak Pendaftaran</Button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '14px', color: 'var(--c-neutral-600)' }}>
            Berikan alasan penolakan pendaftaran untuk <strong>{rejectModal?.nama_lengkap}</strong>.
          </p>
          <Input
            id="alasan-reject"
            label="Alasan Penolakan"
            placeholder="Misal: Bagian suara Sopran sudah penuh"
            value={alasanReject}
            onChange={(e) => setAlasanReject(e.target.value)}
            icon="📝"
            className="col-12"
          />
        </div>
      </Modal>

      {/* Modal: Evaluasi Kegiatan */}
      <Modal
        open={showEvalModal}
        onClose={() => setShowEvalModal(false)}
        title={evaluasi ? 'Ubah Evaluasi Kegiatan' : 'Tulis Evaluasi Kegiatan'}
        size="md"
        footer={<>
          <Button variant="secondary" onClick={() => setShowEvalModal(false)}>Batal</Button>
          <Button variant="primary" onClick={submitEvaluasi} disabled={evalSubmitting}>
            {evalSubmitting ? 'Menyimpan…' : 'Simpan Evaluasi'}
          </Button>
        </>}
      >
        <div className="eval-form">
          <Select
            id="eval-skor"
            label="Penilaian (opsional)"
            value={String(evalForm.skor)}
            onChange={(e) => setEvalForm({ ...evalForm, skor: e.target.value })}
            options={[
              { value: '', label: 'Tidak dinilai' },
              { value: '5', label: '5 — Sangat baik' },
              { value: '4', label: '4 — Baik' },
              { value: '3', label: '3 — Cukup' },
              { value: '2', label: '2 — Kurang' },
              { value: '1', label: '1 — Sangat kurang' },
            ]}
          />

          <label className="input-label" htmlFor="eval-catatan">
            Catatan<span className="required-asterisk" style={{ color: '#ef4444', marginLeft: 4 }}>*</span>
          </label>
          <textarea
            id="eval-catatan"
            className="eval-textarea"
            rows={4}
            maxLength={2000}
            placeholder="Bagaimana kegiatan berjalan? Apa yang patut dicatat?"
            value={evalForm.catatan}
            onChange={(e) => setEvalForm({ ...evalForm, catatan: e.target.value })}
          />

          <label className="input-label" htmlFor="eval-kendala">Kendala (opsional)</label>
          <textarea
            id="eval-kendala"
            className="eval-textarea"
            rows={3}
            maxLength={1000}
            placeholder="Hambatan yang muncul selama kegiatan"
            value={evalForm.kendala}
            onChange={(e) => setEvalForm({ ...evalForm, kendala: e.target.value })}
          />

          <label className="input-label" htmlFor="eval-saran">Saran Perbaikan (opsional)</label>
          <textarea
            id="eval-saran"
            className="eval-textarea"
            rows={3}
            maxLength={1000}
            placeholder="Apa yang perlu diubah untuk kegiatan berikutnya"
            value={evalForm.saran}
            onChange={(e) => setEvalForm({ ...evalForm, saran: e.target.value })}
          />

          <label className="eval-check">
            <input
              type="checkbox"
              checked={evalForm.is_publik}
              onChange={(e) => setEvalForm({ ...evalForm, is_publik: e.target.checked })}
            />
            <span>
              Tampilkan ke anggota
              <small>Anggota hanya melihat penilaian &amp; catatan. Kendala dan saran tetap internal.</small>
            </span>
          </label>
        </div>
      </Modal>

      {/* Add Dokumentasi Modal */}
      <Modal open={showDokumentasiModal} onClose={() => setShowDokumentasiModal(false)} title="Unggah Dokumentasi Acara" size="md"
        footer={<>
          <Button variant="secondary" onClick={() => setShowDokumentasiModal(false)}>Batal</Button>
          <Button variant="primary" onClick={handleUploadDokumentasi} loading={docSubmitting}>Unggah</Button>
        </>}
      >
        <form onSubmit={handleUploadDokumentasi} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="doc-files" style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--c-primary-800)' }}>
              Pilih Foto (Dapat memilih beberapa foto sekaligus)
            </label>
            <input
              id="doc-files"
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setDocFiles(e.target.files)}
              style={{
                padding: '10px',
                border: '1.5px dashed rgba(107, 145, 184, 0.3)',
                borderRadius: 'var(--r-lg)',
                cursor: 'pointer',
                background: '#f8fafc'
              }}
            />
          </div>
          <Input
            id="doc-keterangan"
            label="Keterangan / Deskripsi Foto"
            placeholder="Misal: Sesi pemanasan vokal sebelum konser dimulai"
            value={docKeterangan}
            onChange={(e) => setDocKeterangan(e.target.value)}
            icon="📝"
          />
        </form>
      </Modal>

      {/* Image Preview Modal */}
      <Modal open={!!previewImage} onClose={() => setPreviewImage(null)} title="Lihat Dokumentasi" size="lg"
        footer={<>
          <Button variant="secondary" onClick={() => setPreviewImage(null)}>Tutup</Button>
          <Button variant="primary" onClick={() => downloadImage(previewImage.url, 'dokumentasi.jpg')}>
            💾 Simpan ke Perangkat
          </Button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ maxWidth: '100%', maxHeight: '60vh', overflow: 'hidden', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-md)' }}>
            <img src={previewImage?.url} alt="Pratinjau" style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }} />
          </div>
          {previewImage?.keterangan && (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--c-neutral-700)', fontWeight: 500, textAlign: 'center', margin: 0 }}>
              {previewImage.keterangan}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}

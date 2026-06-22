import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { API_URL } from '../../utils/constants';
import { formatDate } from '../../utils/formatDate';
import '../anggota/AnggotaListPage.css';

export default function PartiturListPage() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [jenis, setJenis]     = useState('');
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDel]    = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedPartitur, setSelectedPartitur] = useState(null);
  const [eventsList, setEventsList] = useState([]);
  const [selectedAcara, setSelectedAcara] = useState('');
  const [linking, setLinking] = useState(false);
  const [genres, setGenres]   = useState(['Hymn', 'Klasik', 'Oratorio', 'Pop', 'Rohani', 'Nasional']);
  const toast = useToast();
  const navigate = useNavigate();
  const searchTimer = useRef(null);

  const fetchData = (s = search, j = jenis) => {
    setLoading(true);
    api.get('/partitur', { params: { search: s, jenis_lagu: j } })
      .then((res) => setData(res.data.data))
      .catch(() => toast('Gagal memuat data partitur.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [jenis]);

  useEffect(() => {
    // Fetch all partiturs once to gather unique custom genres
    api.get('/partitur')
      .then((res) => {
        const defaultGenres = ['Hymn', 'Klasik', 'Oratorio', 'Pop', 'Rohani', 'Nasional'];
        const unique = new Set(defaultGenres);
        if (res.data && res.data.data) {
          res.data.data.forEach((p) => {
            if (p.jenis_lagu && !unique.has(p.jenis_lagu)) {
              unique.add(p.jenis_lagu);
            }
          });
        }
        setGenres(Array.from(unique));
      })
      .catch((err) => console.error('Failed to load unique genres', err));
  }, []);

  const handleSearch = (v) => {
    setSearch(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchData(v, jenis), 400);
  };

  const handleDelete = async () => {
    setDel(true);
    try {
      await api.delete(`/partitur/${confirm.id}`);
      toast('Partitur berhasil dihapus.');
      fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Gagal menghapus.', 'error'); }
    finally { setDel(false); setConfirm(null); }
  };

  const openLinkModal = async (partiturRow) => {
    setSelectedPartitur(partiturRow);
    setSelectedAcara('');
    setShowLinkModal(true);
    try {
      const res = await api.get('/acara', { params: { exclude_partitur_id: partiturRow.id, status: 'aktif' } });
      setEventsList(res.data.data || []);
    } catch {
      toast('Gagal memuat daftar acara.', 'error');
    }
  };

  const handleLinkAcara = async (e) => {
    e.preventDefault();
    if (!selectedAcara) {
      toast('Pilih acara terlebih dahulu.', 'error');
      return;
    }
    setLinking(true);
    try {
      await api.post('/partitur/link-acara', { acara_id: +selectedAcara, partitur_id: +selectedPartitur.id });
      toast(`Partitur "${selectedPartitur.judul}" berhasil dihubungkan ke acara.`);
      setShowLinkModal(false);
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal menghubungkan partitur ke acara.', 'error');
    } finally {
      setLinking(false);
    }
  };



  const columns = [
    { key: 'judul', label: 'Judul', render: (v) => <strong style={{ color: 'var(--c-neutral-800)' }}>{v}</strong> },
    { key: 'komposer', label: 'Komposer' },
    { key: 'jenis_lagu', label: 'Jenis', width: 100 },
    { key: 'jumlah_suara', label: 'Suara', width: 70 },
    {
      key: 'file_pdf', label: 'File', width: 80,
      render: (v) => {
        if (!v) return '—';
        const href = v.startsWith('uploads/') ? `${API_URL}/${v}` : `${API_URL}/uploads/${v}`;
        return (
          <a href={href} target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--c-primary-500)', fontWeight: 500, fontSize: 'var(--text-sm)' }}>
            📄 PDF
          </a>
        );
      },
    },
    {
      key: 'actions', label: 'Aksi', width: 220,
      render: (_, row) => (
        <div className="row-actions">
          <Button size="sm" variant="outline" onClick={() => openLinkModal(row)} style={{ borderColor: 'var(--c-primary-400)', color: 'var(--c-primary-600)' }}>+ Acara</Button>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/partitur/${row.id}/edit`)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => setConfirm(row)}>Hapus</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page anim-slide-up">
      <div className="page-header">
        <div>
          <h2 className="page-title">Koleksi Partitur</h2>
          <p className="page-subtitle">Kelola partitur lagu paduan suara</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/partitur/new')} id="btn-tambah-partitur">+ Upload Partitur</Button>
      </div>

      <div className="page-filters">
        <Input id="search-partitur" placeholder="Cari judul atau komposer..." value={search}
          onChange={(e) => handleSearch(e.target.value)} className="filter-search" />
        <Select id="filter-jenis" placeholder="Semua"
          options={genres.map((j) => ({ value: j, label: j }))}
          value={jenis} onChange={(e) => setJenis(e.target.value)} className="filter-select" />
      </div>

      <Card padding={false}>
        <DataTable columns={columns} data={data} loading={loading} emptyMessage="Belum ada partitur yang diunggah." />
      </Card>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={handleDelete} loading={deleting}
        title="Hapus Partitur" message={`Yakin ingin menghapus partitur "${confirm?.judul}"? File PDF juga akan dihapus.`} />

      {/* Link to Event Modal */}
      <Modal open={showLinkModal} onClose={() => setShowLinkModal(false)} title={`Hubungkan "${selectedPartitur?.judul}" ke Acara`}
        footer={<>
          <Button variant="secondary" onClick={() => setShowLinkModal(false)}>Batal</Button>
          <Button variant="primary" onClick={handleLinkAcara} loading={linking}>Hubungkan</Button>
        </>}
      >
        <form onSubmit={handleLinkAcara} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          <Select id="modal-acara" label="Acara Aktif" placeholder="Pilih acara..." icon="🎵"
            options={eventsList.map((e) => ({ value: e.id, label: `${e.nama_acara} - ${formatDate(e.tanggal, { day: 'numeric', month: 'short', year: 'numeric' })}` }))}
            value={selectedAcara} onChange={(e) => setSelectedAcara(e.target.value)} />
        </form>
      </Modal>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { formatDate } from '../../utils/formatDate';
import { STATUS_ACARA } from '../../utils/constants';
import '../anggota/AnggotaListPage.css';

export default function AcaraListPage() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDel]    = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const fetchData = () => {
    setLoading(true);
    api.get('/acara')
      .then((res) => {
        let filtered = res.data.data;
        if (status) filtered = filtered.filter((e) => e.status === status);
        if (search) {
          const q = search.toLowerCase();
          filtered = filtered.filter((e) => e.nama_acara.toLowerCase().includes(q));
        }
        setData(filtered);
      })
      .catch(() => toast('Gagal memuat data acara.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [status, search]);

  const handleDelete = async () => {
    setDel(true);
    try {
      await api.delete(`/acara/${confirm.id}`);
      toast('Acara berhasil dihapus.');
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal menghapus acara.', 'error');
    } finally { setDel(false); setConfirm(null); }
  };

  const columns = [
    { key: 'nama_acara', label: 'Nama Acara',
      render: (v, row) => (
        <button className="link-btn" onClick={() => navigate(`/acara/${row.id}`)}
          style={{ background:'none', border:'none', cursor:'pointer', color:'var(--c-primary-500)', fontWeight:600, fontSize:'var(--text-sm)', textAlign:'left', padding:0 }}>
          {v}
        </button>
      ),
    },
    { key: 'tanggal', label: 'Tanggal', width: 140, render: (v) => formatDate(v, { month: 'short' }) },
    { key: 'jenis_kegiatan', label: 'Jenis', width: 100 },
    { key: 'lokasi', label: 'Lokasi' },
    { key: 'jumlah_peserta', label: 'Peserta', width: 80, render: (v) => v ?? 0 },
    { key: 'jumlah_latihan', label: 'Latihan', width: 80, render: (v) => v ?? 0 },
    { key: 'status', label: 'Status', width: 110, render: (v) => <Badge status={v} /> },
    {
      key: 'actions', label: 'Aksi', width: 160,
      render: (_, row) => (
        <div className="row-actions">
          <Button size="sm" variant="secondary" onClick={() => navigate(`/acara/${row.id}`)}>Detail</Button>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/acara/${row.id}/edit`)}>Edit</Button>
          {row.nama_acara !== 'UKM' && (
            <Button size="sm" variant="danger" onClick={() => setConfirm(row)}>×</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="page anim-slide-up">
      <div className="page-header">
        <div>
          <h2 className="page-title">Daftar Acara</h2>
          <p className="page-subtitle">Kelola acara dan kegiatan paduan suara PCU</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/acara/new')} id="btn-tambah-acara">+ Tambah Acara</Button>
      </div>

      <div className="page-filters">
        <Input id="search-acara" placeholder="Cari nama acara..." value={search}
          onChange={(e) => setSearch(e.target.value)} className="filter-search" />
        <Select id="filter-status-acara" placeholder="Semua Status"
          options={STATUS_ACARA.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
          value={status} onChange={(e) => setStatus(e.target.value)} className="filter-select" />
      </div>

      <Card padding={false}>
        <DataTable columns={columns} data={data} loading={loading} emptyMessage="Belum ada acara yang dibuat." />
      </Card>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={handleDelete} loading={deleting}
        title="Hapus Acara" message={`Yakin ingin menghapus acara "${confirm?.nama_acara}"? Semua latihan, peserta, dan absensi terkait juga akan terhapus.`} />
    </div>
  );
}

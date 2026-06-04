import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { formatDate } from '../../utils/formatDate';
import '../anggota/AnggotaListPage.css';

export default function LatihanListPage() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [tipe, setTipe]       = useState('');
  const [acaraId, setAcaraId] = useState('');
  const [events, setEvents]   = useState([]);
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDel]    = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const fetchData = () => {
    setLoading(true);
    api.get('/latihan', { params: { tipe_latihan: tipe, acara_id: acaraId } })
      .then((res) => setData(res.data.data))
      .catch(() => toast('Gagal memuat data latihan.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/acara')
      .then(res => setEvents(res.data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchData(); }, [tipe, acaraId]);

  const handleDelete = async () => {
    setDel(true);
    try {
      await api.delete(`/latihan/${confirm.id}`);
      toast('Latihan berhasil dihapus.');
      fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Gagal menghapus.', 'error'); }
    finally { setDel(false); setConfirm(null); }
  };

  const columns = [
    { key: 'tanggal', label: 'Tanggal', width: 120, render: (v) => formatDate(v, { month: 'short' }) },
    { key: 'jam', label: 'Jam', width: 70 },
    { key: 'lokasi', label: 'Lokasi' },
    { key: 'tipe_latihan', label: 'Tipe', width: 80, render: (v) => <Badge status={v} variant={v === 'rutin' ? 'info' : 'primary'} label={v === 'rutin' ? 'Rutin' : 'Sekali'} /> },
    { key: 'nama_acara', label: 'Acara', render: (v) => v || <span className="text-muted">—</span> },
    { key: 'keterangan', label: 'Keterangan', render: (v) => v || <span className="text-muted">—</span> },
    {
      key: 'actions', label: 'Aksi', width: 210,
      render: (_, row) => (
        <div className="row-actions">
          <Button size="sm" variant="primary" onClick={() => navigate(`/latihan/${row.id}/absensi`)}>Absensi</Button>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/latihan/${row.id}/edit`)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => setConfirm(row)}>×</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page anim-slide-up">
      <div className="page-header">
        <div>
          <h2 className="page-title">Jadwal Latihan</h2>
          <p className="page-subtitle">Kelola jadwal latihan rutin dan persiapan acara</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/latihan/new')} id="btn-tambah-latihan">+ Tambah Latihan</Button>
      </div>

      <div className="page-filters">
        <Select id="filter-tipe" placeholder="Semua Tipe"
          options={[{ value: 'rutin', label: 'Rutin' }, { value: 'sekali', label: 'Sekali' }]}
          value={tipe} onChange={(e) => setTipe(e.target.value)} className="filter-select" />
        <Select id="filter-acara" placeholder="Semua Acara"
          options={events.map(e => ({ value: e.id, label: `${e.nama_acara} - ${formatDate(e.tanggal, { day: 'numeric', month: 'short', year: 'numeric' })}` }))}
          value={acaraId} onChange={(e) => setAcaraId(e.target.value)} className="filter-select" />
      </div>

      <Card padding={false}>
        <DataTable columns={columns} data={data} loading={loading} emptyMessage="Belum ada jadwal latihan." />
      </Card>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={handleDelete} loading={deleting}
        title="Hapus Latihan" message={`Yakin ingin menghapus latihan tanggal ${confirm?.tanggal ? formatDate(confirm.tanggal, { month: 'short' }) : ''}?`} />
    </div>
  );
}

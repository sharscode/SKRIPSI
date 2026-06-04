import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { BAGIAN_SUARA } from '../../utils/constants';
import { formatDate } from '../../utils/formatDate';
import './AnggotaListPage.css';

export default function AnggotaListPage() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [suara, setSuara]     = useState('');
  const [page, setPage]       = useState(1);
  const [totalPages, setTotal]= useState(1);
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDel]    = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const searchTimer = useRef(null);

  const fetchData = (p = page, s = search, v = suara) => {
    setLoading(true);
    api.get('/anggota', { params: { page: p, limit: 10, search: s, bagian_suara: v } })
      .then((res) => {
        setData(res.data.data.data);
        setTotal(res.data.data.pagination.totalPages);
      })
      .catch(() => toast('Gagal memuat data anggota.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSearch = (v) => {
    setSearch(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); fetchData(1, v, suara); }, 400);
  };

  const handleSuara = (v) => { setSuara(v); setPage(1); fetchData(1, search, v); };
  const handlePage  = (p) => { setPage(p); fetchData(p, search, suara); };

  const handleDelete = async () => {
    setDel(true);
    try {
      await api.delete(`/anggota/${confirm.id}`);
      toast('Anggota berhasil dihapus.', 'success');
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal menghapus anggota.', 'error');
    } finally { setDel(false); setConfirm(null); }
  };

  const columns = [
    { key: 'nrp', label: 'NRP', width: 110 },
    { key: 'nama_lengkap', label: 'Nama Lengkap' },
    { key: 'bagian_suara', label: 'Suara', width: 90, render: (v) => <Badge status={v} /> },
    { key: 'jurusan', label: 'Jurusan' },
    { key: 'tanggal_lahir', label: 'Tgl Lahir', width: 120, render: (v) => formatDate(v) },
    { key: 'email', label: 'Email' },
    { key: 'kontak', label: 'Kontak' },
    {
      key: 'actions', label: 'Aksi',
      render: (_, row) => (
        <div className="row-actions">
          <Button size="sm" variant="secondary" onClick={() => navigate(`/anggota/${row.id}/edit`)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => setConfirm(row)}>Hapus</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page anim-slide-up">
      <div className="page-header">
        <div>
          <h2 className="page-title">Daftar Anggota</h2>
          <p className="page-subtitle">Kelola data anggota paduan suara PCU</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/anggota/new')} id="btn-tambah-anggota">+ Tambah Anggota</Button>
      </div>

      <div className="page-filters">
        <Input id="search-anggota" placeholder="Cari nama atau NRP..." value={search} onChange={(e) => handleSearch(e.target.value)} className="filter-search" />
        <Select id="filter-suara" placeholder="Semua Suara" options={BAGIAN_SUARA.map(s => ({ value: s, label: s.charAt(0).toUpperCase()+s.slice(1) }))} value={suara} onChange={(e) => handleSuara(e.target.value)} className="filter-select" />
      </div>

      <DataTable columns={columns} data={data} loading={loading} emptyMessage="Tidak ada anggota ditemukan." />

      <div className="page-footer">
        <Pagination page={page} totalPages={totalPages} onChange={handlePage} />
      </div>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={handleDelete} loading={deleting}
        title="Hapus Anggota" message={`Yakin ingin menghapus anggota "${confirm?.nama_lengkap}"? Tindakan ini tidak bisa dibatalkan.`} />
    </div>
  );
}

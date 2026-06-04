import { useEffect, useState } from 'react';
import api from '../../config/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { formatDate } from '../../utils/formatDate';
import './AnggotaUkmPage.css';

export default function AnggotaUkmPage() {
  const [data, setData]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [periode, setPeriode]   = useState('');
  const [status, setStatus]     = useState('');
  const [search, setSearch]     = useState('');
  const [showModal, setShowModal] = useState(false);
  const [anggotaList, setAnggotaList] = useState([]);
  const [periodList, setPeriodList]   = useState([]);
  const [form, setForm]         = useState({ anggota_id: '', periode: '' });
  const [submitting, setSub]    = useState(false);
  const toast = useToast();

  const fetchData = () => {
    setLoading(true);
    api.get('/anggota-ukm', { params: { periode, status_keaktifan: status, search } })
      .then((res) => setData(res.data.data))
      .catch(() => toast('Gagal memuat data keanggotaan.', 'error'))
      .finally(() => setLoading(false));
  };

  const fetchPeriods = () => {
    api.get('/settings/periodes')
      .then((res) => setPeriodList(res.data.data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  useEffect(() => {
    fetchData();
  }, [periode, status]);

  const handleAddNewPeriod = async () => {
    const newPeriod = window.prompt("Masukkan Periode Baru (Format: YYYY/YYYY, Contoh: 2026/2027):");
    if (!newPeriod) return;
    if (!/^\d{4}\/\d{4}$/.test(newPeriod)) {
      toast("Format periode harus YYYY/YYYY (contoh: 2025/2026).", "error");
      return;
    }
    try {
      await api.post('/settings/periodes', { periode: newPeriod });
      toast("Periode baru berhasil ditambahkan.", "success");
      api.get('/settings/periodes').then((res) => {
        setPeriodList(res.data.data);
        setForm(f => ({ ...f, periode: newPeriod }));
      });
    } catch (err) {
      toast(err.response?.data?.message || "Gagal menambahkan periode.", "error");
    }
  };

  const toggleStatus = async (row) => {
    const newStatus = row.status_keaktifan === 'aktif' ? 'nonaktif' : 'aktif';
    try {
      await api.put(`/anggota-ukm/${row.id}/status`, { status_keaktifan: newStatus });
      toast(`Status berhasil diubah ke ${newStatus}.`);
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal mengubah status.', 'error');
    }
  };

  const openRegisterModal = async () => {
    try {
      const res = await api.get('/anggota?limit=100');
      setAnggotaList(res.data.data.data || []);
    } catch { /* empty */ }
    setShowModal(true);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.anggota_id || !form.periode) {
      toast('Pilih anggota dan masukkan periode.', 'error');
      return;
    }
    setSub(true);
    try {
      await api.post('/anggota-ukm', form);
      toast('Anggota berhasil didaftarkan ke UKM.');
      setShowModal(false);
      setForm({ anggota_id: '', periode: '' });
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal mendaftarkan anggota.', 'error');
    } finally { setSub(false); }
  };

  const columns = [
    { key: 'nrp', label: 'NRP', width: 110 },
    { key: 'nama_lengkap', label: 'Nama Lengkap' },
    { key: 'email', label: 'Email' },
    { key: 'periode', label: 'Periode', width: 100 },
    { key: 'status_keaktifan', label: 'Status', render: (v) => <Badge status={v} variant={v === 'aktif' ? 'success' : 'danger'} /> },
    { key: 'tanggal_aktif', label: 'Tgl Aktif', render: (v) => formatDate(v, { month: 'short' }) },
    {
      key: 'actions', label: 'Aksi', width: 120,
      render: (_, row) => (
        <Button size="sm" variant={row.status_keaktifan === 'aktif' ? 'danger' : 'primary'}
          onClick={() => toggleStatus(row)}>
          {row.status_keaktifan === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
        </Button>
      ),
    },
  ];

  return (
    <div className="page anim-slide-up">
      <div className="page-header">
        <div>
          <h2 className="page-title">Keanggotaan UKM</h2>
          <p className="page-subtitle">Kelola periode dan status keanggotaan paduan suara</p>
        </div>
        <Button variant="primary" onClick={openRegisterModal} id="btn-daftarkan-ukm">+ Daftarkan Anggota</Button>
      </div>

      <div className="page-filters">
        <Input id="search-ukm" placeholder="Cari nama..." value={search}
          onChange={(e) => { setSearch(e.target.value); }}
          onKeyDown={(e) => { if (e.key === 'Enter') fetchData(); }}
          className="filter-search" />
        <Select id="filter-periode" placeholder="Semua Periode"
          options={periodList.map(p => ({ value: p, label: p }))}
          value={periode} onChange={(e) => setPeriode(e.target.value)} className="filter-select" />
        <Select id="filter-status-ukm" placeholder="Semua Status"
          options={[{ value: 'aktif', label: 'Aktif' }, { value: 'nonaktif', label: 'Nonaktif' }]}
          value={status} onChange={(e) => setStatus(e.target.value)} className="filter-select" />
      </div>

      <Card padding={false}>
        <DataTable columns={columns} data={data} loading={loading}
          emptyMessage="Belum ada data keanggotaan untuk filter yang dipilih." />
      </Card>

      {/* Register Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Daftarkan Anggota ke UKM"
        footer={<>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
          <Button variant="primary" onClick={handleRegister} loading={submitting}>Daftarkan</Button>
        </>}
      >
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          <Select id="modal-anggota" label="Anggota" placeholder="Pilih anggota..." icon="👤"
            options={anggotaList.map((a) => ({ value: a.id, label: `${a.nrp} — ${a.nama_lengkap}` }))}
            value={form.anggota_id} onChange={(e) => setForm({ ...form, anggota_id: +e.target.value })} />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--c-neutral-600)' }}>Periode</label>
              <button type="button" onClick={handleAddNewPeriod} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--c-primary-500)', fontSize: '12px', fontWeight: 600, padding: 0
              }}>
                + Tambah Periode Baru
              </button>
            </div>
            <Select id="modal-periode" placeholder="Pilih periode..." icon="📅"
              options={periodList.map(p => ({ value: p, label: p }))}
              value={form.periode} onChange={(e) => setForm({ ...form, periode: e.target.value })} />
          </div>
        </form>
      </Modal>
    </div>
  );
}

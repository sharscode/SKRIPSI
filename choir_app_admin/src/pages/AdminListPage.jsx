import { useEffect, useState } from 'react';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';
import { formatDateTime } from '../utils/formatDate';
import { ADMIN_ROLES } from '../utils/constants';
import './AdminListPage.css';

export default function AdminListPage() {
  const { user } = useAuth();
  const [admins, setAdmins]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [confirm, setConfirm]   = useState(null);
  const [deleting, setDel]      = useState(false);
  const [form, setForm]         = useState({ nama: '', email: '', password: '', role: 'admin' });
  const [errors, setErrors]     = useState({});
  const [submitting, setSub]    = useState(false);
  const toast = useToast();

  const fetchAdmins = () => {
    setLoading(true);
    api.get('/admin')
      .then((res) => setAdmins(res.data.data))
      .catch(() => toast('Gagal memuat data admin.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAdmins(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ nama: '', email: '', password: '', role: 'admin' });
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (admin) => {
    setEditing(admin);
    setForm({ nama: admin.nama, email: admin.email, password: '', role: admin.role });
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const err = {};
    if (!form.nama) err.nama = 'Nama wajib diisi.';
    if (!form.email) err.email = 'Email wajib diisi.';
    if (!editing && !form.password) err.password = 'Password wajib diisi.';
    if (form.password && form.password.length < 6) err.password = 'Password minimal 6 karakter.';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSub(true);
    try {
      if (editing) {
        await api.put(`/admin/${editing.id}`, { nama: form.nama, email: form.email, role: form.role });
        toast('Admin berhasil diperbarui.');
      } else {
        await api.post('/admin', form);
        toast('Admin berhasil ditambahkan.');
      }
      setShowModal(false);
      fetchAdmins();
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal menyimpan data admin.', 'error');
    } finally { setSub(false); }
  };

  const handleDelete = async () => {
    setDel(true);
    try {
      await api.delete(`/admin/${confirm.id}`);
      toast('Admin berhasil dihapus.');
      fetchAdmins();
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal menghapus admin.', 'error');
    } finally { setDel(false); setConfirm(null); }
  };

  return (
    <div className="page anim-slide-up">
      <div className="page-header">
        <div>
          <h2 className="page-title">Kelola Admin</h2>
          <p className="page-subtitle">Tambah, edit, atau hapus akun admin</p>
        </div>
        <Button variant="primary" onClick={openCreate} id="btn-tambah-admin">+ Tambah Admin</Button>
      </div>

      {/* Admin Cards Grid */}
      {loading ? (
        <div className="admin-grid">{[1,2,3].map((i) => <div key={i} className="dash-skeleton" style={{ height: 140, borderRadius: 'var(--r-xl)' }} />)}</div>
      ) : admins.length === 0 ? (
        <Card><p className="text-muted text-center" style={{ padding: '32px 0' }}>Belum ada data admin.</p></Card>
      ) : (
        <div className="admin-grid">
          {admins.map((admin) => (
            <Card key={admin.id} hover className="admin-card">
              <div className="admin-card-header">
                <div className="admin-avatar">{admin.nama?.[0]?.toUpperCase() || 'A'}</div>
                <div className="admin-info">
                  <h4 className="admin-name">{admin.nama}</h4>
                  <p className="admin-email">{admin.email}</p>
                </div>
                <Badge status={admin.role} />
              </div>
              <p className="admin-created">Terdaftar: {formatDateTime(admin.created_at)}</p>
              <div className="admin-card-actions">
                <Button size="sm" variant="ghost" onClick={() => openEdit(admin)}>Edit</Button>
                {admin.id !== user?.id && (
                  <Button size="sm" variant="danger" onClick={() => setConfirm(admin)}>Hapus</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)}
        title={editing ? 'Edit Admin' : 'Tambah Admin Baru'}
        footer={<>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            {editing ? 'Simpan' : 'Tambah'}
          </Button>
        </>}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          <Input id="admin-nama" label="Nama" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} error={errors.nama} placeholder="Nama Admin" icon="👤" />
          <Input id="admin-email" label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} placeholder="admin@pcu.ac.id" icon="✉️" />
          {!editing && (
            <Input id="admin-password" label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} placeholder="Min. 6 karakter" icon="🔒" />
          )}
          <Select id="admin-role" label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} icon="🔑"
            options={ADMIN_ROLES.map((r) => ({ value: r, label: r === 'super_admin' ? 'Super Admin' : 'Admin' }))} />
        </form>
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={handleDelete} loading={deleting}
        title="Hapus Admin" message={`Yakin ingin menghapus admin "${confirm?.nama}"? Akun ini tidak dapat dipulihkan.`} />
    </div>
  );
}

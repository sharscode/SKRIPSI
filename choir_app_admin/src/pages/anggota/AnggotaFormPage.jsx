import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../config/api';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { BAGIAN_SUARA } from '../../utils/constants';

export default function AnggotaFormPage() {
  const { id } = useParams();
  const isEdit  = !!id;
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nrp:'', nama_lengkap:'', bagian_suara:'', email:'', kontak:'', alamat:'', password:'', tanggal_lahir:'', jurusan:'' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      api.get(`/anggota/${id}`)
        .then((r) => {
          const data = r.data.data;
          if (data.tanggal_lahir) {
            data.tanggal_lahir = data.tanggal_lahir.split('T')[0];
          } else {
            data.tanggal_lahir = '';
          }
          setForm({ ...data, password: '' });
        })
        .catch(() => toast('Gagal memuat data.', 'error'));
    }
  }, [id]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const err = {};
    if (!form.nrp) err.nrp = 'NRP wajib diisi.';
    if (!form.nama_lengkap) err.nama_lengkap = 'Nama wajib diisi.';
    if (!form.bagian_suara) err.bagian_suara = 'Bagian suara wajib dipilih.';
    if (!form.email) err.email = 'Email wajib diisi.';
    if (!form.kontak) err.kontak = 'Kontak wajib diisi.';
    if (!isEdit && !form.password) err.password = 'Password wajib diisi saat membuat anggota baru.';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = { ...form };
      if (isEdit) delete payload.password;
      if (isEdit) { await api.put(`/anggota/${id}`, payload); toast('Anggota berhasil diperbarui.'); }
      else { await api.post('/anggota', payload); toast('Anggota berhasil ditambahkan.'); }
      navigate('/anggota');
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal menyimpan data.', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="page anim-slide-up">
      <div className="page-header">
        <div>
          <h2 className="page-title">{isEdit ? 'Edit Anggota' : 'Tambah Anggota'}</h2>
          <p className="page-subtitle">Lengkapi data anggota paduan suara</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/anggota')}>← Kembali</Button>
      </div>

      <div className="form-container">
        <div className="form-card">
          <form onSubmit={handleSubmit} id="anggota-form" className="form-grid">
            
            <div className="form-section-box">
              <div className="form-section-title-box">👤 Informasi Profil</div>
              
              <Input 
                id="nrp" 
                label="NRP" 
                value={form.nrp} 
                onChange={set('nrp')} 
                error={errors.nrp} 
                disabled={isEdit} 
                placeholder="Input NRP"
                className="col-2"
                icon="🆔"
                required={!isEdit}
              />
              <Input 
                id="nama_lengkap" 
                label="Nama Lengkap" 
                value={form.nama_lengkap} 
                onChange={set('nama_lengkap')} 
                error={errors.nama_lengkap} 
                placeholder="Input Nama Lengkap"
                className="col-4"
                icon="👤"
                required
              />
              <Select 
                id="bagian_suara" 
                label="Bagian Suara" 
                value={form.bagian_suara} 
                onChange={set('bagian_suara')} 
                error={errors.bagian_suara} 
                placeholder="Pilih suara..."
                options={BAGIAN_SUARA.map(s => ({ value: s, label: s.charAt(0).toUpperCase()+s.slice(1) }))} 
                className="col-2"
                icon="🎵"
                required
              />
              <Input 
                id="jurusan" 
                label="Jurusan" 
                value={form.jurusan} 
                onChange={set('jurusan')} 
                error={errors.jurusan} 
                placeholder="Input Jurusan"
                className="col-2"
                icon="🎓"
              />
              <Input 
                id="tanggal_lahir" 
                label="Tanggal Lahir" 
                type="date"
                value={form.tanggal_lahir} 
                onChange={set('tanggal_lahir')} 
                error={errors.tanggal_lahir} 
                className="col-2"
                icon="📅"
              />
            </div>

            <div className="form-section-box">
              <div className="form-section-title-box">📞 Kontak & Alamat</div>
              
              <Input 
                id="email" 
                label="Email" 
                type="email" 
                value={form.email} 
                onChange={set('email')} 
                error={errors.email} 
                placeholder="Input Email"
                className="col-3"
                icon="✉️"
                required
              />
              <Input 
                id="kontak" 
                label="No. Telepon" 
                value={form.kontak} 
                onChange={set('kontak')} 
                error={errors.kontak} 
                placeholder="Input No. Telepon"
                className="col-3"
                icon="📞"
                required
              />
              <Input 
                id="alamat" 
                label="Alamat" 
                value={form.alamat} 
                onChange={set('alamat')} 
                placeholder="Input Alamat"
                className="col-6"
                icon="🏠"
              />
            </div>

            {!isEdit && (
              <div className="form-section-box">
                <div className="form-section-title-box">🔒 Keamanan</div>
                
                <Input 
                  id="password" 
                  label="Password" 
                  type="password" 
                  value={form.password} 
                  onChange={set('password')} 
                  error={errors.password} 
                  placeholder="Min. 6 karakter" 
                  className="col-3"
                  icon="🔒"
                  required={!isEdit}
                />
              </div>
            )}

            <div className="form-actions-row">
              <Button variant="secondary" type="button" onClick={() => navigate('/anggota')}>Batal</Button>
              <Button variant="primary" type="submit" loading={loading} id="btn-save-anggota">
                {isEdit ? 'Simpan Perubahan' : 'Tambah Anggota'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

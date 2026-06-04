import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../config/api';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

export default function AcaraFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nama_acara: '', tanggal: '', jenis_kegiatan: '', lokasi: '',
    penyelenggara: '', penanggung_jawab: '', jenis_skkk: '',
  });
  const [errors, setErrors] = useState({});
  const [customJenisKegiatan, setCustomJenisKegiatan] = useState('');

  useEffect(() => {
    if (isEdit) {
      api.get(`/acara/${id}`)
        .then((r) => {
          const d = r.data.data;
          const presetOptions = ['Konser', 'Lomba', 'Festival', 'Perayaan', 'Workshop', 'Pentas Seni'];
          if (presetOptions.includes(d.jenis_kegiatan)) {
            setForm({
              nama_acara: d.nama_acara, tanggal: d.tanggal?.split('T')[0] || d.tanggal,
              jenis_kegiatan: d.jenis_kegiatan, lokasi: d.lokasi,
              penyelenggara: d.penyelenggara, penanggung_jawab: d.penanggung_jawab,
              jenis_skkk: d.jenis_skkk,
            });
          } else {
            setForm({
              nama_acara: d.nama_acara, tanggal: d.tanggal?.split('T')[0] || d.tanggal,
              jenis_kegiatan: 'Lainnya', lokasi: d.lokasi,
              penyelenggara: d.penyelenggara, penanggung_jawab: d.penanggung_jawab,
              jenis_skkk: d.jenis_skkk,
            });
            setCustomJenisKegiatan(d.jenis_kegiatan || '');
          }
        })
        .catch(() => toast('Gagal memuat data acara.', 'error'));
    }
  }, [id]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const err = {};
    if (!form.nama_acara) err.nama_acara = 'Nama acara wajib diisi.';
    if (!form.tanggal) err.tanggal = 'Tanggal wajib diisi.';
    if (!form.jenis_kegiatan) err.jenis_kegiatan = 'Jenis kegiatan wajib dipilih.';
    if (form.jenis_kegiatan === 'Lainnya' && !customJenisKegiatan.trim()) {
      err.customJenisKegiatan = 'Silakan ketik jenis kegiatan manual.';
    }
    if (!form.lokasi) err.lokasi = 'Lokasi wajib diisi.';
    if (!form.penyelenggara) err.penyelenggara = 'Penyelenggara wajib diisi.';
    if (!form.penanggung_jawab) err.penanggung_jawab = 'Penanggung jawab wajib diisi.';
    if (!form.jenis_skkk) err.jenis_skkk = 'Jenis SKKK wajib dipilih.';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        jenis_kegiatan: form.jenis_kegiatan === 'Lainnya' ? customJenisKegiatan : form.jenis_kegiatan
      };
      if (isEdit) { await api.put(`/acara/${id}`, payload); toast('Acara berhasil diperbarui.'); }
      else { await api.post('/acara', payload); toast('Acara berhasil ditambahkan.'); }
      navigate('/acara');
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal menyimpan data acara.', 'error');
    } finally { setLoading(false); }
  };

  const jenisKegiatan = ['Konser', 'Lomba', 'Festival', 'Perayaan', 'Workshop', 'Pentas Seni', 'Lainnya'];
  const jenisSkkk = ['Bakat & Minat', 'Organisasi & Kepemimpinan', 'Penalaran', 'Pengabdian Masyarakat'];

  return (
    <div className="page anim-slide-up">
      <div className="page-header">
        <div>
          <h2 className="page-title">{isEdit ? 'Edit Acara' : 'Tambah Acara'}</h2>
          <p className="page-subtitle">Lengkapi informasi acara paduan suara</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/acara')}>← Kembali</Button>
      </div>

      <div className="form-container">
        <Card>
          <form onSubmit={handleSubmit} id="acara-form" className="form-grid">
            <div className="form-section-divider">Informasi Utama Acara</div>
            
            <Input 
              id="nama_acara" 
              label="Nama Acara" 
              value={form.nama_acara} 
              onChange={set('nama_acara')} 
              error={errors.nama_acara} 
              placeholder="Konser Natal 2025" 
              className="col-4"
              icon="🎵"
            />
            <Input 
              id="tanggal_acara" 
              label="Tanggal" 
              type="date" 
              value={form.tanggal} 
              onChange={set('tanggal')} 
              error={errors.tanggal} 
              className="col-2"
              icon="📅"
            />
            <Select 
              id="jenis_kegiatan" 
              label="Jenis Kegiatan" 
              placeholder="Pilih jenis..."
              options={jenisKegiatan.map((j) => ({ value: j, label: j }))}
              value={form.jenis_kegiatan} 
              onChange={set('jenis_kegiatan')} 
              error={errors.jenis_kegiatan} 
              className={form.jenis_kegiatan === 'Lainnya' ? "col-2" : "col-3"}
              icon="🎭"
            />
            {form.jenis_kegiatan === 'Lainnya' && (
              <Input 
                id="custom_jenis_kegiatan"
                label="Jenis Kegiatan Lainnya"
                value={customJenisKegiatan}
                onChange={(e) => setCustomJenisKegiatan(e.target.value)}
                error={errors.customJenisKegiatan}
                placeholder="Ketik jenis..."
                className="col-2"
                icon="✍️"
              />
            )}
            <Input 
              id="lokasi_acara" 
              label="Lokasi" 
              value={form.lokasi} 
              onChange={set('lokasi')} 
              error={errors.lokasi} 
              placeholder="Aula Universitas Petra" 
              className={form.jenis_kegiatan === 'Lainnya' ? "col-2" : "col-3"}
              icon="📍"
            />

            <div className="form-section-divider">Penyelenggara & Akademik</div>
            
            <Input 
              id="penyelenggara" 
              label="Penyelenggara" 
              value={form.penyelenggara} 
              onChange={set('penyelenggara')} 
              error={errors.penyelenggara} 
              placeholder="UKM Paduan Suara PCU" 
              className="col-3"
              icon="🏢"
            />
            <Input 
              id="penanggung_jawab" 
              label="Penanggung Jawab" 
              value={form.penanggung_jawab} 
              onChange={set('penanggung_jawab')} 
              error={errors.penanggung_jawab} 
              placeholder="Dr. Maria Susanti" 
              className="col-3"
              icon="👤"
            />
            <Select 
              id="jenis_skkk" 
              label="Jenis SKKK" 
              placeholder="Pilih jenis SKKK..."
              options={jenisSkkk.map((j) => ({ value: j, label: j }))}
              value={form.jenis_skkk} 
              onChange={set('jenis_skkk')} 
              error={errors.jenis_skkk} 
              className="col-6"
              icon="🎓"
            />

            <div className="form-actions-row">
              <Button variant="secondary" type="button" onClick={() => navigate('/acara')}>Batal</Button>
              <Button variant="primary" type="submit" loading={loading} id="btn-save-acara">
                {isEdit ? 'Simpan Perubahan' : 'Buat Acara'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

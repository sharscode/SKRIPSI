import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../config/api';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { formatDate } from '../../utils/formatDate';

export default function LatihanFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const toast = useToast();

  // Pre-fill event if passed in query params
  const searchParams = new URLSearchParams(window.location.search);
  const paramAcaraId = searchParams.get('acara_id');

  const [loading, setLoading]   = useState(false);
  const [acaraList, setAcaraList] = useState([]);
  const [form, setForm] = useState({
    tanggal: '', jam: '', lokasi: '', keterangan: '',
    tipe_latihan: paramAcaraId ? 'sekali' : 'rutin', waktu_notifikasi: 60, acara_id: paramAcaraId || '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    api.get('/acara').then((r) => setAcaraList(r.data.data.filter((a) => a.status === 'aktif'))).catch(() => {});
    if (isEdit) {
      api.get(`/latihan/${id}`).then((r) => {
        const d = r.data.data;
        setForm({
          tanggal: d.tanggal?.split('T')[0] || d.tanggal, jam: d.jam, lokasi: d.lokasi,
          keterangan: d.keterangan || '', tipe_latihan: d.tipe_latihan,
          waktu_notifikasi: d.waktu_notifikasi, acara_id: d.acara_id || '',
        });
      }).catch(() => toast('Gagal memuat data.', 'error'));
    }
  }, [id]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const err = {};
    if (!form.tanggal) err.tanggal = 'Tanggal wajib diisi.';
    if (!form.jam) err.jam = 'Jam wajib diisi.';
    if (!form.lokasi) err.lokasi = 'Lokasi wajib diisi.';
    if (!form.tipe_latihan) err.tipe_latihan = 'Tipe wajib dipilih.';
    if (form.tipe_latihan === 'sekali' && !form.acara_id) err.acara_id = 'Acara wajib dipilih untuk latihan sekali.';
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
        acara_id: form.tipe_latihan === 'rutin' ? null : (+form.acara_id || null),
        waktu_notifikasi: +form.waktu_notifikasi,
      };
      if (isEdit) { await api.put(`/latihan/${id}`, payload); toast('Latihan berhasil diperbarui.'); }
      else { await api.post('/latihan', payload); toast('Latihan berhasil ditambahkan.'); }
      navigate('/latihan');
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal menyimpan data.', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="page anim-slide-up">
      <div className="page-header">
        <div>
          <h2 className="page-title">{isEdit ? 'Edit Latihan' : 'Tambah Latihan'}</h2>
          <p className="page-subtitle">Atur jadwal latihan paduan suara</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/latihan')}>← Kembali</Button>
      </div>

      <div className="form-container">
        <Card>
          <form onSubmit={handleSubmit} id="latihan-form" className="form-grid">
            <div className="form-section-divider">Jadwal & Lokasi</div>
            
            <Input 
              id="tanggal_latihan" 
              label="Tanggal" 
              type="date" 
              value={form.tanggal} 
              onChange={set('tanggal')} 
              error={errors.tanggal} 
              className="col-3"
              icon="📅"
            />
            <Input 
              id="jam_latihan" 
              label="Jam" 
              type="time" 
              value={form.jam} 
              onChange={set('jam')} 
              error={errors.jam} 
              className="col-3"
              icon="🕒"
            />
            <Input 
              id="lokasi_latihan" 
              label="Lokasi" 
              value={form.lokasi} 
              onChange={set('lokasi')} 
              error={errors.lokasi} 
              placeholder="Ruang Musik Lt. 3" 
              className="col-6"
              icon="📍"
            />

            <div className="form-section-divider">Pengaturan Kegiatan</div>
            
            <Select 
              id="tipe_latihan" 
              label="Tipe Latihan" 
              value={form.tipe_latihan} 
              onChange={set('tipe_latihan')} 
              error={errors.tipe_latihan}
              options={[{ value: 'rutin', label: 'Rutin (UKM)' }, { value: 'sekali', label: 'Sekali (persiapan acara)' }]} 
              className="col-3"
              icon="⚙️"
            />
            {form.tipe_latihan === 'sekali' && (
              <Select 
                id="acara_latihan" 
                label="Untuk Acara" 
                placeholder="Pilih acara..."
                options={acaraList.map((a) => ({ value: a.id, label: `${a.nama_acara} - ${formatDate(a.tanggal, { day: 'numeric', month: 'short', year: 'numeric' })}` }))}
                value={form.acara_id} 
                onChange={set('acara_id')} 
                error={errors.acara_id} 
                className="col-3"
                icon="📅"
              />
            )}
            <Input 
              id="keterangan_latihan" 
              label="Keterangan (opsional)" 
              value={form.keterangan} 
              onChange={set('keterangan')} 
              placeholder="Catatan tambahan..." 
              className="col-4"
              icon="✏️"
            />
            <Input 
              id="waktu_notif" 
              label="Waktu Notifikasi (menit sebelumnya)" 
              type="number" 
              value={form.waktu_notifikasi} 
              onChange={set('waktu_notifikasi')} 
              className="col-2"
              icon="🔔"
            />

            <div className="form-actions-row">
              <Button variant="secondary" type="button" onClick={() => navigate('/latihan')}>Batal</Button>
              <Button variant="primary" type="submit" loading={loading} id="btn-save-latihan">
                {isEdit ? 'Simpan Perubahan' : 'Buat Latihan'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../config/api';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { formatDate } from '../../utils/formatDate';

export default function AcaraFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nama_acara: '', tanggal: '', jenis_kegiatan: '', lokasi: '',
    penyelenggara: '', penanggung_jawab: '', jenis_skkk: '',
    // Field kepala formulir SKKK BAKA. Diberi nilai bawaan yang paling umum
    // supaya pengurus tidak perlu menyentuhnya untuk acara biasa.
    jenis_kepanitiaan: 'Kurang dari 1 tahun', lingkup: 'Universitas',
    lembaga: '', jabatan_default: 'ANGGOTA UKM',
  });
  const [errors, setErrors] = useState({});
  const [customJenisKegiatan, setCustomJenisKegiatan] = useState('');
  // Peringatan nama acara kembar pada periode yang sama; null = tidak ada.
  const [kembarModal, setKembarModal] = useState(null);

  useEffect(() => {
    if (isEdit) {
      api.get(`/acara/${id}`)
        .then((r) => {
          const d = r.data.data;
          const presetOptions = ['Konser', 'Lomba', 'Festival', 'Perayaan', 'Workshop', 'Pentas Seni'];
          const isPreset = presetOptions.includes(d.jenis_kegiatan);
          setForm({
            nama_acara: d.nama_acara, tanggal: d.tanggal?.split('T')[0] || d.tanggal,
            jenis_kegiatan: isPreset ? d.jenis_kegiatan : 'Lainnya', lokasi: d.lokasi,
            penyelenggara: d.penyelenggara, penanggung_jawab: d.penanggung_jawab,
            jenis_skkk: d.jenis_skkk,
            jenis_kepanitiaan: d.jenis_kepanitiaan || 'Kurang dari 1 tahun',
            lingkup: d.lingkup || 'Universitas',
            lembaga: d.lembaga || '',
            jabatan_default: d.jabatan_default || 'ANGGOTA UKM',
          });
          if (!isPreset) setCustomJenisKegiatan(d.jenis_kegiatan || '');
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

  /**
   * @param {boolean} abaikanKembar - kirim ulang setelah admin menegaskan bahwa
   *   nama acara yang kembar di periode yang sama memang disengaja.
   */
  const simpan = async (abaikanKembar = false) => {
    setLoading(true);
    try {
      const payload = {
        ...form,
        jenis_kegiatan: form.jenis_kegiatan === 'Lainnya' ? customJenisKegiatan : form.jenis_kegiatan,
        ...(abaikanKembar ? { abaikan_kembar: true } : {}),
      };
      if (isEdit) { await api.put(`/acara/${id}`, payload); toast('Acara berhasil diperbarui.'); }
      else { await api.post('/acara', payload); toast('Acara berhasil ditambahkan.'); }
      setKembarModal(null);
      navigate('/acara');
    } catch (err) {
      const res = err.response?.data;
      // Nama kembar bukan kegagalan — tawarkan konfirmasi, jangan buang isian form.
      if (res?.code === 'NAMA_ACARA_KEMBAR') {
        setKembarModal({ pesan: res.message, acara: res.data || [] });
        return;
      }
      toast(res?.message || 'Gagal menyimpan data acara.', 'error');
    } finally { setLoading(false); }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    simpan(false);
  };

  const jenisKegiatan = ['Konser', 'Lomba', 'Festival', 'Perayaan', 'Workshop', 'Pentas Seni', 'Lainnya'];
  // Nilai-nilai di bawah ini disalin dari form entry SKKK Online BAKA,
  // supaya isi formulir yang dicetak tidak ditolak karena istilahnya beda.
  const jenisSkkk = [
    'Organisasi & Kepemimpinan', 'Pengabdian Masyarakat', 'Partisipasi/Prestasi',
    // Dua nilai berikut tidak tampak pada dropdown BAKA yang terlihat, tetapi
    // muncul pada formulir resmi yang sudah tercetak. Dipertahankan agar acara
    // lama yang memakainya tidak kehilangan nilainya.
    'Bakat & Minat', 'Penalaran',
  ];
  const jenisKepanitiaan = ['1 tahun', 'Kurang dari 1 tahun', 'Pengabdian Masyarakat'];
  const lingkupAcara = [
    'Internasional', 'Nasional', 'Regional', 'Surabaya', 'Universitas', 'Fakultas', 'Intern',
  ];
  const jabatanSkkk = [
    'KETUA', 'WAKIL KETUA', 'SEKRETARIS', 'BENDAHARA', 'KOORDINATOR DIVISI',
    'ANGGOTA KEPANITIAAN', 'PESERTA', 'KETUA UKM', 'SEKRETARIS/BENDAHARA UKM',
    'KOORDINATOR UKM', 'ANGGOTA UKM', 'PESERTA UKM',
    // Muncul pada formulir resmi yang sudah tercetak; daftar dropdown BAKA
    // kemungkinan masih berlanjut di bawah 'PESERTA UKM'.
    'PENGISI ACARA/PENGMAS 5ASPEK',
  ];

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
              placeholder="Input Nama Acara" 
              className="col-4"
              icon="🎵"
              required
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
              required
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
              required
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
                required
              />
            )}
            <Input 
              id="lokasi_acara" 
              label="Lokasi" 
              value={form.lokasi} 
              onChange={set('lokasi')} 
              error={errors.lokasi} 
              placeholder="Input Lokasi" 
              className={form.jenis_kegiatan === 'Lainnya' ? "col-2" : "col-3"}
              icon="📍"
              required
            />

            <div className="form-section-divider">Penyelenggara & Akademik</div>
            
            <Input 
              id="penyelenggara" 
              label="Penyelenggara" 
              value={form.penyelenggara} 
              onChange={set('penyelenggara')} 
              error={errors.penyelenggara} 
              placeholder="Input Penyelenggara" 
              className="col-3"
              icon="🏢"
              required
            />
            <Input 
              id="penanggung_jawab" 
              label="Penanggung Jawab" 
              value={form.penanggung_jawab} 
              onChange={set('penanggung_jawab')} 
              error={errors.penanggung_jawab} 
              placeholder="Input Penanggung Jawab" 
              className="col-3"
              icon="👤"
              required
            />
            <Select 
              id="jenis_skkk" 
              label="Jenis SKKK" 
              placeholder="Pilih jenis SKKK..."
              options={jenisSkkk.map((j) => ({ value: j, label: j }))}
              value={form.jenis_skkk}
              onChange={set('jenis_skkk')}
              error={errors.jenis_skkk}
              className="col-3"
              icon="🎓"
              required
            />

            <div className="form-section-divider">Formulir SKKK BAKA</div>
            <p className="form-section-hint">
              Field kepala pada Formulir Permohonan SKKK Online (F01-PM05-BAKA-UKP).
              Biarkan apa adanya untuk acara biasa. Jenis SKKK di atas tercetak sebagai kolom BIDANG.
            </p>

            <Select
              id="jenis_kepanitiaan"
              label="Jenis Kepanitiaan"
              options={jenisKepanitiaan.map((j) => ({ value: j, label: j }))}
              value={form.jenis_kepanitiaan}
              onChange={set('jenis_kepanitiaan')}
              className="col-2"
              icon="🗓️"
            />
            <Select
              id="lingkup"
              label="Lingkup"
              options={lingkupAcara.map((l) => ({ value: l, label: l }))}
              value={form.lingkup}
              onChange={set('lingkup')}
              className="col-2"
              icon="🌐"
            />
            <Input
              id="lembaga"
              label="Lembaga"
              value={form.lembaga}
              onChange={set('lembaga')}
              placeholder="Kosongkan = pakai bawaan sistem"
              className="col-2"
              icon="🏛️"
            />
            <Select
              id="jabatan_default"
              label="Jabatan Peserta"
              options={jabatanSkkk.map((j) => ({ value: j, label: j }))}
              value={form.jabatan_default}
              onChange={set('jabatan_default')}
              className="col-3"
              icon="🧑‍🤝‍🧑"
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

      {/* Peringatan: nama acara sudah dipakai pada periode yang sama */}
      <Modal
        open={!!kembarModal}
        onClose={() => setKembarModal(null)}
        title="Nama acara sudah dipakai"
        size="sm"
        footer={<>
          <Button variant="secondary" onClick={() => setKembarModal(null)}>Ubah Nama</Button>
          <Button variant="primary" onClick={() => simpan(true)} disabled={loading}>
            {loading ? 'Menyimpan…' : 'Tetap Simpan'}
          </Button>
        </>}
      >
        <div className="kembar-warn">
          <p>{kembarModal?.pesan}</p>
          <ul>
            {(kembarModal?.acara || []).map((a) => (
              <li key={a.id}>
                <strong>{a.nama_acara}</strong>
                <span>{formatDate(a.tanggal)} · {a.status}</span>
              </li>
            ))}
          </ul>
          <p className="kembar-warn-hint">
            Dua acara bernama sama pada periode yang sama mudah tertukar saat memilih
            di daftar, karena yang tampil hanya nama dan tanggal.
          </p>
        </div>
      </Modal>
    </div>
  );
}

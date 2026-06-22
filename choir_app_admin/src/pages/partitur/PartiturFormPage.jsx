import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../config/api';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import './PartiturFormPage.css';

export default function PartiturFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const toast = useToast();
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ judul: '', komposer: '', jumlah_suara: 4, jenis_lagu: '' });
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [errors, setErrors] = useState({});
  const [customJenis, setCustomJenis] = useState('');
  const [genres, setGenres] = useState(['Hymn', 'Klasik', 'Oratorio', 'Pop', 'Rohani', 'Nasional']);

  useEffect(() => {
    // Fetch unique custom genres from database
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

  useEffect(() => {
    if (isEdit) {
      api.get(`/partitur/${id}`).then((r) => {
        const d = r.data.data;
        const presetOptions = ['Hymn', 'Klasik', 'Oratorio', 'Pop', 'Rohani', 'Nasional'];
        if (presetOptions.includes(d.jenis_lagu)) {
          setForm({ judul: d.judul, komposer: d.komposer, jumlah_suara: d.jumlah_suara, jenis_lagu: d.jenis_lagu });
        } else {
          setForm({ judul: d.judul, komposer: d.komposer, jumlah_suara: d.jumlah_suara, jenis_lagu: d.jenis_lagu });
          setCustomJenis(d.jenis_lagu || '');
        }
        setFileName(d.file_pdf?.split('/').pop() || '');
      }).catch(() => toast('Gagal memuat data.', 'error'));
    }
  }, [id]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) {
      if (f.type !== 'application/pdf') { toast('Hanya file PDF yang diperbolehkan.', 'error'); return; }
      setFile(f);
      setFileName(f.name);
    }
  };

  const validate = () => {
    const err = {};
    if (!form.judul) err.judul = 'Judul wajib diisi.';
    if (!form.komposer) err.komposer = 'Komposer wajib diisi.';
    if (!form.jenis_lagu) err.jenis_lagu = 'Jenis lagu wajib dipilih.';
    if (form.jenis_lagu === 'Lainnya' && !customJenis.trim()) {
      err.customJenis = 'Silakan ketik jenis lagu manual.';
    }
    if (!isEdit && !file) err.file = 'File PDF wajib diunggah.';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('judul', form.judul);
      formData.append('komposer', form.komposer);
      formData.append('jumlah_suara', form.jumlah_suara);
      formData.append('jenis_lagu', form.jenis_lagu === 'Lainnya' ? customJenis : form.jenis_lagu);
      if (file) formData.append('file', file);

      if (isEdit) { await api.put(`/partitur/${id}`, formData); toast('Partitur berhasil diperbarui.'); }
      else { await api.post('/partitur', formData); toast('Partitur berhasil diunggah.'); }
      navigate('/partitur');
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal menyimpan partitur.', 'error');
    } finally { setLoading(false); }
  };

  const jenisOptions = [...genres, 'Lainnya'];

  return (
    <div className="page anim-slide-up">
      <div className="page-header">
        <div>
          <h2 className="page-title">{isEdit ? 'Edit Partitur' : 'Upload Partitur'}</h2>
          <p className="page-subtitle">Upload file PDF partitur lagu</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/partitur')}>← Kembali</Button>
      </div>

      <div className="form-container">
        <Card>
          <form onSubmit={handleSubmit} id="partitur-form" className="form-grid">
            <div className="form-section-divider">Informasi Lagu</div>
            
            <Input 
              id="judul_partitur" 
              label="Judul Lagu" 
              value={form.judul} 
              onChange={set('judul')} 
              error={errors.judul} 
              placeholder="Amazing Grace" 
              className="col-4"
              icon="🎵"
            />
            <Input 
              id="komposer" 
              label="Komposer/Aransir" 
              value={form.komposer} 
              onChange={set('komposer')} 
              error={errors.komposer} 
              placeholder="John Newton" 
              className="col-2"
              icon="👤"
            />
            <Input 
              id="jumlah_suara" 
              label="Jumlah Suara" 
              type="number" 
              min="1" 
              max="8" 
              value={form.jumlah_suara} 
              onChange={set('jumlah_suara')} 
              className={form.jenis_lagu === 'Lainnya' ? "col-2" : "col-3"}
              icon="🎶"
            />
            <Select 
              id="jenis_lagu" 
              label="Jenis Lagu" 
              placeholder="Pilih jenis..."
              options={jenisOptions.map((j) => ({ value: j, label: j }))}
              value={form.jenis_lagu} 
              onChange={set('jenis_lagu')} 
              error={errors.jenis_lagu} 
              className={form.jenis_lagu === 'Lainnya' ? "col-2" : "col-3"}
              icon="🎼"
            />
            {form.jenis_lagu === 'Lainnya' && (
              <Input
                id="custom_jenis_lagu"
                label="Jenis Lagu Lainnya"
                value={customJenis}
                onChange={(e) => setCustomJenis(e.target.value)}
                error={errors.customJenis}
                placeholder="Ketik jenis..."
                className="col-2"
                icon="✍️"
              />
            )}

            <div className="form-section-divider">File Partitur</div>
            
            <div className="col-6">
              <label className="input-label" htmlFor="file_partitur">File PDF {isEdit && '(kosongkan jika tidak berubah)'}</label>
              <div className="file-upload-area" onClick={() => fileRef.current?.click()}>
                <input type="file" accept=".pdf" ref={fileRef} onChange={handleFile} hidden id="file_partitur" />
                <div className="file-upload-content">
                  {fileName ? (
                    <><span className="file-icon">📄</span><span className="file-name">{fileName}</span><span className="file-action">Ganti file</span></>
                  ) : (
                    <><span className="file-icon">📤</span><span className="file-name">Klik untuk upload file PDF</span></>
                  )}
                </div>
              </div>
              {errors.file && <p style={{ color: 'var(--c-danger)', fontSize: 'var(--text-xs)', marginTop: 4 }}>{errors.file}</p>}
            </div>

            <div className="form-actions-row">
              <Button variant="secondary" type="button" onClick={() => navigate('/partitur')}>Batal</Button>
              <Button variant="primary" type="submit" loading={loading} id="btn-save-partitur">
                {isEdit ? 'Simpan Perubahan' : 'Upload Partitur'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

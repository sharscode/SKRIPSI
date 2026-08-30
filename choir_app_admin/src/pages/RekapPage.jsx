import { useEffect, useState } from 'react';
import api from '../config/api';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import { useToast } from '../components/ui/Toast';
import { formatDate } from '../utils/formatDate';
import './RekapPage.css';

export default function RekapPage() {
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDl] = useState(false);
  const toast = useToast();

  useEffect(() => {
    api.get('/acara').then((r) => {
      setEvents(r.data.data.filter((e) => e.status === 'selesai' || e.status === 'aktif'));
    }).catch(() => {});
  }, []);

  const loadPreview = async (id) => {
    if (!id) { setPreview(null); return; }
    setSelected(id);
    setLoading(true);
    try {
      const res = await api.get(`/rekap/${id}/preview`);
      setPreview(res.data.data);
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal memuat preview rekap.', 'error');
      setPreview(null);
    } finally { setLoading(false); }
  };

  const downloadPdf = async () => {
    setDl(true);
    try {
      const res = await api.get(`/rekap/${selected}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `Rekap_${preview?.event?.nama_acara?.replace(/\s+/g, '_') || 'kegiatan'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast('PDF rekap berhasil didownload.');
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal download PDF.', 'error');
    } finally { setDl(false); }
  };

  return (
    <div className="page anim-slide-up">
      <div className="page-header">
        <div>
          <h2 className="page-title">Rekap Kegiatan</h2>
          <p className="page-subtitle">Laporan rekap detail kegiatan beserta anggota dan partitur</p>
        </div>
      </div>

      <Card>
        <div style={{ display: 'flex', gap: 'var(--sp-4)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Select id="rekap-acara" label="Pilih Acara" placeholder="Pilih acara..."
            options={events.map((e) => ({ value: e.id, label: `${e.nama_acara} (${formatDate(e.tanggal, { month: 'short' })})` }))}
            value={selected} onChange={(e) => loadPreview(e.target.value)}
            className="filter-search" />
          {preview && (
            <Button variant="primary" onClick={downloadPdf} loading={downloading} id="btn-download-rekap">
              📥 Download PDF
            </Button>
          )}
        </div>
      </Card>

      {loading && (
        <Card>
          <div className="dash-skeleton" style={{ height: 200, borderRadius: 'var(--r-lg)' }} />
        </Card>
      )}

      {preview && !loading && (
        <>
          {/* Event Summary */}
          <Card className="rekap-summary" style={{ padding: 'var(--sp-5)', marginBottom: 'var(--sp-4)' }}>
            <h3 className="rekap-event-title">{preview.event.nama_acara}</h3>
            <div className="rekap-meta">
              <span>📅 {formatDate(preview.event.tanggal)}</span>
              <span>📍 {preview.event.lokasi || '—'}</span>
              <span>🏢 {preview.event.penyelenggara}</span>
              <span>👤 PJ: {preview.event.penanggung_jawab}</span>
              <span>📋 {preview.event.jenis_skkk}</span>
              <span>🎵 Total Latihan: <strong>{preview.totalLatihan}</strong></span>
            </div>
          </Card>

          {/* Voice Distribution */}
          <h4 className="rekap-section-title">🎶 Distribusi Anggota per Suara</h4>
          <div className="rekap-voice-grid">
            <div className="rekap-voice-card sopran">
              <div className="label">Sopran</div>
              <div className="count">{preview.voiceCounts.sopran}</div>
            </div>
            <div className="rekap-voice-card alto">
              <div className="label">Alto</div>
              <div className="count">{preview.voiceCounts.alto}</div>
            </div>
            <div className="rekap-voice-card tenor">
              <div className="label">Tenor</div>
              <div className="count">{preview.voiceCounts.tenor}</div>
            </div>
            <div className="rekap-voice-card bass">
              <div className="label">Bass</div>
              <div className="count">{preview.voiceCounts.bass}</div>
            </div>
            <div className="rekap-voice-card total">
              <div className="label">Total</div>
              <div className="count">{preview.voiceCounts.total}</div>
            </div>
          </div>

          {/* Participants Table */}
          <h4 className="rekap-section-title">👥 Daftar Anggota Peserta</h4>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>NRP</th>
                  <th>Nama Lengkap</th>
                  <th>Bagian Suara</th>
                </tr>
              </thead>
              <tbody>
                {preview.participants.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-muted" style={{ padding: 'var(--sp-8) 0' }}>
                      Tidak ada peserta yang disetujui.
                    </td>
                  </tr>
                ) : (
                  preview.participants.map((p, i) => (
                    <tr key={p.id}>
                      <td>{i + 1}</td>
                      <td>{p.nrp}</td>
                      <td><strong>{p.nama_lengkap}</strong></td>
                      <td><Badge status={p.bagian_suara} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Partitur List */}
          <h4 className="rekap-section-title" style={{ marginTop: 'var(--sp-5)' }}>🎼 Partitur Lagu yang Digunakan</h4>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Judul Lagu</th>
                  <th>Komposer / Arranger</th>
                  <th>Jenis</th>
                  <th>Jumlah Suara</th>
                </tr>
              </thead>
              <tbody>
                {preview.partiturList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted" style={{ padding: 'var(--sp-8) 0' }}>
                      Belum ada partitur yang dikaitkan dengan kegiatan ini.
                    </td>
                  </tr>
                ) : (
                  preview.partiturList.map((pt, i) => (
                    <tr key={pt.id}>
                      <td>{i + 1}</td>
                      <td><strong>{pt.judul}</strong></td>
                      <td>{pt.komposer}</td>
                      <td><Badge status={pt.jenis_lagu} /></td>
                      <td>{pt.jumlah_suara} suara</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Evaluasi Kegiatan — hanya bila admin sudah mengisinya */}
          {preview.evaluasi && (
            <>
              <h4 className="rekap-section-title">📝 Evaluasi Kegiatan</h4>
              <Card className="rekap-eval" style={{ padding: 'var(--sp-5)', marginBottom: 'var(--sp-4)' }}>
                {preview.evaluasi.skor != null && (
                  <p className="rekap-eval-score">
                    Penilaian: <strong>{preview.evaluasi.skor}</strong> dari 5
                  </p>
                )}
                <div className="rekap-eval-block">
                  <span className="rekap-eval-label">Catatan</span>
                  <p className="rekap-eval-text">{preview.evaluasi.catatan}</p>
                </div>
                {preview.evaluasi.kendala && (
                  <div className="rekap-eval-block">
                    <span className="rekap-eval-label">Kendala</span>
                    <p className="rekap-eval-text">{preview.evaluasi.kendala}</p>
                  </div>
                )}
                {preview.evaluasi.saran && (
                  <div className="rekap-eval-block">
                    <span className="rekap-eval-label">Saran Perbaikan</span>
                    <p className="rekap-eval-text">{preview.evaluasi.saran}</p>
                  </div>
                )}
              </Card>
            </>
          )}

        </>
      )}
    </div>
  );
}

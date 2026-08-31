import { useEffect, useState } from 'react';
import api from '../config/api';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import { useToast } from '../components/ui/Toast';
import { formatDate } from '../utils/formatDate';
import './SkkkPage.css';

export default function SkkkPage() {
  const [events, setEvents]   = useState([]);
  const [selected, setSelected] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDl]  = useState(false);
  const [excludedIds, setExcludedIds] = useState([]);
  const [menandai, setMenandai] = useState(false);
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
    setExcludedIds([]);
    try {
      const res = await api.get(`/skkk/${id}/preview`);
      setPreview(res.data.data);
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal memuat preview SKKK.', 'error');
      setPreview(null);
    } finally { setLoading(false); }
  };

  const toggleExclude = (id) => {
    setExcludedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleToggleAll = () => {
    if (!preview) return;
    const allIds = preview.participants.map((p) => p.id);
    const allSelected = excludedIds.length === 0;
    if (allSelected) {
      setExcludedIds(allIds);
    } else {
      setExcludedIds([]);
    }
  };

  /**
   * Tandai SKKK acara ini sudah diajukan ke BAKA, atau batalkan penandaannya.
   * Selama belum ditandai, acara ini tetap muncul di pengingat Dashboard.
   */
  const toggleDiajukan = async () => {
    const sudah = !!preview?.event?.skkk_diajukan_at;
    setMenandai(true);
    try {
      await api.put(`/skkk/${selected}/diajukan`, { diajukan: !sudah });
      toast(sudah ? 'Penandaan dibatalkan.' : 'SKKK ditandai sudah diajukan.');
      await loadPreview(selected);
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal memperbarui penandaan.', 'error');
    } finally { setMenandai(false); }
  };

  const downloadPdf = async () => {
    setDl(true);
    try {
      const urlParams = excludedIds.length > 0 ? `?exclude=${excludedIds.join(',')}` : '';
      const res = await api.get(`/skkk/${selected}/download${urlParams}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `SKKK_${preview?.event?.nama_acara?.replace(/\s+/g, '_') || 'report'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast('PDF berhasil didownload.');
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal download PDF.', 'error');
    } finally { setDl(false); }
  };

  return (
    <div className="page anim-slide-up">
      <div className="page-header">
        <div>
          <h2 className="page-title">Laporan SKKK</h2>
          <p className="page-subtitle">Generate laporan SKKK kehadiran berdasarkan acara</p>
        </div>
      </div>

      <Card>
        <div style={{ display: 'flex', gap: 'var(--sp-4)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Select id="skkk-acara" label="Pilih Acara" placeholder="Pilih acara..."
            options={events.map((e) => ({ value: e.id, label: `${e.nama_acara} (${formatDate(e.tanggal, { month: 'short' })})` }))}
            value={selected} onChange={(e) => loadPreview(e.target.value)}
            className="filter-search" />
          {preview && (
            <Button variant="primary" onClick={downloadPdf} loading={downloading} id="btn-download-skkk">
              📥 Download PDF
            </Button>
          )}
          {preview && preview.event.status === 'selesai' && (
            <Button
              variant={preview.event.skkk_diajukan_at ? 'secondary' : 'primary'}
              onClick={toggleDiajukan}
              loading={menandai}
              id="btn-tandai-skkk"
            >
              {preview.event.skkk_diajukan_at ? '↺ Batalkan Penandaan' : '✓ Tandai Sudah Diajukan'}
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
          <Card className="skkk-summary" style={{ padding: 'var(--sp-5)', marginBottom: 'var(--sp-4)' }}>
            <h3 className="skkk-event-title">{preview.event.nama_acara}</h3>
            <div className="skkk-meta">
              <span>📅 {formatDate(preview.event.tanggal)}</span>
              <span>📍 {preview.event.lokasi || '—'}</span>
              <span>🏢 {preview.event.penyelenggara}</span>
              <span>📋 {preview.event.jenis_skkk}</span>
              <span>🎵 Total Latihan: <strong>{preview.total_latihan}</strong></span>
              <span>👥 Anggota Terpilih: <strong>{preview.participants.length - excludedIds.length}</strong> dari <strong>{preview.participants.length}</strong></span>
              <span>✅ Memenuhi syarat (≥{preview.min_kehadiran}%): <strong>{preview.jumlah_memenuhi}</strong></span>
              <span>📤 Pengajuan: <strong>{preview.event.skkk_diajukan_at ? `Sudah diajukan ${formatDate(preview.event.skkk_diajukan_at)}` : "Belum diajukan"}</strong></span>
            </div>
          </Card>

          {/* Participants Table */}
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={preview && preview.participants.length > 0 && excludedIds.length === 0}
                      onChange={handleToggleAll}
                    />
                  </th>
                  <th>No</th>
                  <th>NRP</th>
                  <th>Nama</th>
                  <th>Suara</th>
                  <th>Hadir</th>
                  <th>Total</th>
                  <th>% Kehadiran</th>
                  <th>Syarat SKKK</th>
                </tr>
              </thead>
              <tbody>
                {preview.participants.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center text-muted" style={{ padding: 'var(--sp-8) 0' }}>
                      Tidak ada peserta yang disetujui.
                    </td>
                  </tr>
                ) : (
                  preview.participants.map((p, i) => {
                    const isChecked = !excludedIds.includes(p.id);
                    return (
                      <tr key={p.id} style={{ opacity: isChecked ? 1 : 0.5, transition: 'opacity 0.2s ease' }}>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleExclude(p.id)}
                          />
                        </td>
                        <td>{i + 1}</td>
                        <td>{p.nrp}</td>
                        <td><strong>{p.nama_lengkap}</strong></td>
                        <td><Badge status={p.bagian_suara} /></td>
                        <td>{p.hadir}</td>
                        <td>{p.total_latihan}</td>
                        <td>
                          {/* Warna mengikuti ambang yang berlaku, bukan angka tetap,
                              supaya tidak bertentangan dengan penilaian syarat. */}
                          <span style={{
                            fontWeight: 700,
                            color: p.memenuhi_syarat ? 'var(--c-success)' : 'var(--c-danger)',
                          }}>
                            {p.persentase}%
                          </span>
                        </td>
                        <td>
                          <Badge
                            status={p.memenuhi_syarat ? 'aktif' : 'ditolak'}
                            label={p.memenuhi_syarat ? 'Memenuhi' : 'Belum'}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

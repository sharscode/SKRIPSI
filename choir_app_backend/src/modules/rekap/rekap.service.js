/**
 * Rekap Kegiatan Service — Activity Summary Report Generator
 * Compiles event data, participant roster grouped by voice part,
 * linked partitur (scores), and total latihan count.
 */
const { getPool, sql } = require('../../config/db');
const { generateRekapPdf } = require('../../utils/rekapPdfGenerator');

/**
 * Get rekap data: event details, participants per voice part, partitur list, total latihan.
 */
async function getPreview(acara_id) {
  const pool = await getPool();

  // 1. Event details
  const eventResult = await pool.request()
    .input('id', sql.Int, acara_id)
    .query('SELECT * FROM acara WHERE id = @id');

  if (!eventResult.recordset[0]) {
    throw { statusCode: 404, message: 'Acara tidak ditemukan.' };
  }
  const event = eventResult.recordset[0];

  // 2. Total latihan for this event
  const latihanResult = await pool.request()
    .input('acara_id', sql.Int, acara_id)
    .query('SELECT COUNT(*) AS total FROM latihan WHERE acara_id = @acara_id');
  const totalLatihan = latihanResult.recordset[0].total;

  // 3. Approved participants ordered by voice part
  const participantsResult = await pool.request()
    .input('acara_id', sql.Int, acara_id)
    .query(`
      SELECT
        a.id, a.nrp, a.nama_lengkap, a.bagian_suara, a.jurusan
      FROM peserta_acara pa
      JOIN anggota a ON pa.anggota_id = a.id
      WHERE pa.acara_id = @acara_id AND pa.approval_status = 'disetujui'
      ORDER BY 
        CASE a.bagian_suara
          WHEN 'sopran' THEN 1
          WHEN 'alto' THEN 2
          WHEN 'tenor' THEN 3
          WHEN 'bass' THEN 4
          ELSE 5
        END,
        a.nama_lengkap ASC
    `);
  const participants = participantsResult.recordset;

  // 4. Voice part counts
  const voiceCounts = {
    sopran: participants.filter(p => p.bagian_suara === 'sopran').length,
    alto: participants.filter(p => p.bagian_suara === 'alto').length,
    tenor: participants.filter(p => p.bagian_suara === 'tenor').length,
    bass: participants.filter(p => p.bagian_suara === 'bass').length,
    total: participants.length,
  };

  // 5. Linked partitur (scores) for this event
  const partiturResult = await pool.request()
    .input('acara_id', sql.Int, acara_id)
    .query(`
      SELECT p.id, p.judul, p.komposer, p.jumlah_suara, p.jenis_lagu
      FROM acara_partitur ap
      JOIN partitur p ON ap.partitur_id = p.id
      WHERE ap.acara_id = @acara_id
      ORDER BY p.judul ASC
    `);
  const partiturList = partiturResult.recordset;

  // 6. Evaluasi kegiatan (null bila acara belum dievaluasi)
  const evaluasiResult = await pool.request()
    .input('acara_id', sql.Int, acara_id)
    .query(`
      SELECT e.skor, e.catatan, e.kendala, e.saran, e.created_at, ad.nama AS nama_admin
      FROM acara_evaluasi e
      LEFT JOIN admin ad ON ad.id = e.created_by
      WHERE e.acara_id = @acara_id
    `);
  const evaluasi = evaluasiResult.recordset[0] || null;

  return {
    event: {
      ...event,
      tanggal: event.tanggal?.toISOString?.()?.split('T')[0] || event.tanggal,
    },
    participants,
    voiceCounts,
    partiturList,
    totalLatihan,
    evaluasi,
  };
}

/**
 * Generate Rekap PDF document stream.
 */
async function generatePdf(acara_id) {
  const data = await getPreview(acara_id);
  return generateRekapPdf(data);
}

module.exports = { getPreview, generatePdf };

/**
 * SKKK Service — Attendance Certificate Report Generator
 * Compiles event data with per-member attendance statistics and generates PDF.
 */
const { getPool, sql } = require('../../config/db');
const { generateSkkkPdf } = require('../../utils/pdfGenerator');

/**
 * Get preview data for SKKK report: event details + participant attendance stats.
 * Uses parameterized queries (no string interpolation) for safety.
 */
async function getPreview(acara_id, excludeMemberIds = []) {
  const pool = await getPool();

  // 1. Get event data
  const eventResult = await pool.request()
    .input('id', sql.Int, acara_id)
    .query('SELECT * FROM acara WHERE id = @id');

  if (!eventResult.recordset[0]) {
    throw { statusCode: 404, message: 'Acara tidak ditemukan.' };
  }
  const event = eventResult.recordset[0];

  // 2. Get total latihan count for this event
  const latihanResult = await pool.request()
    .input('acara_id', sql.Int, acara_id)
    .query('SELECT COUNT(*) AS total FROM latihan WHERE acara_id = @acara_id');
  const totalLatihan = latihanResult.recordset[0].total;

  // 3. Get participants with attendance stats
  const participantsResult = await pool.request()
    .input('acara_id', sql.Int, acara_id)
    .query(`
      SELECT
        a.id, a.nrp, a.nama_lengkap, a.bagian_suara,
        (SELECT COUNT(*) FROM latihan WHERE acara_id = @acara_id) AS total_latihan,
        ISNULL(
          (SELECT COUNT(*) FROM absensi ab
           JOIN latihan l ON ab.latihan_id = l.id
           WHERE l.acara_id = @acara_id AND ab.anggota_id = a.id AND ab.status = 'hadir'), 0
        ) AS hadir,
        CASE
          WHEN (SELECT COUNT(*) FROM latihan WHERE acara_id = @acara_id) > 0
          THEN ROUND(
            ISNULL(
              (SELECT COUNT(*) FROM absensi ab
               JOIN latihan l ON ab.latihan_id = l.id
               WHERE l.acara_id = @acara_id AND ab.anggota_id = a.id AND ab.status = 'hadir'), 0
            ) * 100.0 / (SELECT COUNT(*) FROM latihan WHERE acara_id = @acara_id), 1)
          ELSE 0
        END AS persentase
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

  let participants = participantsResult.recordset;
  if (excludeMemberIds && excludeMemberIds.length > 0) {
    const excludeSet = new Set(excludeMemberIds.map(id => +id));
    participants = participants.filter(p => !excludeSet.has(p.id));
  }

  return {
    event: {
      ...event,
      tanggal: event.tanggal?.toISOString?.()?.split('T')[0] || event.tanggal,
    },
    participants: participants,
    total_latihan: totalLatihan,
  };
}

/**
 * Generate SKKK PDF document stream.
 */
async function generatePdf(acara_id, excludeMemberIds = []) {
  const data = await getPreview(acara_id, excludeMemberIds);
  return generateSkkkPdf(data);
}

module.exports = { getPreview, generatePdf };

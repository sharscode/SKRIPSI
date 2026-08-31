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

  // 4. Nilai kelayakan terhadap ambang kehadiran minimum.
  // Tanpa ini sistem hanya menyajikan angka persentase dan pengurus masih
  // harus memilah sendiri siapa yang layak diajukan — titik di mana orang lupa.
  const minKehadiran = await getMinKehadiran();
  participants = participants.map((p) => ({
    ...p,
    memenuhi_syarat: Number(p.persentase) >= minKehadiran,
  }));

  return {
    event: {
      ...event,
      tanggal: event.tanggal?.toISOString?.()?.split('T')[0] || event.tanggal,
    },
    participants: participants,
    total_latihan: totalLatihan,
    min_kehadiran: minKehadiran,
    jumlah_memenuhi: participants.filter((p) => p.memenuhi_syarat).length,
  };
}

/**
 * Ambang kehadiran minimum (persen) agar seorang anggota layak diajukan SKKK.
 * Disimpan di settings supaya bisa diubah tanpa menyentuh kode.
 * @returns {Promise<number>}
 */
async function getMinKehadiran() {
  const pool = await getPool();
  const result = await pool.request()
    .query("SELECT setting_value FROM settings WHERE setting_key = 'min_kehadiran_skkk'");
  const nilai = Number(result.recordset[0]?.setting_value);
  return Number.isFinite(nilai) ? nilai : 75;
}

/**
 * Generate SKKK PDF document stream.
 */
async function generatePdf(acara_id, excludeMemberIds = []) {
  const data = await getPreview(acara_id, excludeMemberIds);
  return generateSkkkPdf(data);
}

/**
 * Acara selesai yang sudah punya anggota memenuhi syarat SKKK
 * tetapi pengajuannya belum ditandai.
 *
 * Menjawab keluhan utama dari BAKA: pengurus sering lupa mengajukan SKKK
 * sehingga staf BAKA yang harus menagih. Sistem sudah memegang data
 * kehadiran, jadi seharusnya sistem yang mengingatkan, bukan sebaliknya.
 */
async function getBelumDiajukan() {
  const pool = await getPool();
  const minKehadiran = await getMinKehadiran();

  const result = await pool.request()
    .input('min', sql.Decimal(5, 1), minKehadiran)
    .query(`
      SELECT
        a.id, a.nama_acara, a.tanggal, a.jenis_kegiatan, a.jenis_skkk,
        stat.jumlah_memenuhi
      FROM acara a
      CROSS APPLY (
        SELECT COUNT(*) AS jumlah_memenuhi
        FROM peserta_acara pa
        WHERE pa.acara_id = a.id
          AND pa.approval_status = 'disetujui'
          AND (
            SELECT CASE WHEN COUNT(l.id) = 0 THEN 0
                        ELSE ROUND(SUM(CASE WHEN ab.status = 'hadir' THEN 1.0 ELSE 0 END)
                                   * 100.0 / COUNT(l.id), 1)
                   END
            FROM latihan l
            LEFT JOIN absensi ab ON ab.latihan_id = l.id AND ab.anggota_id = pa.anggota_id
            WHERE l.acara_id = a.id
          ) >= @min
      ) AS stat
      WHERE a.status = 'selesai'
        AND a.skkk_diajukan_at IS NULL
        AND stat.jumlah_memenuhi > 0
      ORDER BY a.tanggal DESC
    `);

  return { min_kehadiran: minKehadiran, acara: result.recordset };
}

/**
 * Tandai SKKK sebuah acara sudah diajukan ke BAKA (atau batalkan penandaan).
 */
async function setDiajukan(acara_id, sudah, adminId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, acara_id)
    .input('by', sql.Int, sudah ? adminId : null)
    .query(`
      UPDATE acara
      SET skkk_diajukan_at = ${sudah ? 'GETDATE()' : 'NULL'}, skkk_diajukan_by = @by
      WHERE id = @id
    `);

  if (result.rowsAffected[0] === 0) {
    throw { statusCode: 404, message: 'Acara tidak ditemukan.' };
  }
}

module.exports = { getPreview, generatePdf, getBelumDiajukan, setDiajukan, getMinKehadiran };

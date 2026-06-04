/**
 * Absensi Service — Attendance Management
 * Handles QR scan check-in, manual status updates, and attendance statistics.
 */
const { getPool, sql } = require('../../config/db');

/**
 * Process QR code scan for attendance check-in.
 * Validates QR token, checks expiry, verifies event participation,
 * prevents duplicate check-in, and records attendance.
 */
async function scanQR({ qr_token, anggota_id }) {
  const pool = await getPool();

  // 1. Find latihan by QR token
  const latihanResult = await pool.request()
    .input('token', sql.VarChar, qr_token)
    .query('SELECT id, tipe_latihan, acara_id, qr_expired_at FROM latihan WHERE qr_token = @token');

  if (!latihanResult.recordset[0]) {
    throw { statusCode: 400, message: 'QR code tidak valid.' };
  }
  const latihan = latihanResult.recordset[0];

  // 2. Check expiry
  if (new Date() > new Date(latihan.qr_expired_at)) {
    throw { statusCode: 400, message: 'QR code sudah kedaluwarsa. Minta admin untuk generate ulang.' };
  }

  // 3. For 'sekali' latihan linked to event: verify member is approved participant
  if (latihan.tipe_latihan === 'sekali' && latihan.acara_id) {
    const peserta = await pool.request()
      .input('anggota_id', sql.Int, anggota_id)
      .input('acara_id', sql.Int, latihan.acara_id)
      .query("SELECT id FROM peserta_acara WHERE anggota_id = @anggota_id AND acara_id = @acara_id AND approval_status = 'disetujui'");

    if (!peserta.recordset[0]) {
      throw { statusCode: 403, message: 'Anda tidak terdaftar sebagai peserta acara ini.' };
    }
  }

  // 4. Check for existing attendance record
  const existing = await pool.request()
    .input('latihan_id', sql.Int, latihan.id)
    .input('anggota_id', sql.Int, anggota_id)
    .query('SELECT id, status FROM absensi WHERE latihan_id = @latihan_id AND anggota_id = @anggota_id');

  if (existing.recordset[0]) {
    if (existing.recordset[0].status === 'hadir') {
      throw { statusCode: 409, message: 'Anda sudah melakukan absensi untuk latihan ini.' };
    }
    // Update existing record (alpha/izin/sakit → hadir)
    await pool.request()
      .input('latihan_id', sql.Int, latihan.id)
      .input('anggota_id', sql.Int, anggota_id)
      .input('qr_token', sql.VarChar, qr_token)
      .query("UPDATE absensi SET status = 'hadir', waktu_checkin = GETDATE(), qr_token = @qr_token WHERE latihan_id = @latihan_id AND anggota_id = @anggota_id");
  } else {
    // Insert new attendance record
    await pool.request()
      .input('latihan_id', sql.Int, latihan.id)
      .input('anggota_id', sql.Int, anggota_id)
      .input('qr_token', sql.VarChar, qr_token)
      .query("INSERT INTO absensi (status, waktu_checkin, qr_token, latihan_id, anggota_id) VALUES ('hadir', GETDATE(), @qr_token, @latihan_id, @anggota_id)");
  }

  return { latihan_id: latihan.id, waktu_checkin: new Date() };
}

/**
 * Upsert attendance status (admin manual override).
 * Creates record if not exists, updates if exists.
 */
async function upsertStatus({ latihan_id, anggota_id, status }) {
  const pool = await getPool();
  const existing = await pool.request()
    .input('latihan_id', sql.Int, latihan_id)
    .input('anggota_id', sql.Int, anggota_id)
    .query('SELECT id FROM absensi WHERE latihan_id = @latihan_id AND anggota_id = @anggota_id');

  if (existing.recordset[0]) {
    await pool.request()
      .input('latihan_id', sql.Int, latihan_id)
      .input('anggota_id', sql.Int, anggota_id)
      .input('status', sql.VarChar, status)
      .query('UPDATE absensi SET status = @status WHERE latihan_id = @latihan_id AND anggota_id = @anggota_id');
  } else {
    await pool.request()
      .input('latihan_id', sql.Int, latihan_id)
      .input('anggota_id', sql.Int, anggota_id)
      .input('status', sql.VarChar, status)
      .query('INSERT INTO absensi (status, latihan_id, anggota_id) VALUES (@status, @latihan_id, @anggota_id)');
  }
}

/**
 * Get attendance records for a specific latihan session.
 */
async function getByLatihan(latihan_id) {
  const pool = await getPool();
  
  // Get latihan details
  const latihanResult = await pool.request()
    .input('latihan_id', sql.Int, latihan_id)
    .query('SELECT tipe_latihan, acara_id FROM latihan WHERE id = @latihan_id');
  const latihan = latihanResult.recordset[0];
  if (!latihan) throw { statusCode: 404, message: 'Latihan tidak ditemukan.' };

  const { tipe_latihan, acara_id } = latihan;
  let queryStr = '';
  const request = pool.request().input('latihan_id', sql.Int, latihan_id);

  if (tipe_latihan === 'rutin') {
    queryStr = `
      SELECT ISNULL(ab.id, -a.id) AS id, ISNULL(ab.status, 'alpha') AS status, ab.waktu_checkin,
             a.id AS anggota_id, a.nrp, a.nama_lengkap, a.bagian_suara
      FROM anggota a
      JOIN anggota_ukm au ON a.id = au.anggota_id
      LEFT JOIN absensi ab ON ab.anggota_id = a.id AND ab.latihan_id = @latihan_id
      WHERE au.periode = (SELECT setting_value FROM settings WHERE setting_key = 'active_periode')
        AND au.status_keaktifan = 'aktif'
      ORDER BY 
        CASE a.bagian_suara
          WHEN 'sopran' THEN 1
          WHEN 'alto' THEN 2
          WHEN 'tenor' THEN 3
          WHEN 'bass' THEN 4
          ELSE 5
        END,
        a.nama_lengkap ASC
    `;
  } else if (tipe_latihan === 'sekali' && acara_id) {
    request.input('acara_id', sql.Int, acara_id);
    queryStr = `
      SELECT ISNULL(ab.id, -a.id) AS id, ISNULL(ab.status, 'alpha') AS status, ab.waktu_checkin,
             a.id AS anggota_id, a.nrp, a.nama_lengkap, a.bagian_suara
      FROM peserta_acara pa
      JOIN anggota a ON pa.anggota_id = a.id
      LEFT JOIN absensi ab ON ab.anggota_id = a.id AND ab.latihan_id = @latihan_id
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
    `;
  } else {
    queryStr = `
      SELECT ab.id, ab.status, ab.waktu_checkin,
             a.id AS anggota_id, a.nrp, a.nama_lengkap, a.bagian_suara
      FROM absensi ab
      JOIN anggota a ON ab.anggota_id = a.id
      WHERE ab.latihan_id = @latihan_id
      ORDER BY 
        CASE a.bagian_suara
          WHEN 'sopran' THEN 1
          WHEN 'alto' THEN 2
          WHEN 'tenor' THEN 3
          WHEN 'bass' THEN 4
          ELSE 5
        END,
        a.nama_lengkap ASC
    `;
  }

  const result = await request.query(queryStr);
  return result.recordset;
}

/**
 * Get attendance history for a specific member.
 */
async function getByAnggota(anggota_id) {
  const pool = await getPool();
  const result = await pool.request()
    .input('anggota_id', sql.Int, anggota_id)
    .query(`
      SELECT ab.id, ab.status, ab.waktu_checkin,
             l.id AS latihan_id, l.tanggal, l.jam, l.lokasi, l.tipe_latihan,
             ac.nama_acara
      FROM absensi ab
      JOIN latihan l ON ab.latihan_id = l.id
      LEFT JOIN acara ac ON l.acara_id = ac.id
      WHERE ab.anggota_id = @anggota_id
      ORDER BY l.tanggal DESC
    `);
  return result.recordset;
}

/**
 * Get attendance statistics per member for a specific event.
 * Uses a proper JOIN between peserta_acara and latihan (not CROSS JOIN).
 */
async function getStatsByAcara(acara_id) {
  const pool = await getPool();
  const result = await pool.request()
    .input('acara_id', sql.Int, acara_id)
    .query(`
      SELECT
        a.id, a.nrp, a.nama_lengkap, a.bagian_suara,
        (SELECT COUNT(*) FROM latihan WHERE acara_id = @acara_id) AS total_latihan,
        ISNULL(SUM(CASE WHEN ab.status = 'hadir' THEN 1 ELSE 0 END), 0) AS hadir,
        ISNULL(SUM(CASE WHEN ab.status = 'izin'  THEN 1 ELSE 0 END), 0) AS izin,
        ISNULL(SUM(CASE WHEN ab.status = 'sakit' THEN 1 ELSE 0 END), 0) AS sakit,
        ISNULL(SUM(CASE WHEN ab.status = 'alpha' THEN 1 ELSE 0 END), 0) AS alpha,
        CASE
          WHEN (SELECT COUNT(*) FROM latihan WHERE acara_id = @acara_id) > 0
          THEN ROUND(
            ISNULL(SUM(CASE WHEN ab.status = 'hadir' THEN 1.0 ELSE 0 END), 0)
            / (SELECT COUNT(*) FROM latihan WHERE acara_id = @acara_id) * 100, 1
          )
          ELSE 0
        END AS persentase
      FROM peserta_acara pa
      JOIN anggota a ON pa.anggota_id = a.id
      LEFT JOIN latihan l ON l.acara_id = @acara_id
      LEFT JOIN absensi ab ON ab.latihan_id = l.id AND ab.anggota_id = a.id
      WHERE pa.acara_id = @acara_id AND pa.approval_status = 'disetujui'
      GROUP BY a.id, a.nrp, a.nama_lengkap, a.bagian_suara
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
  return result.recordset;
}

module.exports = { scanQR, upsertStatus, getByLatihan, getByAnggota, getStatsByAcara };

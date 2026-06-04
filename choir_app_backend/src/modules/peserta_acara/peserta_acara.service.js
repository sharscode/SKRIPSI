const { getPool, sql } = require('../../config/db');

async function getByAcara(acara_id) {
  const pool = await getPool();
  const result = await pool.request().input('acara_id', sql.Int, acara_id).query(`
    SELECT pa.id, pa.status_peserta, pa.approval_status, pa.alasan_perubahan, pa.alasan_reject, pa.created_at,
           a.id as anggota_id, a.nrp, a.nama_lengkap, a.bagian_suara, a.email, a.kontak
    FROM peserta_acara pa JOIN anggota a ON pa.anggota_id = a.id
    WHERE pa.acara_id = @acara_id ORDER BY 
      CASE pa.status_peserta
        WHEN 'ikut' THEN 1
        WHEN 'batal' THEN 2
        ELSE 3
      END ASC,
      CASE a.bagian_suara
        WHEN 'sopran' THEN 1
        WHEN 'alto' THEN 2
        WHEN 'tenor' THEN 3
        WHEN 'bass' THEN 4
        ELSE 5
      END ASC,
      a.nama_lengkap ASC
  `);
  return result.recordset;
}

async function getByAnggota(anggota_id) {
  const pool = await getPool();
  const result = await pool.request().input('anggota_id', sql.Int, anggota_id).query(`
    SELECT pa.id, pa.status_peserta, pa.approval_status, pa.alasan_perubahan, pa.alasan_reject, pa.created_at,
           ac.id as acara_id, ac.nama_acara, ac.tanggal, ac.lokasi, ac.status as status_acara
    FROM peserta_acara pa JOIN acara ac ON pa.acara_id = ac.id
    WHERE pa.anggota_id = @anggota_id ORDER BY ac.tanggal DESC
  `);
  return result.recordset;
}

async function selfRegister(anggota_id, acara_id) {
  const pool = await getPool();
  const acara = await pool.request().input('id', sql.Int, acara_id)
    .query("SELECT status, created_by FROM acara WHERE id=@id");
  if (!acara.recordset[0]) throw { statusCode: 404, message: 'Acara tidak ditemukan.' };
  if (acara.recordset[0].status !== 'aktif') throw { statusCode: 400, message: 'Acara tidak dalam status aktif.' };
  const defaultAdminId = acara.recordset[0].created_by;

  const dup = await pool.request().input('a', sql.Int, anggota_id).input('ac', sql.Int, acara_id)
    .query('SELECT id FROM peserta_acara WHERE anggota_id=@a AND acara_id=@ac');
  if (dup.recordset.length > 0) throw { statusCode: 409, message: 'Anda sudah terdaftar pada acara ini.' };
  await pool.request().input('anggota_id', sql.Int, anggota_id).input('acara_id', sql.Int, acara_id).input('approved_by', sql.Int, defaultAdminId)
    .query('INSERT INTO peserta_acara (anggota_id, acara_id, approved_by) VALUES (@anggota_id, @acara_id, @approved_by)');
}

async function manualRegister(anggota_id, acara_id, adminId) {
  const pool = await getPool();
  const dup = await pool.request().input('a', sql.Int, anggota_id).input('ac', sql.Int, acara_id)
    .query('SELECT id FROM peserta_acara WHERE anggota_id=@a AND acara_id=@ac');
  if (dup.recordset.length > 0) throw { statusCode: 409, message: 'Anggota sudah terdaftar pada acara ini.' };
  await pool.request().input('anggota_id', sql.Int, anggota_id).input('acara_id', sql.Int, acara_id).input('approved_by', sql.Int, adminId)
    .query("INSERT INTO peserta_acara (anggota_id, acara_id, approval_status, status_peserta, approved_by) VALUES (@anggota_id, @acara_id, 'disetujui', 'ikut', @approved_by)");

  // Sync to existing 'sekali' practice sessions for this event
  const latihanResult = await pool.request().input('acara_id', sql.Int, acara_id)
    .query("SELECT id FROM latihan WHERE acara_id = @acara_id AND tipe_latihan = 'sekali'");
  const latihanIds = latihanResult.recordset.map(r => r.id);
  for (const latId of latihanIds) {
    await pool.request()
      .input('latihan_id', sql.Int, latId)
      .input('anggota_id', sql.Int, anggota_id)
      .query(`
        IF NOT EXISTS (SELECT id FROM absensi WHERE latihan_id = @latihan_id AND anggota_id = @anggota_id)
        INSERT INTO absensi (status, latihan_id, anggota_id) VALUES ('alpha', @latihan_id, @anggota_id)
      `);
  }
}

async function updateApproval(id, { approval_status, alasan_reject }, adminId) {
  const pool = await getPool();
  let query = 'UPDATE peserta_acara SET approval_status=@approval_status, alasan_reject=@alasan, approved_by=@approved_by';
  if (approval_status === 'disetujui') {
    query += ", status_peserta='ikut'";
  } else if (approval_status === 'ditolak') {
    query += ", status_peserta=NULL";
  }
  query += ' WHERE id=@id';

  await pool.request().input('id', sql.Int, id)
    .input('approval_status', sql.VarChar, approval_status)
    .input('alasan', sql.VarChar, alasan_reject || null)
    .input('approved_by', sql.Int, adminId)
    .query(query);

  // Get participant details to sync absensi
  const participantResult = await pool.request().input('id', sql.Int, id)
    .query("SELECT anggota_id, acara_id FROM peserta_acara WHERE id = @id");
  const participant = participantResult.recordset[0];
  if (participant) {
    const { anggota_id, acara_id } = participant;
    const latihanResult = await pool.request().input('acara_id', sql.Int, acara_id)
      .query("SELECT id FROM latihan WHERE acara_id = @acara_id AND tipe_latihan = 'sekali'");
    const latihanIds = latihanResult.recordset.map(r => r.id);

    if (latihanIds.length > 0) {
      if (approval_status === 'disetujui') {
        for (const latId of latihanIds) {
          await pool.request()
            .input('latihan_id', sql.Int, latId)
            .input('anggota_id', sql.Int, anggota_id)
            .query(`
              IF NOT EXISTS (SELECT id FROM absensi WHERE latihan_id = @latihan_id AND anggota_id = @anggota_id)
              INSERT INTO absensi (status, latihan_id, anggota_id) VALUES ('alpha', @latihan_id, @anggota_id)
            `);
        }
      } else if (approval_status === 'ditolak') {
        const latIdString = latihanIds.join(',');
        await pool.request()
          .input('anggota_id', sql.Int, anggota_id)
          .query(`
            DELETE FROM absensi 
            WHERE anggota_id = @anggota_id 
              AND latihan_id IN (${latIdString})
          `);
      }
    }
  }
}

async function updateStatusPeserta(id, { status_peserta, alasan_perubahan }) {
  const pool = await getPool();
  await pool.request().input('id', sql.Int, id)
    .input('status', sql.VarChar, status_peserta)
    .input('alasan', sql.VarChar, alasan_perubahan || null)
    .query('UPDATE peserta_acara SET status_peserta=@status, alasan_perubahan=@alasan WHERE id=@id');
}

async function remove(id) {
  const pool = await getPool();
  // Get participant details before deletion to remove from absensi
  const participantResult = await pool.request().input('id', sql.Int, id)
    .query("SELECT anggota_id, acara_id FROM peserta_acara WHERE id = @id");
  const participant = participantResult.recordset[0];
  if (participant) {
    const { anggota_id, acara_id } = participant;
    const latihanResult = await pool.request().input('acara_id', sql.Int, acara_id)
      .query("SELECT id FROM latihan WHERE acara_id = @acara_id AND tipe_latihan = 'sekali'");
    const latihanIds = latihanResult.recordset.map(r => r.id);
    if (latihanIds.length > 0) {
      const latIdString = latihanIds.join(',');
      await pool.request()
        .input('anggota_id', sql.Int, anggota_id)
        .query(`
          DELETE FROM absensi 
          WHERE anggota_id = @anggota_id 
            AND latihan_id IN (${latIdString})
        `);
    }
  }
  await pool.request().input('id', sql.Int, id).query('DELETE FROM peserta_acara WHERE id=@id');
}

module.exports = { getByAcara, getByAnggota, selfRegister, manualRegister, updateApproval, updateStatusPeserta, remove };

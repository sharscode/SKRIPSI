const { getPool, sql } = require('../../config/db');

// The fixed "UKM" acara that every 'rutin' (Latihan UKM) session is tied to.
async function getUkmAcaraId() {
  const pool = await getPool();
  const result = await pool.request().query(
    `SELECT setting_value FROM settings WHERE setting_key = 'ukm_acara_id'`
  );
  const value = result.recordset[0]?.setting_value;
  return value ? +value : null;
}

async function getAll(query = {}) {
  const pool = await getPool();
  const req = pool.request();
  let whereClause = 'WHERE 1=1';

  if (query.exclude_partitur_id) {
    whereClause += ' AND a.id NOT IN (SELECT ap.acara_id FROM acara_partitur ap WHERE ap.partitur_id = @exclude_partitur_id)';
    req.input('exclude_partitur_id', sql.Int, +query.exclude_partitur_id);
  }

  if (query.status) {
    whereClause += ' AND a.status = @status';
    req.input('status', sql.VarChar, query.status);
  }

  const result = await req.query(`
    SELECT a.id, a.nama_acara, a.tanggal, a.jenis_kegiatan, a.lokasi, a.penyelenggara,
           a.penanggung_jawab, a.jenis_skkk, a.status, a.created_at,
           ad.nama AS created_by_nama,
           (SELECT COUNT(*) FROM latihan l WHERE l.acara_id = a.id) AS jumlah_latihan,
           (SELECT COUNT(*) FROM peserta_acara pa WHERE pa.acara_id = a.id AND pa.approval_status = 'disetujui') AS jumlah_peserta
    FROM acara a JOIN admin ad ON a.created_by = ad.id
    ${whereClause}
    ORDER BY 
      CASE a.status 
        WHEN 'aktif' THEN 1 
        WHEN 'selesai' THEN 2 
        WHEN 'dibatalkan' THEN 3 
        ELSE 4 
      END ASC, 
      a.tanggal DESC
  `);
  return result.recordset;
}

async function getById(id) {
  const pool = await getPool();
  const result = await pool.request().input('id', sql.Int, id).query(`
    SELECT a.*, ad.nama AS created_by_nama
    FROM acara a JOIN admin ad ON a.created_by = ad.id WHERE a.id = @id
  `);
  if (result.recordset.length === 0) throw { statusCode: 404, message: 'Acara tidak ditemukan.' };
  return result.recordset[0];
}

async function create(data, adminId) {
  if (data.nama_acara?.trim().toUpperCase() === 'UKM') {
    throw { statusCode: 400, message: 'Nama acara "UKM" sudah dipakai sebagai acuan Latihan UKM.' };
  }
  const pool = await getPool();
  const result = await pool.request()
    .input('nama_acara', sql.VarChar, data.nama_acara)
    .input('tanggal', sql.Date, data.tanggal)
    .input('jenis_kegiatan', sql.VarChar, data.jenis_kegiatan)
    .input('lokasi', sql.VarChar, data.lokasi)
    .input('penyelenggara', sql.VarChar, data.penyelenggara)
    .input('penanggung_jawab', sql.VarChar, data.penanggung_jawab)
    .input('jenis_skkk', sql.VarChar, data.jenis_skkk)
    .input('created_by', sql.Int, adminId)
    .query(`INSERT INTO acara (nama_acara, tanggal, jenis_kegiatan, lokasi, penyelenggara, penanggung_jawab, jenis_skkk, created_by)
            OUTPUT INSERTED.id VALUES (@nama_acara, @tanggal, @jenis_kegiatan, @lokasi, @penyelenggara, @penanggung_jawab, @jenis_skkk, @created_by)`);
  return getById(result.recordset[0].id);
}

async function update(id, data) {
  const existing = await getById(id);
  const ukmAcaraId = await getUkmAcaraId();
  if (id === ukmAcaraId && data.nama_acara !== existing.nama_acara) {
    throw { statusCode: 400, message: 'Acara "UKM" tidak boleh diganti namanya karena dijadikan acuan Latihan UKM.' };
  }
  const pool = await getPool();
  await pool.request()
    .input('id', sql.Int, id)
    .input('nama_acara', sql.VarChar, data.nama_acara)
    .input('tanggal', sql.Date, data.tanggal)
    .input('jenis_kegiatan', sql.VarChar, data.jenis_kegiatan)
    .input('lokasi', sql.VarChar, data.lokasi)
    .input('penyelenggara', sql.VarChar, data.penyelenggara)
    .input('penanggung_jawab', sql.VarChar, data.penanggung_jawab)
    .input('jenis_skkk', sql.VarChar, data.jenis_skkk)
    .query(`UPDATE acara SET nama_acara=@nama_acara, tanggal=@tanggal, jenis_kegiatan=@jenis_kegiatan,
              lokasi=@lokasi, penyelenggara=@penyelenggara, penanggung_jawab=@penanggung_jawab,
              jenis_skkk=@jenis_skkk WHERE id=@id`);
  return getById(id);
}

async function updateStatus(id, status) {
  await getById(id);
  const pool = await getPool();
  await pool.request().input('id', sql.Int, id).input('status', sql.VarChar, status)
    .query('UPDATE acara SET status=@status WHERE id=@id');
}

async function remove(id) {
  await getById(id);
  const ukmAcaraId = await getUkmAcaraId();
  if (id === ukmAcaraId) {
    throw { statusCode: 400, message: 'Acara "UKM" tidak dapat dihapus karena dijadikan acuan Latihan UKM.' };
  }
  const pool = await getPool();
  await pool.request().input('id', sql.Int, id).query('DELETE FROM acara WHERE id=@id');
}

module.exports = { getAll, getById, create, update, updateStatus, remove, getUkmAcaraId };

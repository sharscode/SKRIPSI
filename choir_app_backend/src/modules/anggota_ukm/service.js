/**
 * @module modules/anggota_ukm/service
 * @description Anggota UKM membership management business logic.
 */

const { getPool, sql } = require('../../config/db');

/**
 * List UKM memberships with filters.
 * @param {object} params - { periode, status_keaktifan, search }
 */
async function getAll({ periode, status_keaktifan, search }) {
  const pool = await getPool();
  const request = pool.request();

  let whereClause = 'WHERE 1=1';

  if (periode) {
    whereClause += ' AND au.periode = @periode';
    request.input('periode', sql.VarChar, periode);
  }

  if (status_keaktifan) {
    whereClause += ' AND au.status_keaktifan = @status_keaktifan';
    request.input('status_keaktifan', sql.VarChar, status_keaktifan);
  }

  if (search) {
    whereClause += ' AND a.nama_lengkap LIKE @search';
    request.input('search', sql.NVarChar, `%${search}%`);
  }

  const result = await request.query(`
    SELECT au.id, au.anggota_id, au.periode, au.status_keaktifan, au.tanggal_aktif, au.tanggal_nonaktif, au.updated_at,
           a.nrp, a.nama_lengkap, a.bagian_suara, a.email
    FROM anggota_ukm au
    JOIN anggota a ON a.id = au.anggota_id
    ${whereClause}
    ORDER BY au.id DESC
  `);

  return result.recordset;
}

/** Register member for a period */
async function create({ anggota_id, periode, tanggal_aktif }) {
  const pool = await getPool();

  // Check duplicate
  const dup = await pool.request()
    .input('anggota_id', sql.Int, anggota_id)
    .input('periode', sql.VarChar, periode)
    .query('SELECT id FROM anggota_ukm WHERE anggota_id = @anggota_id AND periode = @periode');

  if (dup.recordset.length > 0) {
    throw Object.assign(new Error('Anggota sudah terdaftar untuk periode ini'), { statusCode: 409 });
  }

  const result = await pool.request()
    .input('anggota_id', sql.Int, anggota_id)
    .input('periode', sql.VarChar, periode)
    .input('tanggal_aktif', sql.Date, tanggal_aktif || new Date())
    .query(`
      INSERT INTO anggota_ukm (anggota_id, periode, status_keaktifan, tanggal_aktif)
      OUTPUT INSERTED.*
      VALUES (@anggota_id, @periode, 'aktif', @tanggal_aktif)
    `);

  return result.recordset[0];
}

/** Toggle aktif/nonaktif status */
async function updateStatus(id, { status_keaktifan }) {
  const pool = await getPool();

  const tanggalNonaktif = status_keaktifan === 'nonaktif' ? new Date() : null;

  const result = await pool.request()
    .input('id', sql.Int, id)
    .input('status_keaktifan', sql.VarChar, status_keaktifan)
    .input('tanggal_nonaktif', sql.Date, tanggalNonaktif)
    .query(`
      UPDATE anggota_ukm
      SET status_keaktifan = @status_keaktifan, tanggal_nonaktif = @tanggal_nonaktif, updated_at = GETDATE()
      WHERE id = @id;
      SELECT * FROM anggota_ukm WHERE id = @id;
    `);

  if (result.recordset.length === 0) {
    throw Object.assign(new Error('Data anggota UKM tidak ditemukan'), { statusCode: 404 });
  }
  return result.recordset[0];
}

/** Get UKM history for a member */
async function getHistory(anggota_id) {
  const pool = await getPool();
  const result = await pool.request()
    .input('anggota_id', sql.Int, anggota_id)
    .query(`
      SELECT au.*, a.nrp, a.nama_lengkap
      FROM anggota_ukm au
      JOIN anggota a ON a.id = au.anggota_id
      WHERE au.anggota_id = @anggota_id
      ORDER BY au.periode DESC
    `);

  return result.recordset;
}

module.exports = { getAll, create, updateStatus, getHistory };

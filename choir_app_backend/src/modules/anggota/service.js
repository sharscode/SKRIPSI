/**
 * @module modules/anggota/service
 * @description Anggota (member) CRUD business logic.
 */

const bcrypt = require('bcryptjs');
const { getPool, sql } = require('../../config/db');

const SALT_ROUNDS = 12;

/**
 * List members with pagination, search, and filter.
 * @param {object} params - { page, limit, search, bagian_suara }
 */
async function getAll({ page = 1, limit = 10, search, bagian_suara }) {
  const pool = await getPool();
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE 1=1';
  const request = pool.request();

  if (search) {
    whereClause += ' AND (a.nama_lengkap LIKE @search OR a.nrp LIKE @search)';
    request.input('search', sql.NVarChar, `%${search}%`);
  }

  if (bagian_suara) {
    whereClause += ' AND a.bagian_suara = @bagian_suara';
    request.input('bagian_suara', sql.VarChar, bagian_suara);
  }

  request.input('limit', sql.Int, limit);
  request.input('offset', sql.Int, offset);

  const result = await request.query(`
    SELECT COUNT(*) AS total FROM anggota a ${whereClause};
    SELECT a.id, a.nrp, a.nama_lengkap, a.bagian_suara, a.alamat, a.kontak, a.email, a.foto_path, a.created_at, a.updated_at
    FROM anggota a
    ${whereClause}
    ORDER BY a.id
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
  `);

  const total = result.recordsets[0][0].total;
  const data = result.recordsets[1];

  return {
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/** Get member by ID */
async function getById(id) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT id, nrp, nama_lengkap, bagian_suara, alamat, kontak, email, foto_path, created_at, updated_at
      FROM anggota WHERE id = @id
    `);

  if (result.recordset.length === 0) {
    throw Object.assign(new Error('Anggota tidak ditemukan'), { statusCode: 404 });
  }
  return result.recordset[0];
}

/** Create a new member */
async function create({ nrp, nama_lengkap, bagian_suara, alamat, kontak, email, password }) {
  const pool = await getPool();

  // Check duplicate email
  const dupEmail = await pool.request()
    .input('email', sql.NVarChar, email)
    .query('SELECT id FROM anggota WHERE email = @email');
  if (dupEmail.recordset.length > 0) {
    throw Object.assign(new Error('Email sudah terdaftar'), { statusCode: 409 });
  }

  // Check duplicate NRP
  const dupNrp = await pool.request()
    .input('nrp', sql.VarChar, nrp)
    .query('SELECT id FROM anggota WHERE nrp = @nrp');
  if (dupNrp.recordset.length > 0) {
    throw Object.assign(new Error('NRP sudah terdaftar'), { statusCode: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await pool.request()
    .input('nrp', sql.VarChar, nrp)
    .input('nama_lengkap', sql.NVarChar, nama_lengkap)
    .input('bagian_suara', sql.VarChar, bagian_suara)
    .input('alamat', sql.NVarChar, alamat || null)
    .input('kontak', sql.VarChar, kontak || null)
    .input('email', sql.NVarChar, email)
    .input('password', sql.NVarChar, hashedPassword)
    .query(`
      INSERT INTO anggota (nrp, nama_lengkap, bagian_suara, alamat, kontak, email, password)
      OUTPUT INSERTED.id, INSERTED.nrp, INSERTED.nama_lengkap, INSERTED.bagian_suara, INSERTED.email, INSERTED.created_at
      VALUES (@nrp, @nama_lengkap, @bagian_suara, @alamat, @kontak, @email, @password)
    `);

  return result.recordset[0];
}

/** Update member (no password) */
async function update(id, { nrp, nama_lengkap, bagian_suara, alamat, kontak, email }) {
  const pool = await getPool();

  // Check email dup (exclude self)
  if (email) {
    const dup = await pool.request()
      .input('email', sql.NVarChar, email)
      .input('id', sql.Int, id)
      .query('SELECT id FROM anggota WHERE email = @email AND id != @id');
    if (dup.recordset.length > 0) {
      throw Object.assign(new Error('Email sudah digunakan anggota lain'), { statusCode: 409 });
    }
  }

  // Check NRP dup (exclude self)
  if (nrp) {
    const dup = await pool.request()
      .input('nrp', sql.VarChar, nrp)
      .input('id', sql.Int, id)
      .query('SELECT id FROM anggota WHERE nrp = @nrp AND id != @id');
    if (dup.recordset.length > 0) {
      throw Object.assign(new Error('NRP sudah digunakan anggota lain'), { statusCode: 409 });
    }
  }

  const result = await pool.request()
    .input('id', sql.Int, id)
    .input('nrp', sql.VarChar, nrp)
    .input('nama_lengkap', sql.NVarChar, nama_lengkap)
    .input('bagian_suara', sql.VarChar, bagian_suara)
    .input('alamat', sql.NVarChar, alamat || null)
    .input('kontak', sql.VarChar, kontak || null)
    .input('email', sql.NVarChar, email)
    .query(`
      UPDATE anggota
      SET nrp = @nrp, nama_lengkap = @nama_lengkap, bagian_suara = @bagian_suara,
          alamat = @alamat, kontak = @kontak, email = @email, updated_at = GETDATE()
      WHERE id = @id;
      SELECT id, nrp, nama_lengkap, bagian_suara, alamat, kontak, email, foto_path, updated_at
      FROM anggota WHERE id = @id;
    `);

  if (result.recordset.length === 0) {
    throw Object.assign(new Error('Anggota tidak ditemukan'), { statusCode: 404 });
  }
  return result.recordset[0];
}

/** Change password (verify old password first) */
async function changePassword(id, { oldPassword, newPassword }) {
  const pool = await getPool();

  const user = await pool.request()
    .input('id', sql.Int, id)
    .query('SELECT password FROM anggota WHERE id = @id');

  if (user.recordset.length === 0) {
    throw Object.assign(new Error('Anggota tidak ditemukan'), { statusCode: 404 });
  }

  const isMatch = await bcrypt.compare(oldPassword, user.recordset[0].password);
  if (!isMatch) {
    throw Object.assign(new Error('Password lama tidak sesuai'), { statusCode: 400 });
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await pool.request()
    .input('id', sql.Int, id)
    .input('password', sql.NVarChar, hashedPassword)
    .query('UPDATE anggota SET password = @password, updated_at = GETDATE() WHERE id = @id');
}

/** Delete member */
async function remove(id) {
  const pool = await getPool();

  // Check FK constraints (absensi, peserta_acara)
  const fkCheck = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT
        (SELECT COUNT(*) FROM absensi WHERE anggota_id = @id) +
        (SELECT COUNT(*) FROM peserta_acara WHERE anggota_id = @id) AS ref_count
    `);

  if (fkCheck.recordset[0].ref_count > 0) {
    throw Object.assign(new Error('Anggota tidak dapat dihapus karena memiliki data terkait (absensi/peserta acara)'), { statusCode: 400 });
  }

  const result = await pool.request()
    .input('id', sql.Int, id)
    .query('DELETE FROM anggota WHERE id = @id');

  if (result.rowsAffected[0] === 0) {
    throw Object.assign(new Error('Anggota tidak ditemukan'), { statusCode: 404 });
  }
}

module.exports = { getAll, getById, create, update, changePassword, remove };

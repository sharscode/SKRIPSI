/**
 * Anggota Service — Member CRUD operations
 */
const bcrypt = require('bcryptjs');
const { getPool, sql } = require('../../config/db');

async function getAll({ page = 1, limit = 10, search = '', bagian_suara = '' }) {
  const pool = await getPool();
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE 1=1';
  const request = pool.request();

  if (search) {
    whereClause += ' AND (nama_lengkap LIKE @search OR nrp LIKE @search)';
    request.input('search', sql.VarChar, `%${search}%`);
  }
  if (bagian_suara) {
    whereClause += ' AND bagian_suara = @bagian_suara';
    request.input('bagian_suara', sql.VarChar, bagian_suara);
  }

  const countResult = await request.query(
    `SELECT COUNT(*) as total FROM anggota ${whereClause}`
  );
  const total = countResult.recordset[0].total;

  const dataRequest = pool.request();
  if (search) dataRequest.input('search', sql.VarChar, `%${search}%`);
  if (bagian_suara) dataRequest.input('bagian_suara', sql.VarChar, bagian_suara);
  dataRequest.input('limit', sql.Int, limit);
  dataRequest.input('offset', sql.Int, offset);

  const result = await dataRequest.query(`
    SELECT id, nrp, nama_lengkap, bagian_suara, alamat, kontak, email, foto_path, tanggal_lahir, jurusan, created_at
    FROM anggota ${whereClause}
    ORDER BY 
      CASE bagian_suara
        WHEN 'sopran' THEN 1
        WHEN 'alto' THEN 2
        WHEN 'tenor' THEN 3
        WHEN 'bass' THEN 4
        ELSE 5
      END,
      nama_lengkap ASC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);

  return {
    data: result.recordset,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function getById(id) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`SELECT id, nrp, nama_lengkap, bagian_suara, alamat, kontak, email, foto_path, tanggal_lahir, jurusan, created_at
            FROM anggota WHERE id = @id`);

  if (result.recordset.length === 0) throw { statusCode: 404, message: 'Anggota tidak ditemukan.' };
  return result.recordset[0];
}

async function create({ nrp, nama_lengkap, bagian_suara, alamat, kontak, email, password, tanggal_lahir, jurusan }) {
  const pool = await getPool();

  // Check duplicates
  const dup = await pool.request()
    .input('email', sql.VarChar, email)
    .input('nrp', sql.VarChar, nrp)
    .query('SELECT id FROM anggota WHERE email = @email OR nrp = @nrp');
  if (dup.recordset.length > 0) throw { statusCode: 409, message: 'Email atau NRP sudah terdaftar.' };

  const hashed = await bcrypt.hash(password, 12);
  const result = await pool.request()
    .input('nrp', sql.VarChar, nrp)
    .input('nama_lengkap', sql.VarChar, nama_lengkap)
    .input('bagian_suara', sql.VarChar, bagian_suara)
    .input('alamat', sql.VarChar, alamat || null)
    .input('kontak', sql.VarChar, kontak)
    .input('email', sql.VarChar, email)
    .input('password', sql.VarChar, hashed)
    .input('tanggal_birth', sql.Date, tanggal_lahir || null) // use sql.Date for DATE types
    .input('jurusan', sql.VarChar, jurusan || null)
    .query(`INSERT INTO anggota (nrp, nama_lengkap, bagian_suara, alamat, kontak, email, password, tanggal_lahir, jurusan)
            OUTPUT INSERTED.id, INSERTED.nrp, INSERTED.nama_lengkap, INSERTED.email, INSERTED.tanggal_lahir, INSERTED.jurusan
            VALUES (@nrp, @nama_lengkap, @bagian_suara, @alamat, @kontak, @email, @password, @tanggal_birth, @jurusan)`);

  return result.recordset[0];
}

async function update(id, { nama_lengkap, bagian_suara, alamat, kontak, email, foto_path, tanggal_lahir, jurusan }) {
  const pool = await getPool();
  await getById(id);

  if (email) {
    const dup = await pool.request()
      .input('email', sql.VarChar, email)
      .input('id', sql.Int, id)
      .query('SELECT id FROM anggota WHERE email = @email AND id != @id');
    if (dup.recordset.length > 0) throw { statusCode: 409, message: 'Email sudah digunakan.' };
  }

  const request = pool.request()
    .input('id', sql.Int, id)
    .input('nama_lengkap', sql.VarChar, nama_lengkap !== undefined ? nama_lengkap : null)
    .input('bagian_suara', sql.VarChar, bagian_suara !== undefined ? bagian_suara : null)
    .input('alamat', sql.VarChar, alamat !== undefined ? (alamat || null) : null)
    .input('kontak', sql.VarChar, kontak !== undefined ? kontak : null)
    .input('email', sql.VarChar, email !== undefined ? email : null)
    .input('foto_path', sql.VarChar, foto_path !== undefined ? foto_path : null)
    .input('tanggal_birth', sql.Date, tanggal_lahir !== undefined ? (tanggal_lahir || null) : null)
    .input('jurusan', sql.VarChar, jurusan !== undefined ? (jurusan || null) : null);

  let query = `UPDATE anggota SET
                 nama_lengkap = COALESCE(@nama_lengkap, nama_lengkap),
                 bagian_suara = COALESCE(@bagian_suara, bagian_suara),
                 alamat = ${alamat !== undefined ? '@alamat' : 'alamat'},
                 kontak = COALESCE(@kontak, kontak),
                 email = COALESCE(@email, email),
                 foto_path = COALESCE(@foto_path, foto_path),
                 tanggal_lahir = ${tanggal_lahir !== undefined ? '@tanggal_birth' : 'tanggal_lahir'},
                 jurusan = ${jurusan !== undefined ? '@jurusan' : 'jurusan'},
                 updated_at = GETDATE()
               WHERE id = @id`;
  await request.query(query);

  return getById(id);
}

async function changePassword(id, { oldPassword, newPassword }) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query('SELECT password FROM anggota WHERE id = @id');

  if (result.recordset.length === 0) throw { statusCode: 404, message: 'Anggota tidak ditemukan.' };

  const isMatch = await bcrypt.compare(oldPassword, result.recordset[0].password);
  if (!isMatch) throw { statusCode: 400, message: 'Password lama tidak sesuai.' };

  const hashed = await bcrypt.hash(newPassword, 12);
  await pool.request()
    .input('id', sql.Int, id)
    .input('password', sql.VarChar, hashed)
    .query('UPDATE anggota SET password = @password, updated_at = GETDATE() WHERE id = @id');
}

async function remove(id) {
  await getById(id);
  const pool = await getPool();
  await pool.request().input('id', sql.Int, id).query('DELETE FROM anggota WHERE id = @id');
}

module.exports = { getAll, getById, create, update, changePassword, remove };

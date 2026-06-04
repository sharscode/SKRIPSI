/**
 * @module modules/admin/service
 * @description Admin CRUD business logic.
 */

const bcrypt = require('bcryptjs');
const { getPool, sql } = require('../../config/db');

const SALT_ROUNDS = 12;

/** Get all admins (exclude passwords) */
async function getAll() {
  const pool = await getPool();
  const result = await pool.request()
    .query(`
      SELECT id, nama, email, role, created_at, updated_at FROM admin 
      ORDER BY 
        CASE role
          WHEN 'super_admin' THEN 1
          WHEN 'admin' THEN 2
          ELSE 3
        END ASC,
        nama ASC
    `);
  return result.recordset;
}

/** Get admin by ID */
async function getById(id) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query('SELECT id, nama, email, role, created_at, updated_at FROM admin WHERE id = @id');

  if (result.recordset.length === 0) {
    throw Object.assign(new Error('Admin tidak ditemukan'), { statusCode: 404 });
  }
  return result.recordset[0];
}

/** Create a new admin */
async function create({ nama, email, password, role }) {
  const pool = await getPool();

  // Check duplicate email
  const dup = await pool.request()
    .input('email', sql.NVarChar, email)
    .query('SELECT id FROM admin WHERE email = @email');
  if (dup.recordset.length > 0) {
    throw Object.assign(new Error('Email sudah terdaftar'), { statusCode: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await pool.request()
    .input('nama', sql.NVarChar, nama)
    .input('email', sql.NVarChar, email)
    .input('password', sql.NVarChar, hashedPassword)
    .input('role', sql.VarChar, role)
    .query(`
      INSERT INTO admin (nama, email, password, role)
      OUTPUT INSERTED.id, INSERTED.nama, INSERTED.email, INSERTED.role, INSERTED.created_at
      VALUES (@nama, @email, @password, @role)
    `);

  return result.recordset[0];
}

/** Update admin (nama, email, role) */
async function update(id, { nama, email, role }) {
  const pool = await getPool();

  // Check email dup (exclude self)
  const dup = await pool.request()
    .input('email', sql.NVarChar, email)
    .input('id', sql.Int, id)
    .query('SELECT id FROM admin WHERE email = @email AND id != @id');
  if (dup.recordset.length > 0) {
    throw Object.assign(new Error('Email sudah digunakan admin lain'), { statusCode: 409 });
  }

  const result = await pool.request()
    .input('id', sql.Int, id)
    .input('nama', sql.NVarChar, nama)
    .input('email', sql.NVarChar, email)
    .input('role', sql.VarChar, role)
    .query(`
      UPDATE admin SET nama = @nama, email = @email, role = @role, updated_at = GETDATE()
      WHERE id = @id;
      SELECT id, nama, email, role, updated_at FROM admin WHERE id = @id;
    `);

  if (result.recordset.length === 0) {
    throw Object.assign(new Error('Admin tidak ditemukan'), { statusCode: 404 });
  }
  return result.recordset[0];
}

/** Delete admin by ID */
async function remove(id, requesterId) {
  if (id === requesterId) {
    throw Object.assign(new Error('Tidak dapat menghapus akun sendiri'), { statusCode: 400 });
  }

  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query('DELETE FROM admin WHERE id = @id');

  if (result.rowsAffected[0] === 0) {
    throw Object.assign(new Error('Admin tidak ditemukan'), { statusCode: 404 });
  }
}

module.exports = { getAll, getById, create, update, remove };

/**
 * @module modules/auth/service
 * @description Authentication business logic.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../../config/db');
const config = require('../../config/env');

/**
 * Authenticate admin by email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{accessToken: string, refreshToken: string, user: object}>}
 */
async function loginAdmin(email, password) {
  const pool = await getPool();
  const result = await pool.request()
    .input('email', sql.NVarChar, email)
    .query('SELECT id, nama, email, password, role FROM admin WHERE email = @email');

  if (result.recordset.length === 0) {
    throw Object.assign(new Error('Email atau password salah'), { statusCode: 401 });
  }

  const admin = result.recordset[0];
  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    throw Object.assign(new Error('Email atau password salah'), { statusCode: 401 });
  }

  const payload = { id: admin.id, email: admin.email, role: admin.role };
  const accessToken = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.accessExpiry });
  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiry });

  return {
    accessToken,
    refreshToken,
    user: { id: admin.id, nama: admin.nama, email: admin.email, role: admin.role },
  };
}

/**
 * Authenticate anggota by email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{accessToken: string, refreshToken: string, user: object}>}
 */
async function loginAnggota(email, password) {
  const pool = await getPool();
  const result = await pool.request()
    .input('email', sql.NVarChar, email)
    .query('SELECT id, nrp, nama_lengkap, email, password, bagian_suara, foto_path FROM anggota WHERE email = @email');

  if (result.recordset.length === 0) {
    throw Object.assign(new Error('Email atau password salah'), { statusCode: 401 });
  }

  const anggota = result.recordset[0];
  const isMatch = await bcrypt.compare(password, anggota.password);
  if (!isMatch) {
    throw Object.assign(new Error('Email atau password salah'), { statusCode: 401 });
  }

  const payload = { id: anggota.id, email: anggota.email, role: 'anggota' };
  const accessToken = jwt.sign(payload, config.jwt.secret, { expiresIn: '30d' });
  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiry });

  return {
    accessToken,
    refreshToken,
    user: {
      id: anggota.id,
      nrp: anggota.nrp,
      nama_lengkap: anggota.nama_lengkap,
      email: anggota.email,
      bagian_suara: anggota.bagian_suara,
      foto_path: anggota.foto_path,
      role: 'anggota',
    },
  };
}

/**
 * Refresh an access token using a valid refresh token.
 * @param {string} refreshToken
 * @returns {Promise<{accessToken: string}>}
 */
async function refreshAccessToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    const payload = { id: decoded.id, email: decoded.email, role: decoded.role };
    const accessToken = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.accessExpiry });
    return { accessToken };
  } catch {
    throw Object.assign(new Error('Refresh token tidak valid atau kedaluwarsa'), { statusCode: 401 });
  }
}

module.exports = { loginAdmin, loginAnggota, refreshAccessToken };

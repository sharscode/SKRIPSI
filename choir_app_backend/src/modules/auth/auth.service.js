/**
 * Auth Service — Login, Token Management
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../../config/db');
const config = require('../../config/env');

/**
 * Generate access and refresh tokens for a user.
 * @param {Object} user - { id, email, role }
 * @returns {{ accessToken: string, refreshToken: string }}
 */
function generateTokens(user) {
  const payload = { id: user.id, email: user.email, role: user.role };

  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiry,
  });

  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
  });

  return { accessToken, refreshToken };
}

/**
 * Admin login.
 * @param {string} email
 * @param {string} password
 * @returns {Object} { user, accessToken, refreshToken }
 */
async function loginAdmin(email, password) {
  const pool = await getPool();
  const result = await pool.request()
    .input('email', sql.VarChar, email)
    .query('SELECT id, nama, email, password, role FROM admin WHERE email = @email');

  if (result.recordset.length === 0) {
    throw { statusCode: 401, message: 'Email atau password salah.' };
  }

  const admin = result.recordset[0];
  const isMatch = await bcrypt.compare(password, admin.password);

  if (!isMatch) {
    throw { statusCode: 401, message: 'Email atau password salah.' };
  }

  const tokens = generateTokens({ id: admin.id, email: admin.email, role: admin.role });

  return {
    user: { id: admin.id, nama: admin.nama, email: admin.email, role: admin.role },
    ...tokens,
  };
}

/**
 * Member (anggota) login.
 * @param {string} email
 * @param {string} password
 * @returns {Object} { user, accessToken, refreshToken }
 */
async function loginAnggota(email, password) {
  const pool = await getPool();
  const result = await pool.request()
    .input('email', sql.VarChar, email)
    .query(`SELECT id, nrp, nama_lengkap, email, password, bagian_suara,
                   alamat, kontak, foto_path, tanggal_lahir, jurusan
            FROM anggota WHERE email = @email`);

  if (result.recordset.length === 0) {
    throw { statusCode: 401, message: 'Email atau password salah.' };
  }

  const anggota = result.recordset[0];
  const isMatch = await bcrypt.compare(password, anggota.password);

  if (!isMatch) {
    throw { statusCode: 401, message: 'Email atau password salah.' };
  }

  const tokens = generateTokens({ id: anggota.id, email: anggota.email, role: 'anggota' });

  return {
    user: {
      id: anggota.id,
      nrp: anggota.nrp,
      nama_lengkap: anggota.nama_lengkap,
      email: anggota.email,
      role: 'anggota',
      bagian_suara: anggota.bagian_suara,
      alamat: anggota.alamat,
      kontak: anggota.kontak,
      foto_path: anggota.foto_path,
      tanggal_lahir: anggota.tanggal_lahir,
      jurusan: anggota.jurusan,
    },
    ...tokens,
  };
}

/**
 * Refresh access token using a valid refresh token.
 * @param {string} refreshToken
 * @returns {{ accessToken: string }}
 */
function refreshAccessToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    const payload = { id: decoded.id, email: decoded.email, role: decoded.role };
    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.accessExpiry,
    });
    return { accessToken };
  } catch (err) {
    throw { statusCode: 401, message: 'Refresh token tidak valid atau sudah kedaluwarsa.' };
  }
}

/**
 * Get current user info from token data.
 * For admins, fetches from admin table. For anggota, fetches from anggota table.
 * @param {Object} tokenUser - { id, email, role }
 */
async function getCurrentUser(tokenUser) {
  const pool = await getPool();

  if (tokenUser.role === 'anggota') {
    const result = await pool.request()
      .input('id', sql.Int, tokenUser.id)
      .query(`SELECT id, nrp, nama_lengkap, email, bagian_suara,
                     alamat, kontak, foto_path, tanggal_lahir, jurusan
              FROM anggota WHERE id = @id`);

    if (result.recordset.length === 0) {
      throw { statusCode: 404, message: 'User tidak ditemukan.' };
    }

    return { ...result.recordset[0], role: 'anggota' };
  }

  // Admin or Super Admin
  const result = await pool.request()
    .input('id', sql.Int, tokenUser.id)
    .query('SELECT id, nama, email, role FROM admin WHERE id = @id');

  if (result.recordset.length === 0) {
    throw { statusCode: 404, message: 'User tidak ditemukan.' };
  }

  return result.recordset[0];
}

module.exports = { loginAdmin, loginAnggota, refreshAccessToken, getCurrentUser };

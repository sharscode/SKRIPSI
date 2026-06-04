/**
 * @module modules/auth/controller
 * @description Auth route handlers.
 */

const authService = require('./service');
const { sendSuccess, sendError } = require('../../utils/response');

/** POST /api/auth/login — Admin login */
async function login(req, res) {
  try {
    const { email, password } = req.body;
    const data = await authService.loginAdmin(email, password);
    return sendSuccess(res, 'Login berhasil', data);
  } catch (err) {
    console.error('[Auth] Admin login error:', err.message);
    return sendError(res, err.message, err.statusCode || 500);
  }
}

/** POST /api/auth/login-anggota — Member login */
async function loginAnggota(req, res) {
  try {
    const { email, password } = req.body;
    const data = await authService.loginAnggota(email, password);
    return sendSuccess(res, 'Login berhasil', data);
  } catch (err) {
    console.error('[Auth] Anggota login error:', err.message);
    return sendError(res, err.message, err.statusCode || 500);
  }
}

/** POST /api/auth/refresh — Refresh access token */
async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    const data = await authService.refreshAccessToken(refreshToken);
    return sendSuccess(res, 'Token berhasil diperbarui', data);
  } catch (err) {
    console.error('[Auth] Refresh error:', err.message);
    return sendError(res, err.message, err.statusCode || 500);
  }
}

/** GET /api/auth/me — Get current user info */
async function me(req, res) {
  try {
    return sendSuccess(res, 'Data user berhasil diambil', req.user);
  } catch (err) {
    console.error('[Auth] Me error:', err.message);
    return sendError(res, 'Gagal mengambil data user', 500);
  }
}

module.exports = { login, loginAnggota, refresh, me };

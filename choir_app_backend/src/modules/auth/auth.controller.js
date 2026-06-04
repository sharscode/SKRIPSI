/**
 * Auth Controller — Handles HTTP requests for authentication.
 */
const authService = require('./auth.service');
const { sendSuccess, sendError } = require('../../utils/response');

/** POST /api/auth/login — Admin login */
async function login(req, res) {
  try {
    const { email, password } = req.body;
    const result = await authService.loginAdmin(email, password);
    sendSuccess(res, 'Login berhasil.', result);
  } catch (err) {
    sendError(res, err.message || 'Login gagal.', err.statusCode || 500);
  }
}

/** POST /api/auth/login-anggota — Member login */
async function loginAnggota(req, res) {
  try {
    const { email, password } = req.body;
    const result = await authService.loginAnggota(email, password);
    sendSuccess(res, 'Login berhasil.', result);
  } catch (err) {
    sendError(res, err.message || 'Login gagal.', err.statusCode || 500);
  }
}

/** POST /api/auth/refresh — Refresh access token */
async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return sendError(res, 'Refresh token diperlukan.', 400);
    }
    const result = authService.refreshAccessToken(refreshToken);
    sendSuccess(res, 'Token berhasil diperbarui.', result);
  } catch (err) {
    sendError(res, err.message || 'Refresh token gagal.', err.statusCode || 500);
  }
}

/** GET /api/auth/me — Get current user */
async function me(req, res) {
  try {
    const user = await authService.getCurrentUser(req.user);
    sendSuccess(res, 'Data user berhasil diambil.', user);
  } catch (err) {
    sendError(res, err.message || 'Gagal mengambil data user.', err.statusCode || 500);
  }
}

module.exports = { login, loginAnggota, refresh, me };

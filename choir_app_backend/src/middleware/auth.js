/**
 * JWT Authentication Middleware
 * Extracts and verifies Bearer token from Authorization header.
 */
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { sendError } = require('../utils/response');

/**
 * Authenticate request by verifying JWT access token.
 * Sets req.user = { id, email, role }
 */
function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Token autentikasi tidak ditemukan.', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Token telah kedaluwarsa. Silakan refresh token.', 401);
    }
    return sendError(res, 'Token tidak valid.', 401);
  }
}

module.exports = auth;

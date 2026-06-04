/**
 * Global Error Handler Middleware
 * Catches all unhandled errors and returns safe responses.
 */
const config = require('../config/env');
const { sendError } = require('../utils/response');

/**
 * 404 Not Found handler — catches requests to undefined routes.
 */
function notFoundHandler(req, res) {
  sendError(res, `Route ${req.method} ${req.originalUrl} tidak ditemukan.`, 404);
}

/**
 * Global error handler — catches all thrown/next(err) errors.
 * Never leaks internal error details in production.
 */
function errorHandler(err, req, res, _next) {
  // Log full error for debugging
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return sendError(res, `Ukuran file terlalu besar. Maksimal ${config.upload.maxFileSizeMB}MB.`, 400);
  }

  // Multer file type error
  if (err.message && err.message.includes('Hanya file')) {
    return sendError(res, err.message, 400);
  }

  // JSON parse error
  if (err.type === 'entity.parse.failed') {
    return sendError(res, 'Format JSON tidak valid.', 400);
  }

  // Default 500 — never expose internal details
  const message = config.isProduction
    ? 'Terjadi kesalahan pada server.'
    : err.message || 'Internal Server Error';

  sendError(res, message, err.statusCode || 500);
}

module.exports = { notFoundHandler, errorHandler };

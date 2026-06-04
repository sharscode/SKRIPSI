/**
 * Rate Limiter Middleware
 * Limits login attempts to prevent brute force attacks.
 */
const rateLimit = require('express-rate-limit');

/** Rate limiter for login endpoints: 5 attempts per 15 minutes */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/** General API rate limiter: 100 requests per minute */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan. Coba lagi nanti.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginLimiter, apiLimiter };

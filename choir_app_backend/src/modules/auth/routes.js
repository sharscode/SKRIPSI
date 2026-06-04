/**
 * @module modules/auth/routes
 * @description Auth route definitions.
 */

const router = require('express').Router();
const controller = require('./controller');
const { loginValidation, refreshValidation } = require('./validators');
const { validate } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { loginLimiter } = require('../../middleware/rateLimiter');

// POST /api/auth/login
router.post('/login', loginLimiter, loginValidation, validate, controller.login);

// POST /api/auth/login-anggota
router.post('/login-anggota', loginLimiter, loginValidation, validate, controller.loginAnggota);

// POST /api/auth/refresh
router.post('/refresh', refreshValidation, validate, controller.refresh);

// GET /api/auth/me
router.get('/me', authenticate, controller.me);

module.exports = router;

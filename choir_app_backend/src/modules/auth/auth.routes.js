/**
 * Auth Routes
 */
const router = require('express').Router();
const auth = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { loginLimiter } = require('../../middleware/rateLimiter');
const { loginValidators, refreshValidators } = require('./auth.validators');
const controller = require('./auth.controller');

// POST /api/auth/login — Admin login
router.post('/login', loginLimiter, loginValidators, validate, controller.login);

// POST /api/auth/login-anggota — Member login
router.post('/login-anggota', loginLimiter, loginValidators, validate, controller.loginAnggota);

// POST /api/auth/refresh — Refresh access token
router.post('/refresh', refreshValidators, validate, controller.refresh);

// GET /api/auth/me — Get current user info
router.get('/me', auth, controller.me);

module.exports = router;

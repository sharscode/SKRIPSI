/**
 * Auth Validators — express-validator chains for auth endpoints.
 */
const { body } = require('express-validator');

const loginValidators = [
  body('email')
    .isEmail().withMessage('Email tidak valid.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password wajib diisi.'),
];

const refreshValidators = [
  body('refreshToken')
    .notEmpty().withMessage('Refresh token wajib diisi.'),
];

module.exports = { loginValidators, refreshValidators };

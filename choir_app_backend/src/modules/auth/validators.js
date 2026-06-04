/**
 * @module modules/auth/validators
 * @description Validation chains for auth endpoints.
 */

const { body } = require('express-validator');

const loginValidation = [
  body('email')
    .isEmail().withMessage('Format email tidak valid')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password wajib diisi'),
];

const refreshValidation = [
  body('refreshToken')
    .notEmpty().withMessage('Refresh token wajib diisi'),
];

module.exports = { loginValidation, refreshValidation };

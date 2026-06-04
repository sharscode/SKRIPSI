/**
 * @module modules/admin/validators
 * @description Validation chains for admin endpoints.
 */

const { body, param } = require('express-validator');

const createAdminValidation = [
  body('nama').trim().notEmpty().withMessage('Nama wajib diisi'),
  body('email').isEmail().withMessage('Format email tidak valid').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  body('role').isIn(['admin', 'super_admin']).withMessage('Role harus admin atau super_admin'),
];

const updateAdminValidation = [
  param('id').isInt().withMessage('ID harus berupa angka'),
  body('nama').trim().notEmpty().withMessage('Nama wajib diisi'),
  body('email').isEmail().withMessage('Format email tidak valid').normalizeEmail(),
  body('role').isIn(['admin', 'super_admin']).withMessage('Role harus admin atau super_admin'),
];

const idParamValidation = [
  param('id').isInt().withMessage('ID harus berupa angka'),
];

module.exports = { createAdminValidation, updateAdminValidation, idParamValidation };

/**
 * @module modules/anggota/validators
 * @description Validation chains for anggota endpoints.
 */

const { body, param, query } = require('express-validator');

const createAnggotaValidation = [
  body('nrp').trim().notEmpty().withMessage('NRP wajib diisi'),
  body('nama_lengkap').trim().notEmpty().withMessage('Nama lengkap wajib diisi'),
  body('bagian_suara').isIn(['sopran', 'alto', 'tenor', 'bass']).withMessage('Bagian suara harus sopran, alto, tenor, atau bass'),
  body('email').isEmail().withMessage('Format email tidak valid').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  body('alamat').optional().trim(),
  body('kontak').optional().trim(),
];

const updateAnggotaValidation = [
  param('id').isInt().withMessage('ID harus berupa angka'),
  body('nrp').trim().notEmpty().withMessage('NRP wajib diisi'),
  body('nama_lengkap').trim().notEmpty().withMessage('Nama lengkap wajib diisi'),
  body('bagian_suara').isIn(['sopran', 'alto', 'tenor', 'bass']).withMessage('Bagian suara harus sopran, alto, tenor, atau bass'),
  body('email').isEmail().withMessage('Format email tidak valid').normalizeEmail(),
  body('alamat').optional().trim(),
  body('kontak').optional().trim(),
];

const changePasswordValidation = [
  param('id').isInt().withMessage('ID harus berupa angka'),
  body('oldPassword').notEmpty().withMessage('Password lama wajib diisi'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password baru minimal 6 karakter'),
];

const idParamValidation = [
  param('id').isInt().withMessage('ID harus berupa angka'),
];

const listQueryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page harus angka positif'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit harus 1-100'),
  query('bagian_suara').optional().isIn(['sopran', 'alto', 'tenor', 'bass']).withMessage('Bagian suara tidak valid'),
];

module.exports = {
  createAnggotaValidation,
  updateAnggotaValidation,
  changePasswordValidation,
  idParamValidation,
  listQueryValidation,
};

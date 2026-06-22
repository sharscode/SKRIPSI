const { body } = require('express-validator');

const createValidators = [
  body('nrp').notEmpty().withMessage('NRP wajib diisi.'),
  body('nama_lengkap').notEmpty().withMessage('Nama lengkap wajib diisi.'),
  body('bagian_suara').isIn(['sopran','alto','tenor','bass']).withMessage('Bagian suara tidak valid.'),
  body('kontak').notEmpty().withMessage('Kontak wajib diisi.'),
  body('email').isEmail().withMessage('Email tidak valid.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter.'),
  body('tanggal_lahir').optional({ checkFalsy: true }).isISO8601().withMessage('Tanggal lahir harus berupa format tanggal YYYY-MM-DD.'),
  body('jurusan').optional({ checkFalsy: true }).isString().trim(),
];

const updateValidators = [
  body('email').optional().isEmail().withMessage('Email tidak valid.').normalizeEmail(),
  body('bagian_suara').optional().isIn(['sopran','alto','tenor','bass']).withMessage('Bagian suara tidak valid.'),
  body('tanggal_lahir').optional({ checkFalsy: true }).isISO8601().withMessage('Tanggal lahir harus berupa format tanggal YYYY-MM-DD.'),
  body('jurusan').optional({ checkFalsy: true }).isString().trim(),
];

const passwordValidators = [
  body('oldPassword').notEmpty().withMessage('Password lama wajib diisi.'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password baru minimal 6 karakter.'),
];

module.exports = { createValidators, updateValidators, passwordValidators };

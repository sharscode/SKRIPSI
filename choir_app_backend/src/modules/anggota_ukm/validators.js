/**
 * @module modules/anggota_ukm/validators
 */

const { body, param, query } = require('express-validator');

const createValidation = [
  body('anggota_id').isInt().withMessage('anggota_id harus berupa angka'),
  body('periode').trim().notEmpty().withMessage('Periode wajib diisi'),
  body('tanggal_aktif').optional().isDate().withMessage('Format tanggal tidak valid'),
];

const updateStatusValidation = [
  param('id').isInt().withMessage('ID harus berupa angka'),
  body('status_keaktifan').isIn(['aktif', 'nonaktif']).withMessage('Status harus aktif atau nonaktif'),
];

const historyParamValidation = [
  param('anggota_id').isInt().withMessage('anggota_id harus berupa angka'),
];

const listQueryValidation = [
  query('periode').optional().trim(),
  query('status_keaktifan').optional().isIn(['aktif', 'nonaktif']).withMessage('Status tidak valid'),
];

module.exports = { createValidation, updateStatusValidation, historyParamValidation, listQueryValidation };

const { body } = require('express-validator');

const upsertValidators = [
  body('catatan')
    .trim()
    .notEmpty().withMessage('Catatan evaluasi wajib diisi.')
    .isLength({ max: 2000 }).withMessage('Catatan maksimal 2000 karakter.'),
  body('skor')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1, max: 5 }).withMessage('Skor harus antara 1 sampai 5.'),
  body('kendala')
    .optional({ nullable: true })
    .isLength({ max: 1000 }).withMessage('Kendala maksimal 1000 karakter.'),
  body('saran')
    .optional({ nullable: true })
    .isLength({ max: 1000 }).withMessage('Saran maksimal 1000 karakter.'),
  body('is_publik')
    .optional()
    .isBoolean().withMessage('is_publik harus true atau false.'),
];

module.exports = { upsertValidators };

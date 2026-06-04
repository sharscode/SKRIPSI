const { body } = require('express-validator');

const createValidators = [
  body('nama_acara').notEmpty().withMessage('Nama acara wajib diisi.'),
  body('tanggal').isDate().withMessage('Tanggal tidak valid.'),
  body('jenis_kegiatan').notEmpty().withMessage('Jenis kegiatan wajib diisi.'),
  body('lokasi').notEmpty().withMessage('Lokasi wajib diisi.'),
  body('penyelenggara').notEmpty().withMessage('Penyelenggara wajib diisi.'),
  body('penanggung_jawab').notEmpty().withMessage('Penanggung jawab wajib diisi.'),
  body('jenis_skkk').notEmpty().withMessage('Jenis SKKK wajib diisi.'),
];
const statusValidators = [
  body('status').isIn(['aktif','selesai','dibatalkan']).withMessage('Status tidak valid.'),
];
module.exports = { createValidators, statusValidators };

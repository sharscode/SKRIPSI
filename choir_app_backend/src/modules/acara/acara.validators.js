const { body } = require('express-validator');

/**
 * Kosakata resmi formulir SKKK Online BAKA (F01-PM05-BAKA-UKP).
 *
 * Nilai-nilai ini ikut tercetak di formulir yang diserahkan ke BAKA, jadi
 * divalidasi di server — bukan hanya dibatasi lewat dropdown di klien.
 * Salah istilah membuat pengajuan ditolak, dan kliennya bisa dilewati.
 */
const JENIS_SKKK = [
  'Organisasi & Kepemimpinan', 'Pengabdian Masyarakat', 'Partisipasi/Prestasi',
  'Bakat & Minat', 'Penalaran',
];
const JENIS_KEPANITIAAN = ['1 tahun', 'Kurang dari 1 tahun', 'Pengabdian Masyarakat'];
const LINGKUP = [
  'Internasional', 'Nasional', 'Regional', 'Surabaya', 'Universitas', 'Fakultas', 'Intern',
];
const JABATAN = [
  'KETUA', 'WAKIL KETUA', 'SEKRETARIS', 'BENDAHARA', 'KOORDINATOR DIVISI',
  'ANGGOTA KEPANITIAAN', 'PESERTA', 'KETUA UKM', 'SEKRETARIS/BENDAHARA UKM',
  'KOORDINATOR UKM', 'ANGGOTA UKM', 'PESERTA UKM', 'PENGISI ACARA/PENGMAS 5ASPEK',
];

const createValidators = [
  body('nama_acara').notEmpty().withMessage('Nama acara wajib diisi.'),
  body('tanggal').isDate().withMessage('Tanggal tidak valid.'),
  body('jenis_kegiatan').notEmpty().withMessage('Jenis kegiatan wajib diisi.'),
  body('lokasi').notEmpty().withMessage('Lokasi wajib diisi.'),
  body('penyelenggara').notEmpty().withMessage('Penyelenggara wajib diisi.'),
  body('penanggung_jawab').notEmpty().withMessage('Penanggung jawab wajib diisi.'),
  body('jenis_skkk').notEmpty().withMessage('Jenis SKKK wajib diisi.')
    .bail().isIn(JENIS_SKKK).withMessage('Jenis SKKK di luar kosakata BAKA.'),

  // Field formulir BAKA. Opsional: kalau tidak dikirim, service memakai
  // nilai bawaan. Tapi kalau dikirim, harus nilai yang dikenal BAKA.
  body('jenis_kepanitiaan').optional({ values: 'falsy' })
    .isIn(JENIS_KEPANITIAAN).withMessage('Jenis kepanitiaan di luar kosakata BAKA.'),
  body('lingkup').optional({ values: 'falsy' })
    .isIn(LINGKUP).withMessage('Lingkup di luar kosakata BAKA.'),
  body('jabatan_default').optional({ values: 'falsy' })
    .isIn(JABATAN).withMessage('Jabatan di luar kosakata BAKA.'),
  body('lembaga').optional({ values: 'falsy' })
    .isLength({ max: 100 }).withMessage('Lembaga maksimal 100 karakter.'),
];

const statusValidators = [
  body('status').isIn(['aktif','selesai','dibatalkan']).withMessage('Status tidak valid.'),
];

module.exports = {
  createValidators, statusValidators,
  JENIS_SKKK, JENIS_KEPANITIAAN, LINGKUP, JABATAN,
};

/**
 * Multer File Upload Configuration
 * Separate configs for partitur (PDF), dokumentasi (any), and photos (images).
 */
const multer = require('multer');
const path = require('path');
const config = require('../config/env');

const maxSize = config.upload.maxFileSizeMB * 1024 * 1024;

/**
 * Create a multer disk storage config for a given subdirectory.
 * @param {string} subDir - Subdirectory under uploads/
 */
function createStorage(subDir) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '..', '..', 'uploads', subDir));
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const filename = `${Date.now()}${ext}`;
      cb(null, filename);
    },
  });
}

/**
 * File filter: only PDF files.
 */
function pdfFilter(req, file, cb) {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Hanya file PDF yang diperbolehkan.'), false);
  }
}

/**
 * File filter: only image files.
 */
function imageFilter(req, file, cb) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar (JPEG, PNG, WebP, GIF) yang diperbolehkan.'), false);
  }
}

/** Upload config for partitur PDFs */
const uploadPartitur = multer({
  storage: createStorage('partitur'),
  limits: { fileSize: maxSize },
  fileFilter: pdfFilter,
});

/** Upload config for dokumentasi (any file type) */
const uploadDokumentasi = multer({
  storage: createStorage('dokumentasi'),
  limits: { fileSize: maxSize },
});

/** Upload config for profile photos */
const uploadPhoto = multer({
  storage: createStorage('photos'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for photos
  fileFilter: imageFilter,
});

module.exports = { uploadPartitur, uploadDokumentasi, uploadPhoto };

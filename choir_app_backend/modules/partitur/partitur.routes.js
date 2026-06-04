const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const controller = require('./partitur.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');

// 🔹 CONFIG UPLOAD
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/partitur');
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + path.extname(file.originalname);
    cb(null, unique);
  },
});

const upload = multer({ storage });

// 🔹 GET ALL
router.get('/', authenticate, controller.getAll);

// 🔹 CREATE
router.post(
  '/',
  authenticate,
  authorize('super_admin', 'admin'),
  upload.single('file'),
  controller.create
);

router.delete(
  '/remove-from-acara',
  authenticate,
  authorize('super_admin', 'admin'),
  controller.removeFromAcara
);

// 🔹 add ke acara
router.post(
  '/add-to-acara',
  authenticate,
  authorize('super_admin', 'admin'),
  controller.addToAcara
);

// 🔹 get partitur per acara
router.get(
  '/acara/:acara_id',
  authenticate,
  controller.getByAcara
);

// 🔹 UPDATE (optional upload ulang)
router.put(
  '/:id',
  authenticate,
  authorize('super_admin', 'admin'),
  upload.single('file'),
  controller.update
);

// 🔹 DELETE
router.delete(
  '/:id',
  authenticate,
  authorize('super_admin'),
  controller.remove
);

module.exports = router;
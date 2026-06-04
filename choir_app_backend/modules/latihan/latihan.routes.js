const express = require('express');
const router = express.Router();

const controller = require('./latihan.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');

// 🔹 GET semua latihan
router.get('/', authenticate, controller.getAll);

// 🔹 GET latihan per acara
router.get('/acara/:acara_id', authenticate, controller.getByAcara);

// 🔹 GENERATE QR (taruh sebelum :id)
router.post(
  '/:id/generate-qr',
  authenticate,
  authorize('super_admin', 'admin'),
  controller.generateQR
);

// 🔹 GET detail latihan
router.get('/:id', authenticate, controller.getById);

// 🔹 CREATE latihan
router.post(
  '/',
  authenticate,
  authorize('super_admin', 'admin'),
  controller.create
);

// 🔹 UPDATE latihan
router.put(
  '/:id',
  authenticate,
  authorize('super_admin', 'admin'),
  controller.update
);

// 🔹 DELETE latihan
router.delete(
  '/:id',
  authenticate,
  authorize('super_admin'),
  controller.remove
);

module.exports = router;
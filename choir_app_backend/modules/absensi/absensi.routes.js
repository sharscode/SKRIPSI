const express = require('express');
const router = express.Router();

const controller = require('./absensi.controller');
const { authenticate } = require('../../middleware/auth.middleware');

// 🔹 check-in manual
router.post('/', authenticate, controller.checkIn);

// 🔥 scan QR
router.post('/scan', authenticate, controller.scanQR);

router.put('/status', authenticate, controller.updateStatus);

// 🔹 lihat absensi per latihan
router.get('/latihan/:latihan_id', authenticate, controller.getByLatihan);

// 🔹 lihat absensi per anggota
router.get('/anggota/:anggota_id', authenticate, controller.getByAnggota);

module.exports = router;
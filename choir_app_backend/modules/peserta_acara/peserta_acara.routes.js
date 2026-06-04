const express = require('express');
const router = express.Router();

const controller = require('./peserta_acara.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');

// 🔹 daftar ke acara
router.post('/', authenticate, controller.create);

router.post(
  '/manual',
  authenticate,
  authorize('super_admin', 'admin'),
  controller.createManual
);

// 🔹 approve / reject
router.put(
  '/:id/approval',
  authenticate,
  authorize('super_admin', 'admin'),
  controller.updateApproval
);

// 🔹 update status peserta (batal)
router.put(
  '/:id/status',
  authenticate,
  authorize('super_admin', 'admin'),
  controller.updateStatusPeserta
);

// 🔹 lihat peserta per acara
router.get(
  '/acara/:acara_id',
  authenticate,
  controller.getByAcara
);

// 🔹 lihat acara per anggota
router.get(
  '/anggota/:anggota_id',
  authenticate,
  controller.getByAnggota
);

// 🔹 delete peserta
router.delete(
  '/:id',
  authenticate,
  controller.remove
);

module.exports = router;
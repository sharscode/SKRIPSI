const express = require('express');
const router = express.Router();

const controller = require('./acara.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');

// 🔹 GET semua acara
router.get('/', authenticate, controller.getAll);

// 🔹 GET acara aktif
router.get('/aktif', controller.getAcaraAktif);

// 🔹 GET detail acara
router.get('/:id', authenticate, controller.getById);

// 🔹 CREATE acara
router.post('/', authenticate, authorize('super_admin', 'admin'), controller.create);

router.put(
  '/:id/status',
  authenticate,
  authorize('super_admin', 'admin'),
  controller.updateStatus
);

// 🔹 UPDATE acara
router.put('/:id', authenticate, authorize('super_admin', 'admin'), controller.update);

// 🔹 DELETE acara
router.delete('/:id', authenticate, authorize('super_admin'), controller.remove);

module.exports = router;
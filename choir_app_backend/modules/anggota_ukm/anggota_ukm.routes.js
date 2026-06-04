const express = require('express');
const router = express.Router();

const controller =
require('./anggota_ukm.controller');

const {
  authenticate
} = require('../../middleware/auth.middleware');

const {
  authorize
} = require('../../middleware/role.middleware');

// list
router.get(
  '/',
  authenticate,
  authorize('super_admin', 'admin'),
  controller.getAll
);

// tambah
router.post(
  '/',
  authenticate,
  authorize('super_admin'),
  controller.create
);

// ubah status
router.put(
  '/:id/status',
  authenticate,
  authorize('super_admin'),
  controller.updateStatus
);

// history
router.get(
  '/history/:anggota_id',
  authenticate,
  authorize('super_admin', 'admin'),
  controller.getHistory
);

module.exports = router;
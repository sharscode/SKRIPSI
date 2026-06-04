const express = require('express');
const router = express.Router();

const controller = require('./acara_partitur.controller');
const { authenticate } = require('../../middleware/auth.middleware');

// 🔹 get partitur per acara
router.get('/acara/:acara_id', authenticate, controller.getByAcara);

// 🔹 add partitur ke acara
router.post(
  '/add-to-acara',
  authenticate,
  authorize('super_admin', 'admin'),
  controller.addToAcara
);

// 🔹 delete
router.delete('/:id', authenticate, controller.remove);

module.exports = router;
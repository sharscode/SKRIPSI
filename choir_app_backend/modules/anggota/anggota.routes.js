const express = require('express');
const router = express.Router();

const controller = require('./anggota.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');

// 🔹 GET semua anggota
router.get('/', authenticate, authorize('super_admin', 'admin'), controller.getAll);

// 🔹 GET detail anggota
router.get('/:id', authenticate, controller.getById);

// 🔹 CREATE anggota
router.post('/', authenticate, authorize('super_admin'), controller.create);

// 🔹 UPDATE anggota
router.put('/:id', authenticate, authorize('super_admin'), controller.update);

// 🔹 DELETE anggota
router.delete('/:id', authenticate, authorize('super_admin'), controller.remove);

module.exports = router;
const express = require('express');
const router = express.Router();

const controller = require('./admin.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');

// 🔹 GET semua admin (super_admin saja)
router.get('/', authenticate, authorize('super_admin'), controller.getAll);

// 🔹 GET detail admin
router.get('/:id', authenticate, authorize('super_admin'), controller.getById);

// 🔹 CREATE admin (super_admin saja)
router.post('/', authenticate, authorize('super_admin'), controller.create);

// 🔹 UPDATE admin
router.put('/:id', authenticate, authorize('super_admin'), controller.update);

// 🔹 DELETE admin
router.delete('/:id', authenticate, authorize('super_admin'), controller.remove);

module.exports = router;
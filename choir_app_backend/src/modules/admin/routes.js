/**
 * @module modules/admin/routes
 * @description Admin route definitions (super_admin only for list/create/delete).
 */

const router = require('express').Router();
const controller = require('./controller');
const { createAdminValidation, updateAdminValidation, idParamValidation } = require('./validators');
const { validate } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');

// All routes require authentication
router.use(authenticate);

// GET /api/admin — super_admin only
router.get('/', authorize('super_admin'), controller.getAll);

// GET /api/admin/:id
router.get('/:id', authorize('admin', 'super_admin'), idParamValidation, validate, controller.getById);

// POST /api/admin — super_admin only
router.post('/', authorize('super_admin'), createAdminValidation, validate, controller.create);

// PUT /api/admin/:id
router.put('/:id', authorize('super_admin'), updateAdminValidation, validate, controller.update);

// DELETE /api/admin/:id — super_admin only
router.delete('/:id', authorize('super_admin'), idParamValidation, validate, controller.remove);

module.exports = router;

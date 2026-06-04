/**
 * @module modules/anggota/routes
 * @description Anggota route definitions.
 */

const router = require('express').Router();
const controller = require('./controller');
const v = require('./validators');
const { validate } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');

router.use(authenticate);

// GET /api/anggota
router.get('/', v.listQueryValidation, validate, controller.getAll);

// GET /api/anggota/:id
router.get('/:id', v.idParamValidation, validate, controller.getById);

// POST /api/anggota — admin only
router.post('/', authorize('admin', 'super_admin'), v.createAnggotaValidation, validate, controller.create);

// PUT /api/anggota/:id — admin only
router.put('/:id', authorize('admin', 'super_admin'), v.updateAnggotaValidation, validate, controller.update);

// PATCH /api/anggota/:id/password
router.patch('/:id/password', v.changePasswordValidation, validate, controller.changePassword);

// DELETE /api/anggota/:id — admin only
router.delete('/:id', authorize('admin', 'super_admin'), v.idParamValidation, validate, controller.remove);

module.exports = router;

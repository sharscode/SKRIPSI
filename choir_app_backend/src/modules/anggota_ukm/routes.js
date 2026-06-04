/**
 * @module modules/anggota_ukm/routes
 */

const router = require('express').Router();
const controller = require('./controller');
const v = require('./validators');
const { validate } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');

router.use(authenticate);

// GET /api/anggota-ukm
router.get('/', v.listQueryValidation, validate, controller.getAll);

// POST /api/anggota-ukm — admin only
router.post('/', authorize('admin', 'super_admin'), v.createValidation, validate, controller.create);

// PUT /api/anggota-ukm/:id/status — admin only
router.put('/:id/status', authorize('admin', 'super_admin'), v.updateStatusValidation, validate, controller.updateStatus);

// GET /api/anggota-ukm/history/:anggota_id
router.get('/history/:anggota_id', v.historyParamValidation, validate, controller.getHistory);

module.exports = router;

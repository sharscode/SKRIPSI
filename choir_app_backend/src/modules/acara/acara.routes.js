const router = require('express').Router();
const auth = require('../../middleware/auth');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const { createValidators, statusValidators } = require('./acara.validators');
const ctrl = require('./acara.controller');

router.get('/', auth, ctrl.getAll);
router.get('/:id', auth, ctrl.getById);
router.post('/', auth, authorize('super_admin','admin'), createValidators, validate, ctrl.create);
router.put('/:id', auth, authorize('super_admin','admin'), createValidators, validate, ctrl.update);
router.patch('/:id/status', auth, authorize('super_admin','admin'), statusValidators, validate, ctrl.updateStatus);
router.delete('/:id', auth, authorize('super_admin'), ctrl.remove);
module.exports = router;

const router = require('express').Router();
const auth = require('../../middleware/auth');
const authorize = require('../../middleware/authorize');
const ctrl = require('./latihan.controller');

router.get('/', auth, ctrl.getAll);
router.get('/:id', auth, ctrl.getById);
router.post('/', auth, authorize('super_admin','admin'), ctrl.create);
router.put('/:id', auth, authorize('super_admin','admin'), ctrl.update);
router.delete('/:id', auth, authorize('super_admin'), ctrl.remove);
router.post('/:id/generate-qr', auth, authorize('super_admin','admin'), ctrl.generateQR);
module.exports = router;

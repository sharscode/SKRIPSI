const router = require('express').Router();
const auth = require('../../middleware/auth');
const authorize = require('../../middleware/authorize');
const ctrl = require('./anggota_ukm.controller');

router.get('/', auth, ctrl.getAll);
router.get('/history/:anggota_id', auth, ctrl.getHistory);
router.post('/', auth, authorize('super_admin', 'admin'), ctrl.register);
router.put('/:id/status', auth, authorize('super_admin', 'admin'), ctrl.updateStatus);
module.exports = router;

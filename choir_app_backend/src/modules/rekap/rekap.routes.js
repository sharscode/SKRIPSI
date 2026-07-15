const router = require('express').Router();
const auth = require('../../middleware/auth');
const authorize = require('../../middleware/authorize');
const ctrl = require('./rekap.controller');

router.get('/:acara_id/preview', auth, authorize('super_admin', 'admin'), ctrl.preview);
router.get('/:acara_id/download', auth, authorize('super_admin', 'admin'), ctrl.download);

module.exports = router;

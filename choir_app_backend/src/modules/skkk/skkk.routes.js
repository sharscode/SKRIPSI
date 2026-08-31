const router = require('express').Router();
const auth = require('../../middleware/auth');
const authorize = require('../../middleware/authorize');
const ctrl = require('./skkk.controller');
// Didaftarkan sebelum '/:acara_id/...' supaya tidak tertangkap sebagai parameter.
router.get('/belum-diajukan', auth, authorize('super_admin','admin'), ctrl.belumDiajukan);
router.put('/:acara_id/diajukan', auth, authorize('super_admin','admin'), ctrl.setDiajukan);
router.get('/:acara_id/preview', auth, authorize('super_admin','admin'), ctrl.preview);
router.get('/:acara_id/download', auth, authorize('super_admin','admin'), ctrl.download);
module.exports = router;

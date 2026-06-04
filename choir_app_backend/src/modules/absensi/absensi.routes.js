const router = require('express').Router();
const auth = require('../../middleware/auth');
const authorize = require('../../middleware/authorize');
const ctrl = require('./absensi.controller');

router.post('/scan', auth, ctrl.scanQR);
router.put('/status', auth, authorize('super_admin','admin'), ctrl.upsertStatus);
router.get('/latihan/:latihan_id', auth, ctrl.getByLatihan);
router.get('/anggota/:anggota_id', auth, ctrl.getByAnggota);
router.get('/stats/:acara_id', auth, authorize('super_admin','admin'), ctrl.getStatsByAcara);
module.exports = router;

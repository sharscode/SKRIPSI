const router = require('express').Router();
const auth = require('../../middleware/auth');
const authorize = require('../../middleware/authorize');
const ctrl = require('./peserta_acara.controller');

router.get('/acara/:acara_id', auth, ctrl.getByAcara);
router.get('/anggota/:anggota_id', auth, ctrl.getByAnggota);
router.post('/', auth, authorize('anggota'), ctrl.selfRegister);
router.post('/manual', auth, authorize('super_admin','admin'), ctrl.manualRegister);
router.put('/:id/approval', auth, authorize('super_admin','admin'), ctrl.updateApproval);
router.put('/:id/status', auth, authorize('super_admin','admin'), ctrl.updateStatusPeserta);
router.delete('/:id', auth, ctrl.remove);
module.exports = router;

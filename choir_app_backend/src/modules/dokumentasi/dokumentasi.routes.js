const router = require('express').Router();
const auth = require('../../middleware/auth');
const authorize = require('../../middleware/authorize');
const { uploadDokumentasi } = require('../../middleware/upload');
const ctrl = require('./dokumentasi.controller');

router.get('/acara/:acara_id', auth, ctrl.getByAcara);
router.post('/acara/:acara_id', auth, authorize('super_admin','admin'), uploadDokumentasi.array('files', 10), ctrl.create);
router.put('/:id', auth, authorize('super_admin','admin'), ctrl.update);
router.delete('/:id', auth, authorize('super_admin','admin'), ctrl.remove);
module.exports = router;

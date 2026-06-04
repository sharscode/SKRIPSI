const router = require('express').Router();
const auth = require('../../middleware/auth');
const authorize = require('../../middleware/authorize');
const { uploadPartitur } = require('../../middleware/upload');
const ctrl = require('./partitur.controller');

router.get('/', auth, ctrl.getAll);
router.get('/acara/:acara_id', auth, ctrl.getByAcara);
router.get('/:id', auth, ctrl.getById);
router.post('/', auth, authorize('super_admin','admin'), uploadPartitur.single('file'), ctrl.create);
router.put('/:id', auth, authorize('super_admin','admin'), uploadPartitur.single('file'), ctrl.update);
router.delete('/unlink-acara', auth, authorize('super_admin','admin'), ctrl.unlinkAcara);
router.delete('/:id', auth, authorize('super_admin'), ctrl.remove);
router.post('/link-acara', auth, authorize('super_admin','admin'), ctrl.linkAcara);
module.exports = router;

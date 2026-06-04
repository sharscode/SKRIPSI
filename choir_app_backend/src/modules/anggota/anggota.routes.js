const router = require('express').Router();
const auth = require('../../middleware/auth');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const { uploadPhoto } = require('../../middleware/upload');
const { createValidators, updateValidators, passwordValidators } = require('./anggota.validators');
const ctrl = require('./anggota.controller');

router.get('/', auth, ctrl.getAll);
router.get('/:id', auth, ctrl.getById);
router.post('/', auth, authorize('super_admin', 'admin'), createValidators, validate, ctrl.create);
router.put('/:id', auth, uploadPhoto.single('foto'), updateValidators, validate, ctrl.update);
router.patch('/:id/password', auth, passwordValidators, validate, ctrl.changePassword);
router.delete('/:id', auth, authorize('super_admin'), ctrl.remove);

module.exports = router;

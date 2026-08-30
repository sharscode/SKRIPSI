const router = require('express').Router();
const auth = require('../../middleware/auth');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const { upsertValidators } = require('./acara_evaluasi.validators');
const ctrl = require('./acara_evaluasi.controller');

// Didaftarkan sebelum '/:acara_id' supaya 'belum-dievaluasi' tidak
// tertangkap sebagai parameter acara_id.
router.get('/belum-dievaluasi', auth, authorize('super_admin', 'admin'), ctrl.getBelumDievaluasi);

router.get('/:acara_id', auth, ctrl.getByAcara);
router.put('/:acara_id', auth, authorize('super_admin', 'admin'), upsertValidators, validate, ctrl.upsert);
router.delete('/:acara_id', auth, authorize('super_admin'), ctrl.remove);

module.exports = router;

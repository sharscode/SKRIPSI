const express = require('express');
const router = express.Router();
const settingsController = require('./settings.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.get('/active_periode', authenticate, settingsController.getActivePeriode);
router.put('/active_periode', authenticate, settingsController.updateActivePeriode);

module.exports = router;

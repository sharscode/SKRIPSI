const router = require('express').Router();
const auth = require('../../middleware/auth');
const authorize = require('../../middleware/authorize');
const ctrl = require('./notification.controller');
router.get('/', auth, ctrl.getAll);
router.post('/', auth, authorize('super_admin','admin'), ctrl.send);
router.patch('/read-all', auth, ctrl.markAllRead);
router.patch('/:id/read', auth, ctrl.markRead);
module.exports = router;

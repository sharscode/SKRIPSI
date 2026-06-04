const express = require('express');
const router = express.Router();

const controller = require('./auth.controller');

// 🔥 WAJIB ADA
router.post('/login', controller.login);
router.post('/login-anggota', controller.loginMember);

// optional test
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Auth route works' });
});

module.exports = router;
const svc = require('./notification.service');
const { sendSuccess, sendError } = require('../../utils/response');
async function getAll(req, res) {
  try { sendSuccess(res, 'Notifikasi berhasil diambil.', await svc.getForUser(req.user)); }
  catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function send(req, res) {
  try { await svc.send(req.body); sendSuccess(res, 'Notifikasi berhasil dikirim.', null, 201); }
  catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function markRead(req, res) {
  try { await svc.markRead(+req.params.id, req.user); sendSuccess(res, 'Notifikasi ditandai sudah dibaca.'); }
  catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function markAllRead(req, res) {
  try { await svc.markAllRead(req.user); sendSuccess(res, 'Semua notifikasi ditandai sudah dibaca.'); }
  catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
module.exports = { getAll, send, markRead, markAllRead };

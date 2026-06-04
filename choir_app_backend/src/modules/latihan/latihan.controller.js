const svc = require('./latihan.service');
const { sendSuccess, sendError } = require('../../utils/response');

async function getAll(req, res) {
  try { sendSuccess(res, 'Data latihan berhasil diambil.', await svc.getAll(req.query)); }
  catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function getById(req, res) {
  try { sendSuccess(res, 'Detail latihan berhasil diambil.', await svc.getById(+req.params.id)); }
  catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function create(req, res) {
  try { sendSuccess(res, 'Latihan berhasil dibuat.', await svc.create(req.body, req.user.id), 201); }
  catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function update(req, res) {
  try { sendSuccess(res, 'Latihan berhasil diperbarui.', await svc.update(+req.params.id, req.body)); }
  catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function remove(req, res) {
  try { await svc.remove(+req.params.id); sendSuccess(res, 'Latihan berhasil dihapus.'); }
  catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function generateQR(req, res) {
  try { sendSuccess(res, 'QR code berhasil dibuat.', await svc.generateQR(+req.params.id)); }
  catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
module.exports = { getAll, getById, create, update, remove, generateQR };

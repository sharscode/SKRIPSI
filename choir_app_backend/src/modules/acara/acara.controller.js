const svc = require('./acara.service');
const { sendSuccess, sendError } = require('../../utils/response');

async function getAll(req, res) {
  try { sendSuccess(res, 'Data acara berhasil diambil.', await svc.getAll(req.query)); }
  catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function getById(req, res) {
  try { sendSuccess(res, 'Detail acara berhasil diambil.', await svc.getById(+req.params.id)); }
  catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
// Meneruskan err.code dan err.data supaya klien bisa membedakan peringatan yang
// perlu konfirmasi (mis. nama acara kembar) dari kegagalan biasa.
const errExtra = (err) => (err.code ? { code: err.code, data: err.data } : null);

async function create(req, res) {
  try { sendSuccess(res, 'Acara berhasil dibuat.', await svc.create(req.body, req.user.id), 201); }
  catch (err) { sendError(res, err.message, err.statusCode || 500, null, errExtra(err)); }
}
async function update(req, res) {
  try { sendSuccess(res, 'Acara berhasil diperbarui.', await svc.update(+req.params.id, req.body)); }
  catch (err) { sendError(res, err.message, err.statusCode || 500, null, errExtra(err)); }
}
async function updateStatus(req, res) {
  try {
    await svc.updateStatus(+req.params.id, req.body.status);
    sendSuccess(res, 'Status acara berhasil diperbarui.');
  } catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function remove(req, res) {
  try { await svc.remove(+req.params.id); sendSuccess(res, 'Acara berhasil dihapus.'); }
  catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
module.exports = { getAll, getById, create, update, updateStatus, remove };

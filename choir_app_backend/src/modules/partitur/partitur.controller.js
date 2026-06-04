const svc = require('./partitur.service');
const { sendSuccess, sendError } = require('../../utils/response');

async function getAll(req, res) {
  try { sendSuccess(res, 'Data partitur berhasil diambil.', await svc.getAll(req.query)); }
  catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function getById(req, res) {
  try { sendSuccess(res, 'Detail partitur berhasil diambil.', await svc.getById(+req.params.id)); }
  catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function getByAcara(req, res) {
  try { sendSuccess(res, 'Partitur acara berhasil diambil.', await svc.getByAcara(+req.params.acara_id)); }
  catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function create(req, res) {
  try {
    if (!req.file) return sendError(res, 'File PDF wajib diunggah.', 400);
    sendSuccess(res, 'Partitur berhasil diunggah.', await svc.create(req.body, req.file.filename), 201);
  } catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function update(req, res) {
  try {
    sendSuccess(res, 'Partitur berhasil diperbarui.', await svc.update(+req.params.id, req.body, req.file?.filename));
  } catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function remove(req, res) {
  try { await svc.remove(+req.params.id); sendSuccess(res, 'Partitur berhasil dihapus.'); }
  catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function linkAcara(req, res) {
  try { await svc.linkAcara(+req.body.acara_id, +req.body.partitur_id); sendSuccess(res, 'Partitur berhasil dihubungkan ke acara.'); }
  catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function unlinkAcara(req, res) {
  try { await svc.unlinkAcara(+req.body.acara_id, +req.body.partitur_id); sendSuccess(res, 'Partitur berhasil dilepas dari acara.'); }
  catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
module.exports = { getAll, getById, getByAcara, create, update, remove, linkAcara, unlinkAcara };

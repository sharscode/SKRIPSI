const svc = require('./dokumentasi.service');
const { sendSuccess, sendError } = require('../../utils/response');

async function getByAcara(req, res) {
  try { sendSuccess(res, 'Dokumentasi berhasil diambil.', await svc.getByAcara(+req.params.acara_id)); }
  catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function create(req, res) {
  try {
    if (!req.files?.length) return sendError(res, 'Minimal satu file harus diunggah.', 400);
    await svc.create(+req.params.acara_id, req.files, req.body.keterangan);
    sendSuccess(res, 'Dokumentasi berhasil diunggah.', null, 201);
  } catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function update(req, res) {
  try { await svc.update(+req.params.id, req.body.keterangan); sendSuccess(res, 'Dokumentasi berhasil diperbarui.'); }
  catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function remove(req, res) {
  try { await svc.remove(+req.params.id); sendSuccess(res, 'Dokumentasi berhasil dihapus.'); }
  catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
module.exports = { getByAcara, create, update, remove };

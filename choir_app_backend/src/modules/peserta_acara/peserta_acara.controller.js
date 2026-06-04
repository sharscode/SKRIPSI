const svc = require('./peserta_acara.service');
const { sendSuccess, sendError } = require('../../utils/response');

async function getByAcara(req, res) {
  try { sendSuccess(res, 'Data peserta berhasil diambil.', await svc.getByAcara(+req.params.acara_id)); }
  catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function getByAnggota(req, res) {
  try { sendSuccess(res, 'Data acara anggota berhasil diambil.', await svc.getByAnggota(+req.params.anggota_id)); }
  catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function selfRegister(req, res) {
  try {
    await svc.selfRegister(req.user.id, +req.body.acara_id);
    sendSuccess(res, 'Berhasil mendaftar acara.', null, 201);
  } catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function manualRegister(req, res) {
  try {
    await svc.manualRegister(+req.body.anggota_id, +req.body.acara_id, req.user.id);
    sendSuccess(res, 'Anggota berhasil didaftarkan.', null, 201);
  } catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function updateApproval(req, res) {
  try {
    await svc.updateApproval(+req.params.id, req.body, req.user.id);
    sendSuccess(res, 'Status approval berhasil diperbarui.');
  } catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function updateStatusPeserta(req, res) {
  try {
    await svc.updateStatusPeserta(+req.params.id, req.body);
    sendSuccess(res, 'Status peserta berhasil diperbarui.');
  } catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function remove(req, res) {
  try { await svc.remove(+req.params.id); sendSuccess(res, 'Peserta berhasil dihapus.'); }
  catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
module.exports = { getByAcara, getByAnggota, selfRegister, manualRegister, updateApproval, updateStatusPeserta, remove };

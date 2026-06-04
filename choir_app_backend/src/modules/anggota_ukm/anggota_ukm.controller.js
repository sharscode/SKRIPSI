const svc = require('./anggota_ukm.service');
const { sendSuccess, sendError } = require('../../utils/response');

async function getAll(req, res) {
  try { sendSuccess(res, 'Data keanggotaan berhasil diambil.', await svc.getAll(req.query)); }
  catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function register(req, res) {
  try { sendSuccess(res, 'Anggota berhasil didaftarkan.', await svc.register(req.body), 201); }
  catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function updateStatus(req, res) {
  try {
    await svc.updateStatus(+req.params.id, req.body.status_keaktifan);
    sendSuccess(res, 'Status keanggotaan berhasil diperbarui.');
  } catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function getHistory(req, res) {
  try { sendSuccess(res, 'Riwayat keanggotaan berhasil diambil.', await svc.getHistory(+req.params.anggota_id)); }
  catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
module.exports = { getAll, register, updateStatus, getHistory };

const svc = require('./absensi.service');
const { sendSuccess, sendError } = require('../../utils/response');

async function scanQR(req, res) {
  try { sendSuccess(res, 'Absensi berhasil dicatat.', await svc.scanQR(req.body)); }
  catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function ajukanIzin(req, res) {
  try {
    // anggota_id diambil dari token, bukan dari body — supaya anggota tidak
    // bisa mengajukan izin atas nama orang lain.
    const data = await svc.ajukanIzin({ ...req.body, anggota_id: req.user.id });
    sendSuccess(res, 'Pengajuan izin tersimpan.', data);
  } catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function upsertStatus(req, res) {
  try { await svc.upsertStatus(req.body); sendSuccess(res, 'Status absensi berhasil diperbarui.'); }
  catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function getByLatihan(req, res) {
  try { sendSuccess(res, 'Data absensi latihan berhasil diambil.', await svc.getByLatihan(+req.params.latihan_id)); }
  catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function getByAnggota(req, res) {
  try { sendSuccess(res, 'Riwayat absensi berhasil diambil.', await svc.getByAnggota(+req.params.anggota_id)); }
  catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function getStatsByAcara(req, res) {
  try { sendSuccess(res, 'Statistik kehadiran berhasil diambil.', await svc.getStatsByAcara(+req.params.acara_id)); }
  catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
module.exports = { scanQR, ajukanIzin, upsertStatus, getByLatihan, getByAnggota, getStatsByAcara };

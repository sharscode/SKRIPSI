const svc = require('./skkk.service');
const { sendSuccess, sendError } = require('../../utils/response');

async function preview(req, res) {
  try {
    const excludeIds = req.query.exclude ? req.query.exclude.split(',').map(id => +id) : [];
    sendSuccess(res, 'Data SKKK berhasil diambil.', await svc.getPreview(+req.params.acara_id, excludeIds));
  } catch (err) { sendError(res, err.message, err.statusCode || 500); }
}

async function download(req, res) {
  try {
    const excludeIds = req.query.exclude ? req.query.exclude.split(',').map(id => +id) : [];
    const data = await svc.getPreview(+req.params.acara_id, excludeIds);
    const doc = await svc.generatePdf(+req.params.acara_id, excludeIds);
    const filename = `SKKK_${data.event.nama_acara.replace(/\s+/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);
  } catch (err) { sendError(res, err.message, err.statusCode || 500); }
}
async function belumDiajukan(req, res) {
  try {
    sendSuccess(res, 'Daftar acara belum diajukan SKKK berhasil diambil.', await svc.getBelumDiajukan());
  } catch (err) { sendError(res, err.message, err.statusCode || 500); }
}

async function setDiajukan(req, res) {
  try {
    const sudah = req.body.diajukan !== false;
    await svc.setDiajukan(+req.params.acara_id, sudah, req.user.id);
    sendSuccess(res, sudah ? 'SKKK ditandai sudah diajukan.' : 'Penandaan pengajuan SKKK dibatalkan.');
  } catch (err) { sendError(res, err.message, err.statusCode || 500); }
}

async function ringkasanSaya(req, res) {
  try {
    // anggota_id dari token, bukan dari parameter, supaya seorang anggota
    // tidak bisa melihat rekap kehadiran anggota lain.
    sendSuccess(res, 'Ringkasan kehadiran berhasil diambil.', await svc.getRingkasanAnggota(req.user.id));
  } catch (err) { sendError(res, err.message, err.statusCode || 500); }
}

module.exports = { preview, download, belumDiajukan, setDiajukan, ringkasanSaya };

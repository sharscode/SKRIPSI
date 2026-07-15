const svc = require('./rekap.service');
const { sendSuccess, sendError } = require('../../utils/response');

async function preview(req, res) {
  try {
    sendSuccess(res, 'Data rekap kegiatan berhasil diambil.', await svc.getPreview(+req.params.acara_id));
  } catch (err) { sendError(res, err.message, err.statusCode || 500); }
}

async function download(req, res) {
  try {
    const data = await svc.getPreview(+req.params.acara_id);
    const doc = await svc.generatePdf(+req.params.acara_id);
    const filename = `Rekap_${data.event.nama_acara.replace(/\s+/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);
  } catch (err) { sendError(res, err.message, err.statusCode || 500); }
}

module.exports = { preview, download };

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
module.exports = { preview, download };

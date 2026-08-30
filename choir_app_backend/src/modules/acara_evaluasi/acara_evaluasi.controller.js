const svc = require('./acara_evaluasi.service');
const { sendSuccess, sendError } = require('../../utils/response');

async function getBelumDievaluasi(req, res) {
  try {
    sendSuccess(res, 'Daftar acara belum dievaluasi berhasil diambil.', await svc.getBelumDievaluasi());
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
}

async function getByAcara(req, res) {
  try {
    sendSuccess(res, 'Evaluasi berhasil diambil.', await svc.getByAcara(+req.params.acara_id, req.user));
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
}

async function upsert(req, res) {
  try {
    sendSuccess(res, 'Evaluasi berhasil disimpan.', await svc.upsert(+req.params.acara_id, req.body, req.user.id));
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
}

async function remove(req, res) {
  try {
    await svc.remove(+req.params.acara_id);
    sendSuccess(res, 'Evaluasi berhasil dihapus.');
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
}

module.exports = { getBelumDievaluasi, getByAcara, upsert, remove };

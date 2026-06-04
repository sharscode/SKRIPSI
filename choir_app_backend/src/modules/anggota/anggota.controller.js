const svc = require('./anggota.service');
const { sendSuccess, sendError } = require('../../utils/response');

async function getAll(req, res) {
  try {
    const { page, limit, search, bagian_suara } = req.query;
    const result = await svc.getAll({ page: +page || 1, limit: +limit || 10, search, bagian_suara });
    sendSuccess(res, 'Data anggota berhasil diambil.', result);
  } catch (err) { sendError(res, err.message, err.statusCode || 500); }
}

async function getById(req, res) {
  try {
    const data = await svc.getById(+req.params.id);
    sendSuccess(res, 'Detail anggota berhasil diambil.', data);
  } catch (err) { sendError(res, err.message, err.statusCode || 500); }
}

async function create(req, res) {
  try {
    const data = await svc.create(req.body);
    sendSuccess(res, 'Anggota berhasil ditambahkan.', data, 201);
  } catch (err) { sendError(res, err.message, err.statusCode || 500); }
}

async function update(req, res) {
  try {
    const foto_path = req.file ? `photos/${req.file.filename}` : undefined;
    const data = await svc.update(+req.params.id, { ...req.body, foto_path });
    sendSuccess(res, 'Data anggota berhasil diperbarui.', data);
  } catch (err) { sendError(res, err.message, err.statusCode || 500); }
}

async function changePassword(req, res) {
  try {
    await svc.changePassword(+req.params.id, req.body);
    sendSuccess(res, 'Password berhasil diubah.');
  } catch (err) { sendError(res, err.message, err.statusCode || 500); }
}

async function remove(req, res) {
  try {
    await svc.remove(+req.params.id);
    sendSuccess(res, 'Anggota berhasil dihapus.');
  } catch (err) { sendError(res, err.message, err.statusCode || 500); }
}

module.exports = { getAll, getById, create, update, changePassword, remove };

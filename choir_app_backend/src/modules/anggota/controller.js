/**
 * @module modules/anggota/controller
 * @description Anggota route handlers.
 */

const anggotaService = require('./service');
const { sendSuccess, sendError } = require('../../utils/response');

async function getAll(req, res) {
  try {
    const { page, limit, search, bagian_suara } = req.query;
    const data = await anggotaService.getAll({ page, limit, search, bagian_suara });
    return sendSuccess(res, 'Daftar anggota berhasil diambil', data);
  } catch (err) {
    console.error('[Anggota] getAll error:', err.message);
    return sendError(res, 'Gagal mengambil daftar anggota', 500);
  }
}

async function getById(req, res) {
  try {
    const data = await anggotaService.getById(parseInt(req.params.id));
    return sendSuccess(res, 'Data anggota berhasil diambil', data);
  } catch (err) {
    console.error('[Anggota] getById error:', err.message);
    return sendError(res, err.message, err.statusCode || 500);
  }
}

async function create(req, res) {
  try {
    const data = await anggotaService.create(req.body);
    return sendSuccess(res, 'Anggota berhasil ditambahkan', data, 201);
  } catch (err) {
    console.error('[Anggota] create error:', err.message);
    return sendError(res, err.message, err.statusCode || 500);
  }
}

async function update(req, res) {
  try {
    const data = await anggotaService.update(parseInt(req.params.id), req.body);
    return sendSuccess(res, 'Anggota berhasil diperbarui', data);
  } catch (err) {
    console.error('[Anggota] update error:', err.message);
    return sendError(res, err.message, err.statusCode || 500);
  }
}

async function changePassword(req, res) {
  try {
    await anggotaService.changePassword(parseInt(req.params.id), req.body);
    return sendSuccess(res, 'Password berhasil diubah');
  } catch (err) {
    console.error('[Anggota] changePassword error:', err.message);
    return sendError(res, err.message, err.statusCode || 500);
  }
}

async function remove(req, res) {
  try {
    await anggotaService.remove(parseInt(req.params.id));
    return sendSuccess(res, 'Anggota berhasil dihapus');
  } catch (err) {
    console.error('[Anggota] remove error:', err.message);
    return sendError(res, err.message, err.statusCode || 500);
  }
}

module.exports = { getAll, getById, create, update, changePassword, remove };

/**
 * @module modules/admin/controller
 * @description Admin route handlers.
 */

const adminService = require('./service');
const { sendSuccess, sendError } = require('../../utils/response');

async function getAll(req, res) {
  try {
    const data = await adminService.getAll();
    return sendSuccess(res, 'Daftar admin berhasil diambil', data);
  } catch (err) {
    console.error('[Admin] getAll error:', err.message);
    return sendError(res, 'Gagal mengambil daftar admin', 500);
  }
}

async function getById(req, res) {
  try {
    const data = await adminService.getById(parseInt(req.params.id));
    return sendSuccess(res, 'Data admin berhasil diambil', data);
  } catch (err) {
    console.error('[Admin] getById error:', err.message);
    return sendError(res, err.message, err.statusCode || 500);
  }
}

async function create(req, res) {
  try {
    const data = await adminService.create(req.body);
    return sendSuccess(res, 'Admin berhasil ditambahkan', data, 201);
  } catch (err) {
    console.error('[Admin] create error:', err.message);
    return sendError(res, err.message, err.statusCode || 500);
  }
}

async function update(req, res) {
  try {
    const data = await adminService.update(parseInt(req.params.id), req.body);
    return sendSuccess(res, 'Admin berhasil diperbarui', data);
  } catch (err) {
    console.error('[Admin] update error:', err.message);
    return sendError(res, err.message, err.statusCode || 500);
  }
}

async function remove(req, res) {
  try {
    await adminService.remove(parseInt(req.params.id), req.user.id);
    return sendSuccess(res, 'Admin berhasil dihapus');
  } catch (err) {
    console.error('[Admin] remove error:', err.message);
    return sendError(res, err.message, err.statusCode || 500);
  }
}

module.exports = { getAll, getById, create, update, remove };

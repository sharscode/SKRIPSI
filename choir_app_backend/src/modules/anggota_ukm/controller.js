/**
 * @module modules/anggota_ukm/controller
 */

const service = require('./service');
const { sendSuccess, sendError } = require('../../utils/response');

async function getAll(req, res) {
  try {
    const data = await service.getAll(req.query);
    return sendSuccess(res, 'Data anggota UKM berhasil diambil', data);
  } catch (err) {
    console.error('[AnggotaUKM] getAll error:', err.message);
    return sendError(res, 'Gagal mengambil data anggota UKM', 500);
  }
}

async function create(req, res) {
  try {
    const data = await service.create(req.body);
    return sendSuccess(res, 'Anggota berhasil didaftarkan ke UKM', data, 201);
  } catch (err) {
    console.error('[AnggotaUKM] create error:', err.message);
    return sendError(res, err.message, err.statusCode || 500);
  }
}

async function updateStatus(req, res) {
  try {
    const data = await service.updateStatus(parseInt(req.params.id), req.body);
    return sendSuccess(res, 'Status anggota UKM berhasil diperbarui', data);
  } catch (err) {
    console.error('[AnggotaUKM] updateStatus error:', err.message);
    return sendError(res, err.message, err.statusCode || 500);
  }
}

async function getHistory(req, res) {
  try {
    const data = await service.getHistory(parseInt(req.params.anggota_id));
    return sendSuccess(res, 'Riwayat UKM berhasil diambil', data);
  } catch (err) {
    console.error('[AnggotaUKM] getHistory error:', err.message);
    return sendError(res, 'Gagal mengambil riwayat UKM', 500);
  }
}

module.exports = { getAll, create, updateStatus, getHistory };

const bcrypt = require('bcryptjs');
const { getPool, sql } = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');

// Settings module
const settingsRouter = require('express').Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

settingsRouter.get('/active-periode', auth, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().input('key', sql.VarChar, 'active_periode')
      .query('SELECT setting_value FROM settings WHERE setting_key=@key');
    sendSuccess(res, 'Periode aktif berhasil diambil.', { periode: result.recordset[0]?.setting_value });
  } catch (err) { sendError(res, err.message, 500); }
});

settingsRouter.put('/active-periode', auth, authorize('super_admin'), async (req, res) => {
  try {
    const { periode } = req.body;
    if (!periode) return sendError(res, 'Periode wajib diisi.', 400);
    const pool = await getPool();
    await pool.request().input('value', sql.VarChar, periode).input('key', sql.VarChar, 'active_periode')
      .query('UPDATE settings SET setting_value=@value, updated_at=GETDATE() WHERE setting_key=@key');
    sendSuccess(res, 'Periode aktif berhasil diperbarui.', { periode });
  } catch (err) { sendError(res, err.message, 500); }
});

settingsRouter.get('/periodes', auth, async (req, res) => {
  try {
    const pool = await getPool();
    const dbPeriods = await pool.request().query('SELECT DISTINCT periode FROM anggota_ukm ORDER BY periode DESC');
    const periodsSet = new Set(dbPeriods.recordset.map(r => r.periode));

    const settingsPeriods = await pool.request().input('key', sql.VarChar, 'periode_list')
      .query('SELECT setting_value FROM settings WHERE setting_key=@key');
    
    if (settingsPeriods.recordset[0]?.setting_value) {
      settingsPeriods.recordset[0].setting_value.split(',').forEach(p => {
        if (p.trim()) periodsSet.add(p.trim());
      });
    }

    const activePeriode = await pool.request().input('key', sql.VarChar, 'active_periode')
      .query('SELECT setting_value FROM settings WHERE setting_key=@key');
    if (activePeriode.recordset[0]?.setting_value) {
      periodsSet.add(activePeriode.recordset[0].setting_value.trim());
    }

    const sortedPeriods = Array.from(periodsSet).sort().reverse();
    sendSuccess(res, 'Daftar periode berhasil diambil.', sortedPeriods);
  } catch (err) { sendError(res, err.message, 500); }
});

settingsRouter.post('/periodes', auth, authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const { periode } = req.body;
    if (!periode) return sendError(res, 'Periode wajib diisi.', 400);
    if (!/^\d{4}\/\d{4}$/.test(periode)) return sendError(res, 'Format periode harus YYYY/YYYY (contoh: 2025/2026).', 400);

    const pool = await getPool();
    
    const current = await pool.request().input('key', sql.VarChar, 'periode_list')
      .query('SELECT setting_value FROM settings WHERE setting_key=@key');
    
    let newList = periode;
    if (current.recordset.length === 0) {
      await pool.request().input('key', sql.VarChar, 'periode_list').input('val', sql.VarChar, newList)
        .query('INSERT INTO settings (setting_key, setting_value) VALUES (@key, @val)');
    } else {
      const existing = current.recordset[0].setting_value || '';
      const parts = existing.split(',').map(p => p.trim()).filter(Boolean);
      if (!parts.includes(periode)) {
        parts.push(periode);
        newList = parts.join(',');
        await pool.request().input('val', sql.VarChar, newList).input('key', sql.VarChar, 'periode_list')
          .query('UPDATE settings SET setting_value=@val, updated_at=GETDATE() WHERE setting_key=@key');
      } else {
        newList = existing;
      }
    }
    sendSuccess(res, 'Periode baru berhasil ditambahkan.', { periode });
  } catch (err) { sendError(res, err.message, 500); }
});

// Admin module
const adminRouter = require('express').Router();

adminRouter.get('/', auth, authorize('super_admin'), async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT id, nama, email, role, created_at FROM admin 
      ORDER BY 
        CASE role
          WHEN 'super_admin' THEN 1
          WHEN 'admin' THEN 2
          ELSE 3
        END ASC,
        nama ASC
    `);
    sendSuccess(res, 'Data admin berhasil diambil.', result.recordset);
  } catch (err) { sendError(res, err.message, 500); }
});

adminRouter.get('/:id', auth, authorize('super_admin'), async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().input('id', sql.Int, +req.params.id)
      .query('SELECT id, nama, email, role, created_at FROM admin WHERE id=@id');
    if (!result.recordset[0]) return sendError(res, 'Admin tidak ditemukan.', 404);
    sendSuccess(res, 'Detail admin berhasil diambil.', result.recordset[0]);
  } catch (err) { sendError(res, err.message, 500); }
});

adminRouter.post('/', auth, authorize('super_admin'), async (req, res) => {
  try {
    const { nama, email, password, role } = req.body;
    const pool = await getPool();
    const dup = await pool.request().input('email', sql.VarChar, email).query('SELECT id FROM admin WHERE email=@email');
    if (dup.recordset.length > 0) return sendError(res, 'Email sudah digunakan.', 409);
    const hashed = await bcrypt.hash(password, 12);
    const result = await pool.request()
      .input('nama', sql.VarChar, nama).input('email', sql.VarChar, email)
      .input('password', sql.VarChar, hashed).input('role', sql.VarChar, role || 'admin')
      .query('INSERT INTO admin (nama, email, password, role) OUTPUT INSERTED.id, INSERTED.nama, INSERTED.email, INSERTED.role VALUES (@nama, @email, @password, @role)');
    sendSuccess(res, 'Admin berhasil ditambahkan.', result.recordset[0], 201);
  } catch (err) { sendError(res, err.message, 500); }
});

adminRouter.put('/:id', auth, authorize('super_admin'), async (req, res) => {
  try {
    const { nama, email, role } = req.body;
    const pool = await getPool();
    await pool.request().input('id', sql.Int, +req.params.id)
      .input('nama', sql.VarChar, nama).input('email', sql.VarChar, email).input('role', sql.VarChar, role)
      .query('UPDATE admin SET nama=@nama, email=@email, role=@role, updated_at=GETDATE() WHERE id=@id');
    sendSuccess(res, 'Admin berhasil diperbarui.');
  } catch (err) { sendError(res, err.message, 500); }
});

adminRouter.delete('/:id', auth, authorize('super_admin'), async (req, res) => {
  try {
    if (+req.params.id === req.user.id) return sendError(res, 'Tidak dapat menghapus akun sendiri.', 400);
    const pool = await getPool();
    await pool.request().input('id', sql.Int, +req.params.id).query('DELETE FROM admin WHERE id=@id');
    sendSuccess(res, 'Admin berhasil dihapus.');
  } catch (err) { sendError(res, err.message, 500); }
});

module.exports = { settingsRouter, adminRouter };

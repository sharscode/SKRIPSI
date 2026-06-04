const path = require('path');
const fs = require('fs');
const { getPool, sql } = require('../../config/db');

async function getByAcara(acara_id) {
  const pool = await getPool();
  const result = await pool.request().input('acara_id', sql.Int, acara_id)
    .query('SELECT * FROM dokumentasi WHERE acara_id=@acara_id ORDER BY uploaded_at DESC');
  return result.recordset;
}
async function create(acara_id, files, keterangan) {
  const pool = await getPool();
  const inserts = files.map(f => pool.request()
    .input('file_path', sql.VarChar, `dokumentasi/${f.filename}`)
    .input('keterangan', sql.VarChar, keterangan || null)
    .input('acara_id', sql.Int, acara_id)
    .query('INSERT INTO dokumentasi (file_path, keterangan, acara_id) VALUES (@file_path, @keterangan, @acara_id)'));
  await Promise.all(inserts);
}
async function update(id, keterangan) {
  const pool = await getPool();
  await pool.request().input('id', sql.Int, id).input('keterangan', sql.VarChar, keterangan)
    .query('UPDATE dokumentasi SET keterangan=@keterangan WHERE id=@id');
}
async function remove(id) {
  const pool = await getPool();
  const result = await pool.request().input('id', sql.Int, id).query('SELECT file_path FROM dokumentasi WHERE id=@id');
  if (result.recordset[0]) {
    const filePath = path.join(__dirname, '..', '..', '..', 'uploads', result.recordset[0].file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  await pool.request().input('id', sql.Int, id).query('DELETE FROM dokumentasi WHERE id=@id');
}
module.exports = { getByAcara, create, update, remove };

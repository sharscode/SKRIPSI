const path = require('path');
const fs = require('fs');
const { getPool, sql } = require('../../config/db');

async function getAll({ search, jenis_lagu }) {
  const pool = await getPool();
  const req = pool.request();
  let where = 'WHERE 1=1';
  if (search) { where += ' AND (judul LIKE @search OR komposer LIKE @search)'; req.input('search', sql.VarChar, `%${search}%`); }
  if (jenis_lagu) { where += ' AND jenis_lagu = @jenis_lagu'; req.input('jenis_lagu', sql.VarChar, jenis_lagu); }
  const result = await req.query(`SELECT * FROM partitur ${where} ORDER BY judul ASC`);
  return result.recordset;
}

async function getById(id) {
  const pool = await getPool();
  const result = await pool.request().input('id', sql.Int, id).query('SELECT * FROM partitur WHERE id=@id');
  if (!result.recordset[0]) throw { statusCode: 404, message: 'Partitur tidak ditemukan.' };
  return result.recordset[0];
}

async function getByAcara(acara_id) {
  const pool = await getPool();
  const result = await pool.request().input('acara_id', sql.Int, acara_id).query(`
    SELECT p.* FROM partitur p JOIN acara_partitur ap ON p.id=ap.partitur_id WHERE ap.acara_id=@acara_id`);
  return result.recordset;
}

async function create(data, filename) {
  const pool = await getPool();
  const result = await pool.request()
    .input('judul', sql.VarChar, data.judul).input('komposer', sql.VarChar, data.komposer)
    .input('jumlah_suara', sql.Int, +data.jumlah_suara).input('jenis_lagu', sql.VarChar, data.jenis_lagu)
    .input('file_pdf', sql.VarChar, `partitur/${filename}`)
    .query(`INSERT INTO partitur (judul, komposer, jumlah_suara, jenis_lagu, file_pdf)
            OUTPUT INSERTED.id VALUES (@judul, @komposer, @jumlah_suara, @jenis_lagu, @file_pdf)`);
  return getById(result.recordset[0].id);
}

async function update(id, data, filename) {
  const existing = await getById(id);
  const pool = await getPool();
  const file_pdf = filename ? `partitur/${filename}` : existing.file_pdf;
  if (filename) {
    const oldPath = path.join(__dirname, '..', '..', '..', 'uploads', existing.file_pdf);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }
  await pool.request()
    .input('id', sql.Int, id).input('judul', sql.VarChar, data.judul || existing.judul)
    .input('komposer', sql.VarChar, data.komposer || existing.komposer)
    .input('jumlah_suara', sql.Int, +data.jumlah_suara || existing.jumlah_suara)
    .input('jenis_lagu', sql.VarChar, data.jenis_lagu || existing.jenis_lagu)
    .input('file_pdf', sql.VarChar, file_pdf)
    .query('UPDATE partitur SET judul=@judul, komposer=@komposer, jumlah_suara=@jumlah_suara, jenis_lagu=@jenis_lagu, file_pdf=@file_pdf WHERE id=@id');
  return getById(id);
}

async function remove(id) {
  const existing = await getById(id);
  const pool = await getPool();
  const filePath = path.join(__dirname, '..', '..', '..', 'uploads', existing.file_pdf);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  await pool.request().input('id', sql.Int, id).query('DELETE FROM partitur WHERE id=@id');
}

async function linkAcara(acara_id, partitur_id) {
  await getById(partitur_id); // Verify partitur exists
  const pool = await getPool();
  const dup = await pool.request().input('a', sql.Int, acara_id).input('p', sql.Int, partitur_id)
    .query('SELECT id FROM acara_partitur WHERE acara_id=@a AND partitur_id=@p');
  if (dup.recordset.length > 0) throw { statusCode: 409, message: 'Partitur sudah terhubung ke acara ini.' };
  await pool.request().input('acara_id', sql.Int, acara_id).input('partitur_id', sql.Int, partitur_id)
    .query('INSERT INTO acara_partitur (acara_id, partitur_id) VALUES (@acara_id, @partitur_id)');
}

async function unlinkAcara(acara_id, partitur_id) {
  await getById(partitur_id); // Verify partitur exists
  const pool = await getPool();
  await pool.request().input('acara_id', sql.Int, acara_id).input('partitur_id', sql.Int, partitur_id)
    .query('DELETE FROM acara_partitur WHERE acara_id=@acara_id AND partitur_id=@partitur_id');
}

module.exports = { getAll, getById, getByAcara, create, update, remove, linkAcara, unlinkAcara };

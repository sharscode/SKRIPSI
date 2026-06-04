const { getPool, sql } = require('../../config/db');

async function getForUser(user) {
  const pool = await getPool();
  let query;
  if (user.role === 'anggota') {
    query = pool.request().input('anggota_id', sql.Int, user.id)
      .query('SELECT * FROM notification WHERE anggota_id=@anggota_id OR anggota_id IS NULL ORDER BY created_at DESC');
  } else {
    query = pool.request().query('SELECT * FROM notification ORDER BY created_at DESC');
  }
  const result = await query;
  return result.recordset;
}

async function send({ judul, pesan, tipe, anggota_id, acara_id, latihan_id }) {
  const pool = await getPool();
  await pool.request()
    .input('judul', sql.VarChar, judul).input('pesan', sql.VarChar, pesan)
    .input('tipe', sql.VarChar, tipe)
    .input('anggota_id', sql.Int, anggota_id || null)
    .input('acara_id', sql.Int, acara_id || null)
    .input('latihan_id', sql.Int, latihan_id || null)
    .query('INSERT INTO notification (judul, pesan, tipe, anggota_id, acara_id, latihan_id) VALUES (@judul, @pesan, @tipe, @anggota_id, @acara_id, @latihan_id)');
}

async function markRead(id, user) {
  const pool = await getPool();
  await pool.request().input('id', sql.Int, id)
    .query('UPDATE notification SET is_read=1 WHERE id=@id');
}

async function markAllRead(user) {
  const pool = await getPool();
  if (user.role === 'anggota') {
    await pool.request().input('anggota_id', sql.Int, user.id)
      .query('UPDATE notification SET is_read=1 WHERE anggota_id=@anggota_id OR anggota_id IS NULL');
  } else {
    await pool.request().query('UPDATE notification SET is_read=1');
  }
}

module.exports = { getForUser, send, markRead, markAllRead };

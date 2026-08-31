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

/**
 * Kirim satu notifikasi ke SETIAP anggota aktif pada periode berjalan.
 *
 * Sengaja membuat satu baris per anggota (fan-out), bukan satu baris siaran
 * dengan anggota_id NULL. Kolom is_read hanya ada satu per baris, jadi baris
 * siaran akan membuat status baca dipakai bersama — begitu satu anggota
 * membacanya, anggota lain ikut tertandai sudah membaca.
 *
 * @returns {Promise<number>} jumlah anggota yang menerima notifikasi
 */
async function sendToAnggotaAktif({ judul, pesan, tipe, acara_id, latihan_id }) {
  // Penerima ditentukan oleh periode berjalan, jadi pastikan periodenya mutakhir
  // sebelum menentukan siapa yang aktif.
  try {
    await require('../../utils/periodeAkademik').sinkronkanPeriodeAktif();
  } catch (err) {
    console.error('[notification] Gagal menyelaraskan periode:', err.message);
  }

  const pool = await getPool();
  const result = await pool.request()
    .input('judul', sql.VarChar, judul)
    .input('pesan', sql.VarChar, pesan)
    .input('tipe', sql.VarChar, tipe)
    .input('acara_id', sql.Int, acara_id || null)
    .input('latihan_id', sql.Int, latihan_id || null)
    .query(`
      INSERT INTO notification (judul, pesan, tipe, anggota_id, acara_id, latihan_id)
      SELECT @judul, @pesan, @tipe, a.id, @acara_id, @latihan_id
      FROM anggota a
      JOIN anggota_ukm au ON au.anggota_id = a.id
      WHERE au.status_keaktifan = 'aktif'
        AND au.periode = (SELECT setting_value FROM settings WHERE setting_key = 'active_periode')
    `);
  return result.rowsAffected[0];
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
  const request = pool.request().input('id', sql.Int, id);

  // Anggota hanya boleh menandai notifikasi miliknya sendiri (atau notifikasi umum
  // tanpa pemilik). Tanpa syarat ini, siapa pun bisa menandai notifikasi orang lain
  // sudah dibaca hanya dengan menebak id-nya.
  if (user && user.role === 'anggota') {
    request.input('anggota_id', sql.Int, user.id);
    await request.query(
      'UPDATE notification SET is_read=1 WHERE id=@id AND anggota_id=@anggota_id'
    );
    return;
  }

  await request.query('UPDATE notification SET is_read=1 WHERE id=@id');
}

async function markAllRead(user) {
  const pool = await getPool();
  if (user.role === 'anggota') {
    // Hanya baris milik sendiri. Baris siaran (anggota_id NULL) sengaja tidak
    // disentuh: is_read hanya ada satu per baris, jadi menandainya di sini
    // membuat notifikasi itu ikut tertandai terbaca bagi semua anggota lain.
    await pool.request().input('anggota_id', sql.Int, user.id)
      .query('UPDATE notification SET is_read=1 WHERE anggota_id=@anggota_id');
  } else {
    await pool.request().query('UPDATE notification SET is_read=1');
  }
}

module.exports = { getForUser, send, sendToAnggotaAktif, markRead, markAllRead };

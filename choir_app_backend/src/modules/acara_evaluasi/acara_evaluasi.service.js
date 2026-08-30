/**
 * Acara Evaluasi Service — catatan & penilaian kegiatan pasca-acara.
 * Ditulis admin setelah acara berstatus 'selesai'.
 */
const { getPool, sql } = require('../../config/db');

/**
 * Pastikan acara ada dan sudah selesai.
 * Evaluasi hanya masuk akal untuk kegiatan yang sudah berlangsung.
 */
async function assertAcaraSelesai(acara_id) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, acara_id)
    .query('SELECT id, status FROM acara WHERE id = @id');

  const acara = result.recordset[0];
  if (!acara) throw { statusCode: 404, message: 'Acara tidak ditemukan.' };
  if (acara.status !== 'selesai') {
    throw {
      statusCode: 400,
      message: 'Evaluasi hanya bisa diisi setelah acara berstatus selesai.',
    };
  }
  return acara;
}

/**
 * Ambil evaluasi sebuah acara. Mengembalikan null bila belum ada.
 * @param {object} [user] - bila role 'anggota', evaluasi tertutup disembunyikan.
 */
async function getByAcara(acara_id, user) {
  const pool = await getPool();
  const result = await pool.request()
    .input('acara_id', sql.Int, acara_id)
    .query(`
      SELECT e.*, a.nama AS nama_admin
      FROM acara_evaluasi e
      LEFT JOIN admin a ON a.id = e.created_by
      WHERE e.acara_id = @acara_id
    `);

  const evaluasi = result.recordset[0] || null;
  if (!evaluasi) return null;

  // Anggota hanya boleh melihat evaluasi yang sengaja dibuka.
  if (user && user.role === 'anggota') {
    if (!evaluasi.is_publik) return null;
    return {
      acara_id: evaluasi.acara_id,
      skor: evaluasi.skor,
      catatan: evaluasi.catatan,
      created_at: evaluasi.created_at,
    };
  }

  return evaluasi;
}

/**
 * Simpan evaluasi. Satu evaluasi per acara — memanggil ulang akan memperbaruinya.
 */
async function upsert(acara_id, data, adminId) {
  await assertAcaraSelesai(acara_id);
  const pool = await getPool();

  const existing = await pool.request()
    .input('acara_id', sql.Int, acara_id)
    .query('SELECT id FROM acara_evaluasi WHERE acara_id = @acara_id');

  const request = pool.request()
    .input('acara_id', sql.Int, acara_id)
    .input('skor', sql.Int, data.skor === undefined || data.skor === null || data.skor === '' ? null : +data.skor)
    .input('catatan', sql.VarChar, data.catatan)
    .input('kendala', sql.VarChar, data.kendala || null)
    .input('saran', sql.VarChar, data.saran || null)
    .input('is_publik', sql.Bit, data.is_publik ? 1 : 0)
    .input('created_by', sql.Int, adminId);

  if (existing.recordset[0]) {
    await request.query(`
      UPDATE acara_evaluasi
      SET skor = @skor, catatan = @catatan, kendala = @kendala, saran = @saran,
          is_publik = @is_publik, created_by = @created_by, updated_at = GETDATE()
      WHERE acara_id = @acara_id
    `);
  } else {
    await request.query(`
      INSERT INTO acara_evaluasi (acara_id, skor, catatan, kendala, saran, is_publik, created_by)
      VALUES (@acara_id, @skor, @catatan, @kendala, @saran, @is_publik, @created_by)
    `);
  }

  return getByAcara(acara_id);
}

async function remove(acara_id) {
  const pool = await getPool();
  const result = await pool.request()
    .input('acara_id', sql.Int, acara_id)
    .query('DELETE FROM acara_evaluasi WHERE acara_id = @acara_id');

  if (result.rowsAffected[0] === 0) {
    throw { statusCode: 404, message: 'Evaluasi tidak ditemukan.' };
  }
}

/**
 * Acara yang sudah selesai tapi belum dievaluasi.
 * Dipakai penanda di daftar acara dan kartu dashboard.
 */
async function getBelumDievaluasi() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT a.id, a.nama_acara, a.tanggal, a.jenis_kegiatan, a.lokasi
    FROM acara a
    LEFT JOIN acara_evaluasi e ON e.acara_id = a.id
    WHERE a.status = 'selesai' AND e.id IS NULL
    ORDER BY a.tanggal DESC
  `);
  return result.recordset;
}

module.exports = { getByAcara, upsert, remove, getBelumDievaluasi };

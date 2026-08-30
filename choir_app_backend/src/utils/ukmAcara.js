/**
 * Acara "UKM" — wadah tetap untuk seluruh kegiatan rutin.
 *
 * Aturan sistem: setiap latihan harus terhubung ke sebuah acara.
 * Latihan bertipe 'rutin' tidak dibuat untuk acara tertentu, jadi semuanya
 * bermuara ke satu acara payung bernama "UKM", dan seluruh anggota aktif
 * pada periode berjalan otomatis menjadi pesertanya.
 *
 * Id acara UKM disimpan di settings.ukm_acara_id (dibuat oleh migrasi
 * 2026-08-20_ukm_acara.sql).
 */
const { getPool, sql } = require('../config/db');

/**
 * Ambil id acara "UKM".
 *
 * Membaca settings lebih dulu, lalu jatuh ke pencarian berdasarkan nama —
 * setting bisa hilang kalau database dibangun ulang tanpa menjalankan migrasi.
 * Nilai yang ditemukan lewat nama sekalian ditulis balik ke settings supaya
 * pencarian berikutnya murah.
 *
 * @returns {Promise<number>}
 */
async function getUkmAcaraId() {
  const pool = await getPool();

  const fromSettings = await pool.request().query(`
    SELECT a.id
    FROM settings s
    JOIN acara a ON a.id = TRY_CAST(s.setting_value AS INT)
    WHERE s.setting_key = 'ukm_acara_id'
  `);
  if (fromSettings.recordset[0]) return fromSettings.recordset[0].id;

  const byName = await pool.request()
    .query("SELECT TOP 1 id FROM acara WHERE nama_acara = 'UKM' ORDER BY id ASC");
  if (!byName.recordset[0]) {
    throw {
      statusCode: 500,
      message: 'Acara "UKM" belum ada. Jalankan migrasi database/migrations/2026-08-20_ukm_acara.sql.',
    };
  }

  const ukmId = byName.recordset[0].id;
  await pool.request()
    .input('value', sql.VarChar, String(ukmId))
    .query(`
      IF EXISTS (SELECT 1 FROM settings WHERE setting_key = 'ukm_acara_id')
        UPDATE settings SET setting_value = @value, updated_at = GETDATE() WHERE setting_key = 'ukm_acara_id';
      ELSE
        INSERT INTO settings (setting_key, setting_value) VALUES ('ukm_acara_id', @value);
    `);
  return ukmId;
}

/**
 * Samakan daftar peserta acara UKM dengan daftar anggota aktif periode berjalan.
 *
 * Menambahkan anggota aktif yang belum terdaftar, dan mengeluarkan anggota yang
 * sudah tidak aktif. Pengeluaran ini sejalan dengan perilaku yang sudah ada:
 * syncAbsensiList() juga membersihkan baris absensi 'alpha' milik anggota
 * non-aktif pada latihan rutin. Riwayat kehadiran tidak ikut terhapus karena
 * absensi tidak bergantung pada peserta_acara.
 *
 * @returns {Promise<{ditambah: number, dikeluarkan: number}>}
 */
async function syncPesertaUkm() {
  const pool = await getPool();
  const ukmAcaraId = await getUkmAcaraId();

  // approved_by wajib diisi; pakai admin pembuat acara UKM.
  const acara = await pool.request()
    .input('id', sql.Int, ukmAcaraId)
    .query('SELECT created_by FROM acara WHERE id = @id');
  const adminId = acara.recordset[0]?.created_by;
  if (!adminId) {
    throw { statusCode: 500, message: 'Acara UKM tidak punya admin pembuat.' };
  }

  const added = await pool.request()
    .input('acara_id', sql.Int, ukmAcaraId)
    .input('approved_by', sql.Int, adminId)
    .query(`
      INSERT INTO peserta_acara (anggota_id, acara_id, approval_status, status_peserta, approved_by)
      SELECT a.id, @acara_id, 'disetujui', 'ikut', @approved_by
      FROM anggota a
      JOIN anggota_ukm au ON au.anggota_id = a.id
      WHERE au.status_keaktifan = 'aktif'
        AND au.periode = (SELECT setting_value FROM settings WHERE setting_key = 'active_periode')
        AND NOT EXISTS (
          SELECT 1 FROM peserta_acara pa
          WHERE pa.acara_id = @acara_id AND pa.anggota_id = a.id
        )
    `);

  const removed = await pool.request()
    .input('acara_id', sql.Int, ukmAcaraId)
    .query(`
      DELETE FROM peserta_acara
      WHERE acara_id = @acara_id
        AND anggota_id NOT IN (
          SELECT a.id
          FROM anggota a
          JOIN anggota_ukm au ON au.anggota_id = a.id
          WHERE au.status_keaktifan = 'aktif'
            AND au.periode = (SELECT setting_value FROM settings WHERE setting_key = 'active_periode')
        )
    `);

  return { ditambah: added.rowsAffected[0], dikeluarkan: removed.rowsAffected[0] };
}

module.exports = { getUkmAcaraId, syncPesertaUkm };

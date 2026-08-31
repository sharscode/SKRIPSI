/**
 * Periode Akademik — penentuan dan pemeliharaan periode berjalan.
 *
 * Periode ditulis 'YYYY/YYYY' dan berjalan 1 Agustus sampai 31 Juli.
 *
 * settings.active_periode dipakai lima modul sebagai kebenaran sistem: siapa
 * anggota aktif saat ini, siapa penerima notifikasi, dan dasar statistik.
 * Karena itu nilainya tidak boleh bergantung pada seseorang yang ingat
 * memperbaruinya tiap Agustus — nilainya diturunkan dari tanggal, dan
 * diselaraskan sendiri saat ditemukan tertinggal.
 */
const { getPool, sql } = require('../config/db');

/** Bulan awal periode akademik (1 = Januari). */
const BULAN_AWAL = 8;

/**
 * Periode akademik yang memuat sebuah tanggal.
 * @param {Date} [tanggal] - default hari ini
 * @returns {string} misal '2026/2027'
 */
function hitungPeriode(tanggal = new Date()) {
  const tahunMulai = tanggal.getMonth() + 1 >= BULAN_AWAL
    ? tanggal.getFullYear()
    : tanggal.getFullYear() - 1;
  return `${tahunMulai}/${tahunMulai + 1}`;
}

/**
 * Pastikan settings.active_periode sesuai tanggal hari ini.
 *
 * Dipanggil saat server menyala dan pada jalur yang bergantung pada periode,
 * sehingga pergantian tahun akademik tidak perlu tindakan manual. Semua query
 * lain tetap membaca settings seperti biasa — tidak ada yang perlu diubah.
 *
 * @returns {Promise<{periode: string, berubah: boolean}>}
 */
async function sinkronkanPeriodeAktif() {
  const seharusnya = hitungPeriode();
  const pool = await getPool();

  const hasil = await pool.request()
    .query("SELECT setting_value FROM settings WHERE setting_key = 'active_periode'");
  const tersimpan = hasil.recordset[0]?.setting_value;

  if (tersimpan === seharusnya) {
    return { periode: seharusnya, berubah: false };
  }

  await pool.request()
    .input('value', sql.VarChar, seharusnya)
    .query(`
      IF EXISTS (SELECT 1 FROM settings WHERE setting_key = 'active_periode')
        UPDATE settings SET setting_value = @value, updated_at = GETDATE()
        WHERE setting_key = 'active_periode';
      ELSE
        INSERT INTO settings (setting_key, setting_value) VALUES ('active_periode', @value);
    `);

  console.log(`[periode] Periode berjalan diperbarui: ${tersimpan || '(kosong)'} -> ${seharusnya}`);
  return { periode: seharusnya, berubah: true };
}

module.exports = { hitungPeriode, sinkronkanPeriodeAktif };

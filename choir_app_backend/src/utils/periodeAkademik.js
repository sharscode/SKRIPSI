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
 * Periode dalam format yang dipakai formulir SKKK BAKA: '<semester>-YYYY/YYYY'.
 *
 * Semester 1 berjalan Agustus sampai Januari, semester 2 Februari sampai Juli.
 * Rumus ini diturunkan dari dua contoh formulir resmi: logdate Oktober 2024
 * tercetak '1-2024/2025', dan logdate Mei 2025 tercetak '2-2024/2025'.
 *
 * @param {Date} [tanggal] - default hari ini
 * @returns {string} misal '1-2026/2027'
 */
function hitungPeriodeSkkk(tanggal = new Date()) {
  const bulan = tanggal.getMonth() + 1;
  const semester = bulan >= BULAN_AWAL || bulan === 1 ? 1 : 2;
  return `${semester}-${hitungPeriode(tanggal)}`;
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
  // Dimuat di sini, bukan di puncak berkas: hitungPeriode() dan
  // hitungPeriodeSkkk() adalah fungsi murni tanggal, dan pemanggilnya
  // (antara lain pencetak PDF) tidak seharusnya ikut menarik konfigurasi
  // database hanya untuk memakainya.
  const { getPool, sql } = require('../config/db');

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

module.exports = { hitungPeriode, hitungPeriodeSkkk, sinkronkanPeriodeAktif };

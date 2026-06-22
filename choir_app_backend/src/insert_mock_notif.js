const { getPool, sql } = require('./config/db');

async function run() {
  try {
    const pool = await getPool();
    
    // Insert mock notifications for Member ID 5
    await pool.request()
      .input('judul1', sql.VarChar, 'Pendaftaran Disetujui')
      .input('pesan1', sql.VarChar, 'Pendaftaran Anda untuk Konser Natal 2026 telah disetujui.')
      .input('tipe1', sql.VarChar, 'approval')
      .input('anggota_id', sql.Int, 5)
      .query('INSERT INTO notification (judul, pesan, tipe, anggota_id) VALUES (@judul1, @pesan1, @tipe1, @anggota_id)');
      
    await pool.request()
      .input('judul2', sql.VarChar, 'Pengingat Latihan')
      .input('pesan2', sql.VarChar, 'Latihan rutin dijadwalkan pada hari Jumat, 19 Juni 2026 pukul 16:00 WIB di EH.405.')
      .input('tipe2', sql.VarChar, 'reminder_latihan')
      .input('anggota_id', sql.Int, 5)
      .query('INSERT INTO notification (judul, pesan, tipe, anggota_id) VALUES (@judul2, @pesan2, @tipe2, @anggota_id)');
      
    console.log('Successfully inserted mock notifications for Member ID 5!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();

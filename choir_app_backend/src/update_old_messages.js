const { getPool, closePool } = require('./config/db');

async function main() {
  try {
    const pool = await getPool();
    
    // Update routine exercise reminders:
    // "Latihan rutin dijadwalkan pada hari Jumat, 19 Juni 2026..." -> "Latihan UKM hari Jumat, 19 Juni 2026..."
    console.log('Updating routine exercise notification messages...');
    const result1 = await pool.request().query(`
      UPDATE notification
      SET pesan = REPLACE(pesan, 'Latihan rutin dijadwalkan pada hari ', 'Latihan UKM hari ')
      WHERE tipe = 'reminder_latihan' AND pesan LIKE 'Latihan rutin dijadwalkan pada hari %'
    `);
    console.log('Routine notifications updated:', result1.rowsAffected[0]);

    // Update event prep exercise reminders:
    // "Latihan untuk acara "Konser Natal 2026" dijadwalkan pada hari Jumat, 19 Juni 2026..." -> "Latihan "Konser Natal 2026" hari Jumat, 19 Juni 2026..."
    console.log('Updating event prep notification messages...');
    const result2 = await pool.request().query(`
      UPDATE notification
      SET pesan = REPLACE(REPLACE(pesan, 'Latihan untuk acara "', 'Latihan "'), ' dijadwalkan pada hari ', ' hari ')
      WHERE tipe = 'reminder_latihan' AND pesan LIKE 'Latihan untuk acara "%" dijadwalkan pada hari %'
    `);
    console.log('Event prep notifications updated:', result2.rowsAffected[0]);

  } catch (err) {
    console.error('Error updating notifications:', err);
  } finally {
    await closePool();
  }
}

main();

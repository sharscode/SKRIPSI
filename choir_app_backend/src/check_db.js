const { getPool } = require('./config/db');

async function run() {
  try {
    const pool = await getPool();
    console.log('--- ACARA ---');
    const acara = await pool.request().query('SELECT * FROM acara');
    console.log(acara.recordset);
    
    console.log('--- PESERTA ACARA ---');
    const peserta = await pool.request().query('SELECT * FROM peserta_acara');
    console.log(peserta.recordset);
    
    console.log('--- ANGGOTA ---');
    const anggota = await pool.request().query('SELECT * FROM anggota');
    console.log(anggota.recordset.map(a => ({ id: a.id, nrp: a.nrp, nama: a.nama_lengkap, email: a.email })));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();

/**
 * Fix Database Partitur Paths Script
 * Connects to AWS RDS and updates the file_pdf paths of seeded partitur items
 * to include the 'partitur/' prefix.
 */
const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

async function run() {
  console.log('🔌 Connecting to AWS RDS database...');
  let pool;
  try {
    pool = await sql.connect(config);
    console.log('✅ Connected to database.');

    console.log('📝 Updating file_pdf paths in partitur table...');
    const result = await pool.request().query(`
      UPDATE partitur 
      SET file_pdf = 'partitur/' + file_pdf 
      WHERE file_pdf NOT LIKE 'partitur/%' 
        AND file_pdf NOT LIKE 'uploads/%'
    `);
    console.log(`✅ Paths updated successfully! Rows affected: ${result.rowsAffected[0]}`);

    await pool.close();
    console.log('🎉 Fix complete!');
  } catch (err) {
    console.error('❌ Failed to run database fix:', err.message);
    if (pool) await pool.close();
    process.exit(1);
  }
}

run();

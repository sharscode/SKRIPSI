/**
 * SQL Server Database Connection Pool (Singleton)
 * Uses mssql package with connection pooling.
 * Connects via TCP port 1433 (SQL Server Express with TCP enabled).
 */
const sql = require('mssql');
const config = require('./env');

let pool = null;

/**
 * Get or create the database connection pool.
 * @returns {Promise<sql.ConnectionPool>}
 */
async function getPool() {
  if (pool) return pool;

  const dbConfig = {
    server: config.db.server,        // e.g. 'localhost'
    database: config.db.database,
    user: config.db.user,
    password: config.db.password,
    port: 1433,
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
    connectionTimeout: 30000,
    requestTimeout: 30000,
  };

  try {
    pool = await sql.connect(dbConfig);
    console.log('✅ Connected to SQL Server:', config.db.database);
    return pool;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
}

/**
 * Close the database connection pool.
 */
async function closePool() {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('🔌 Database connection closed.');
  }
}

module.exports = { getPool, closePool, sql };

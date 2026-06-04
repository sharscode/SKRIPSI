/**
 * Server Entry Point
 * Connects to database then starts Express server with graceful shutdown.
 */
const app = require('./app');
const { getPool, closePool } = require('./config/db');
const config = require('./config/env');

async function startServer() {
  // 1. Connect to database
  await getPool();

  // 2. Start HTTP server
  const server = app.listen(config.port, () => {
    console.log(`\n🎵 PCU Choir API v2.0 running`);
    console.log(`   Port: ${config.port}`);
    console.log(`   Env:  ${config.nodeEnv}`);
    console.log(`   URL:  http://localhost:${config.port}`);
    console.log(`   Health: http://localhost:${config.port}/health\n`);
  });

  // 3. Graceful shutdown
  async function shutdown(signal) {
    console.log(`\n📴 ${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await closePool();
      console.log('✅ Server closed.');
      process.exit(0);
    });
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // 4. Unhandled rejection safety net
  process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Promise Rejection:', reason);
  });
}

startServer().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

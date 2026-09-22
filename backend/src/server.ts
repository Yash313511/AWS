import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase, checkDatabaseConnection } from './config/database.js';

const app = createApp();
const PORT = env.PORT;

const server = app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(` Cloud-Based Secure File Exchange - Backend Server `);
  console.log(`====================================================`);
  console.log(`[SERVER] Running in ${env.NODE_ENV} mode on port ${PORT}`);
  console.log(`[STORAGE] Driver: ${env.STORAGE_DRIVER}`);

  try {
    await connectDatabase();
    console.log(`[DATABASE] Connected to MongoDB successfully.`);
  } catch (err: any) {
    console.warn(`[DATABASE] Warning: MongoDB connection failed (${err.message}). Retrying in background...`);
  }
  console.log(`[READY] API endpoints available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`\n[SHUTDOWN] Received ${signal}. Closing server gracefully...`);
  server.close(async () => {
    console.log('[SHUTDOWN] HTTP server closed.');
    await disconnectDatabase();
    console.log('[SHUTDOWN] MongoDB connection closed. Exiting process.');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

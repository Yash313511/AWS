import { createApp } from '../backend/src/app.js';
import { connectDatabase } from '../backend/src/config/database.js';

// Cache the Express app instance across warm invocations
let appInstance: ReturnType<typeof createApp> | null = null;

// Track connection state to avoid reconnecting on every request
let dbConnected = false;

export default async function handler(req: any, res: any) {
  // Connect to MongoDB (cached connection)
  if (!dbConnected) {
    try {
      await connectDatabase();
      dbConnected = true;
    } catch (err: any) {
      console.error('[VERCEL_HANDLER] DB connection failed:', err.message);
      // Continue — the app handles DB errors gracefully per-request
    }
  }

  // Lazily create and cache Express app
  if (!appInstance) {
    appInstance = createApp();
  }

  return appInstance(req, res);
}

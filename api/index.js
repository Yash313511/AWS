import { createApp } from '../backend/dist/app.js';
import { connectDatabase } from '../backend/dist/config/database.js';

// Cache the Express app instance across warm invocations
let appInstance = null;
let dbConnected = false;

export default async function handler(req, res) {
  // Connect to MongoDB (cached connection)
  if (!dbConnected) {
    try {
      await connectDatabase();
      dbConnected = true;
    } catch (err) {
      console.error('[VERCEL_HANDLER] DB connection failed:', err.message);
    }
  }

  // Lazily create and cache Express app
  if (!appInstance) {
    appInstance = createApp();
  }

  return appInstance(req, res);
}

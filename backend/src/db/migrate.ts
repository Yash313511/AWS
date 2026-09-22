import { connectDatabase, disconnectDatabase } from '../config/database.js';
import {
  FileModel,
  TransferModel,
  AccessLogModel,
  TransferSecurityTrackingModel,
} from '../models/index.js';

export const runMigrations = async () => {
  console.log('[MIGRATION] Initializing MongoDB connection and syncing indexes...');
  try {
    await connectDatabase();

    // Ensure all model indexes are created in MongoDB
    await Promise.all([
      FileModel.syncIndexes(),
      TransferModel.syncIndexes(),
      AccessLogModel.syncIndexes(),
      TransferSecurityTrackingModel.syncIndexes(),
    ]);

    console.log('[MIGRATION] MongoDB indexes synchronized successfully.');
  } catch (error) {
    console.error('[MIGRATION_FAILED] Index synchronization failed:', error);
    throw error;
  }
};

// Allow direct execution via `npm run db:migrate`
if (process.argv[1]?.includes('migrate')) {
  runMigrations()
    .then(async () => {
      await disconnectDatabase();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(err);
      await disconnectDatabase();
      process.exit(1);
    });
}

import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;

export const connectDatabase = async (): Promise<typeof mongoose> => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    return conn;
  } catch (err: any) {
    isConnected = false;
    console.error('[DATABASE_CONNECTION_ERROR] Failed to connect to MongoDB:', err.message);
    throw err;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
  }
};

export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    const currentReadyState: number = mongoose.connection.readyState;
    if (currentReadyState === 1) {
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
        return true;
      }
      return true;
    }

    // Attempt connection if not connected
    const conn = await connectDatabase();
    return (conn.connection.readyState as number) === 1;
  } catch (err) {
    return false;
  }
};

mongoose.connection.on('connected', () => {
  isConnected = true;
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  console.error('[DATABASE_ERROR] MongoDB error:', err.message);
});

import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

let bucket: GridFSBucket | null = null;

/**
 * Returns (and lazily initialises) the shared GridFSBucket instance.
 * Must be called after mongoose.connection is open.
 */
export const getGridFSBucket = (): GridFSBucket => {
  if (bucket && mongoose.connection.readyState === 1) {
    return bucket;
  }

  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    throw new Error('MongoDB connection is not open. Cannot access GridFS bucket.');
  }

  bucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads',
  });

  return bucket;
};

/** Call this when the mongoose connection is re-established. */
export const resetGridFSBucket = (): void => {
  bucket = null;
};

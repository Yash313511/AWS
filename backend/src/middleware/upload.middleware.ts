import multer from 'multer';
import { env } from '../config/env.js';

// Use memory storage for direct buffer streaming to S3/local driver
const storage = multer.memoryStorage();

const maxSizeBytes = env.MAX_FILE_SIZE_MB * 1024 * 1024;

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: maxSizeBytes,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    // Basic file validation
    if (!file.originalname || file.originalname.trim() === '') {
      return cb(new Error('Invalid filename. Please select a valid file.'));
    }
    cb(null, true);
  },
});

import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5001),
  CORS_ORIGIN: z.string().default('*'),
  MONGODB_URI: z
    .string()
    .default(
      process.env.MONGODB_URI ||
        process.env.DATABASE_URL ||
        'mongodb://localhost:27017/file_exchange'
    ),
  STORAGE_DRIVER: z.enum(['gridfs', 's3', 'local', 'auto']).default('gridfs'),
  PIN_PEPPER: z.string().default('secure_file_exchange_pepper_default_2026'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(25),
  PRESIGNED_URL_EXPIRY_SECONDS: z.coerce.number().default(300),
  BRUTE_FORCE_MAX_ATTEMPTS: z.coerce.number().default(5),
  BRUTE_FORCE_LOCKOUT_MINUTES: z.coerce.number().default(15),
});

export const env = envSchema.parse(process.env);

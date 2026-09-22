import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import healthRoutes from './routes/health.routes.js';
import fileRoutes from './routes/file.routes.js';
import transferRoutes from './routes/transfer.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import { generalApiLimiter } from './middleware/rateLimit.middleware.js';

export const createApp = (): Express => {
  const app = express();

  // Trust proxy for reverse proxies and serverless environments (Vercel, AWS ALB, NGINX)
  app.set('trust proxy', 1);

  // 1. Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production',
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // 2. CORS configuration (PRD Section 33)
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*') || env.NODE_ENV === 'development') {
          return callback(null, true);
        }
        return callback(new Error('Blocked by CORS policy'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // 3. Request parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 4. Global API rate limiting
  app.use('/api', generalApiLimiter);

  // 5. Routes
  app.use('/api/health', healthRoutes);
  app.use('/api/files', fileRoutes);
  app.use('/api/transfers', transferRoutes);

  // 6. 404 Route handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: 'API endpoint not found.',
    });
  });

  // 7. Centralized Error Handler
  app.use(errorHandler);

  return app;
};

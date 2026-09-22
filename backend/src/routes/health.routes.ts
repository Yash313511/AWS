import { Router, Request, Response } from 'express';
import { checkDatabaseConnection } from '../config/database.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const dbOk = await checkDatabaseConnection();
  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'ok' : 'degraded',
    service: 'secure-file-exchange-api',
    database: dbOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

export default router;

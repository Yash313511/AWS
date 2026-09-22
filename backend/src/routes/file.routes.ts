import { Router } from 'express';
import { fileController } from '../controllers/file.controller.js';
import { uploadMiddleware } from '../middleware/upload.middleware.js';
import { uploadLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// Upload a single file (PRD Section 26)
router.post('/upload', uploadLimiter, uploadMiddleware.single('file'), fileController.upload);

// Direct download route for development/local signed URLs
router.get('/download-direct/:token', fileController.downloadDirect);

export default router;

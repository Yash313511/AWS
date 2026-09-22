import { Router } from 'express';
import { transferController } from '../controllers/transfer.controller.js';
import { authEndpointLimiter, generalApiLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// Get public safe transfer metadata (PRD Section 27)
router.get('/:transferCode', generalApiLimiter, transferController.getInfo);

// Verify PIN credentials (PRD Section 28) - strict rate limiting to prevent brute force
router.post('/verify', authEndpointLimiter, transferController.verify);

// Generate short-lived presigned download URL (PRD Section 29) - strict rate limiting
router.post('/:transferCode/download', authEndpointLimiter, transferController.download);

export default router;

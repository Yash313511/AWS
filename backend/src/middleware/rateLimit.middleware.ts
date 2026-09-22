import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 */
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Limit each IP to 150 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please slow down and try again shortly.',
  },
});

/**
 * Strict rate limiter for sensitive authentication & download endpoints
 * PRD Section 31: Brute-force PIN protection
 */
export const authEndpointLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 verification requests per 15-minute window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many attempts. Please wait before trying again.',
  },
});

/**
 * Upload limiter to prevent flooding
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 uploads per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Upload limit reached for this hour. Please try again later.',
  },
});

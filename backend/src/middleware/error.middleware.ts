import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle Multer file size limit
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        success: false,
        error: `File exceeds maximum allowed size of ${env.MAX_FILE_SIZE_MB}MB.`,
      });
      return;
    }
    res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`,
    });
    return;
  }

  // Handle Zod schema validation errors
  if (err instanceof ZodError) {
    const issues = err.issues.map((issue) => issue.message).join(', ');
    res.status(400).json({
      success: false,
      error: `Validation error: ${issues}`,
    });
    return;
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Fallback 500 error: sanitize details so internal database/AWS stack traces are never leaked
  logger.error('SECURITY_ALERT', {
    message: 'Unhandled server error',
    error: err.message || 'Unknown internal error',
  });

  res.status(500).json({
    success: false,
    error: 'An unexpected server error occurred. Please try again later.',
  });
};

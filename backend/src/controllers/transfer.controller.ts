import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { transferService } from '../services/transfer.service.js';
import { AppError } from '../middleware/error.middleware.js';
import { env } from '../config/env.js';

const verifySchema = z.object({
  transferCode: z
    .string()
    .min(4, 'Transfer code must be at least 4 characters')
    .max(12, 'Transfer code is too long')
    .regex(/^[A-Za-z0-9]+$/, 'Transfer code must be alphanumeric'),
  pin: z
    .string()
    .length(6, 'PIN must be exactly 6 digits')
    .regex(/^\d{6}$/, 'PIN must contain only numbers'),
});

const downloadSchema = z.object({
  pin: z
    .string()
    .length(6, 'PIN must be exactly 6 digits')
    .regex(/^\d{6}$/, 'PIN must contain only numbers'),
});

export class TransferController {
  /**
   * GET /api/transfers/:transferCode
   * PRD Section 27: Safe file metadata only
   */
  public async getInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawCode = req.params.transferCode;
      const transferCode = Array.isArray(rawCode) ? rawCode[0] : rawCode;
      if (!transferCode || !/^[A-Za-z0-9]+$/.test(transferCode)) {
        throw new AppError('Invalid transfer code format.', 400);
      }

      const info = await transferService.getTransferInfo(transferCode);
      if (!info) {
        throw new AppError('This file is no longer available or the code is incorrect.', 404);
      }

      res.status(200).json({
        success: true,
        transfer: info,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/transfers/verify
   * PRD Section 28
   */
  public async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = verifySchema.parse(req.body);
      const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.get('user-agent') || 'Unknown';

      const result = await transferService.verifyTransferCredentials(
        validated.transferCode,
        validated.pin,
        ip,
        userAgent
      );

      if (result.locked) {
        res.status(429).json({
          success: false,
          error: `Too many attempts. Please wait ${result.remainingSeconds ? Math.ceil(result.remainingSeconds / 60) : 15} minutes before trying again.`,
        });
        return;
      }

      if (!result.valid) {
        res.status(401).json({
          success: false,
          error: 'The transfer code or PIN is incorrect. Please check both and try again.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        file: result.file,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/transfers/:transferCode/download
   * PRD Section 29
   */
  public async download(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawCode = req.params.transferCode;
      const transferCode = Array.isArray(rawCode) ? rawCode[0] : rawCode;
      if (!transferCode || !/^[A-Za-z0-9]+$/.test(transferCode)) {
        throw new AppError('Invalid transfer code format.', 400);
      }

      const validated = downloadSchema.parse(req.body);
      const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.get('user-agent') || 'Unknown';

      const forwardedProto = req.headers['x-forwarded-proto'];
      const protocol = typeof forwardedProto === 'string' ? forwardedProto.split(',')[0].trim() : req.protocol;
      const host = req.get('host') || `localhost:${env.PORT}`;
      const requestBaseUrl = `${protocol}://${host}`;

      const result = await transferService.generateDownload(
        transferCode,
        validated.pin,
        ip,
        userAgent,
        requestBaseUrl
      );

      if (result.locked) {
        res.status(429).json({
          success: false,
          error: `Too many attempts. Please wait ${result.remainingSeconds ? Math.ceil(result.remainingSeconds / 60) : 15} minutes before trying again.`,
        });
        return;
      }

      if (!result.success) {
        res.status(401).json({
          success: false,
          error: 'The transfer code or PIN is incorrect. Please check both and try again.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        downloadUrl: result.downloadUrl,
        expiresInSeconds: result.expiresInSeconds,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const transferController = new TransferController();

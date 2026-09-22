import { Request, Response, NextFunction } from 'express';
import { transferService } from '../services/transfer.service.js';
import { storageService } from '../services/s3.service.js';
import { AppError } from '../middleware/error.middleware.js';

export class FileController {
  /**
   * Handles POST /api/files/upload
   * PRD Section 26
   */
  public async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded. Please select a file.', 400);
      }

      const { originalname, buffer, mimetype, size } = req.file;

      if (!size || size === 0) {
        throw new AppError('The selected file is empty.', 400);
      }

      const result = await transferService.createTransfer(
        buffer,
        originalname,
        mimetype,
        size
      );

      res.status(201).json({
        success: true,
        transferCode: result.transferCode,
        pin: result.pin,
        file: result.file,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Handles GET /api/files/download-direct/:token
   * Streams file from MongoDB GridFS using a short-lived signed token.
   */
  public async downloadDirect(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawToken = req.params.token;
      const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;
      if (!token) {
        throw new AppError('Missing token.', 400);
      }

      const fileData = storageService.resolveLocalToken(token);

      if (!fileData) {
        throw new AppError(
          'Download link has expired or is invalid. Please request a new link.',
          404
        );
      }

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(fileData.filename)}"`
      );
      res.setHeader('Content-Type', fileData.contentType);

      // Stream file directly from MongoDB GridFS — no local filesystem required
      storageService.streamGridFSFile(fileData.gridfsId, res);
    } catch (err) {
      next(err);
    }
  }
}

export const fileController = new FileController();

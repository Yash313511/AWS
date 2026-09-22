import mongoose from 'mongoose';
import { Readable } from 'stream';
import path from 'path';
import crypto from 'crypto';
import { getGridFSBucket } from '../config/gridfs.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// In-memory token registry for secure one-time download links
interface DownloadToken {
  gridfsId: string; // MongoDB ObjectId as hex string
  originalFilename: string;
  contentType: string;
  expiresAt: number;
}
const downloadTokens = new Map<string, DownloadToken>();

export class StorageService {
  /**
   * Generates a secure, unguessable storage key (used as GridFS filename)
   * uploads/{transferId}/{uuid}-{sanitizedFilename}
   */
  public generateObjectKey(transferId: string, originalFilename: string): string {
    const ext = path.extname(originalFilename).toLowerCase();
    const safeBase = path
      .basename(originalFilename, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 40);
    const randomSuffix = crypto.randomBytes(8).toString('hex');
    return `uploads/${transferId}/${randomSuffix}-${safeBase}${ext}`;
  }

  /**
   * Uploads a file buffer to MongoDB GridFS.
   * Returns a gridfsId (ObjectId hex string) used later for download.
   */
  public async uploadFile(
    s3Key: string,
    buffer: Buffer,
    contentType: string,
    originalFilename: string
  ): Promise<{ storageType: 'gridfs'; s3Key: string; gridfsId: string }> {
    const bucket = getGridFSBucket();

    const gridfsId: string = await new Promise<string>((resolve, reject) => {
      const uploadStream = bucket.openUploadStream(s3Key, {
        metadata: {
          originalFilename,
          contentType,
        },
      });

      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);

      readable.pipe(uploadStream);

      uploadStream.on('finish', () => {
        resolve(String(uploadStream.id));
      });
      uploadStream.on('error', reject);
    });

    logger.info('GRIDFS_UPLOAD', {
      s3Key,
      gridfsId,
      contentType,
      message: 'File uploaded to MongoDB GridFS',
    });

    return { storageType: 'gridfs', s3Key, gridfsId };
  }

  /**
   * Creates a short-lived signed download token (valid for PRESIGNED_URL_EXPIRY_SECONDS).
   * The token maps to a GridFS file ID for secure streaming download.
   */
  public async getPresignedDownloadUrl(
    _s3Key: string,
    originalFilename: string,
    contentType: string,
    requestBaseUrl?: string,
    gridfsId?: string
  ): Promise<{ downloadUrl: string; expiresInSeconds: number }> {
    const expiresIn = env.PRESIGNED_URL_EXPIRY_SECONDS;

    if (!gridfsId) {
      throw new Error('gridfsId is required for GridFS download URL generation.');
    }

    // Generate a cryptographically secure one-time token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + expiresIn * 1000;

    downloadTokens.set(token, {
      gridfsId,
      originalFilename,
      contentType,
      expiresAt,
    });

    // Periodically clean up expired tokens
    const now = Date.now();
    for (const [key, val] of downloadTokens.entries()) {
      if (val.expiresAt < now) {
        downloadTokens.delete(key);
      }
    }

    const host = requestBaseUrl || `http://localhost:${env.PORT}`;
    const downloadUrl = `${host}/api/files/download-direct/${token}`;
    return { downloadUrl, expiresInSeconds: expiresIn };
  }

  /**
   * Resolves a one-time download token and returns stream metadata for GridFS.
   */
  public resolveLocalToken(token: string): {
    gridfsId: string;
    filename: string;
    contentType: string;
  } | null {
    const record = downloadTokens.get(token);
    if (!record) return null;
    if (Date.now() > record.expiresAt) {
      downloadTokens.delete(token);
      return null;
    }
    return {
      gridfsId: record.gridfsId,
      filename: record.originalFilename,
      contentType: record.contentType,
    };
  }

  /**
   * Streams a file from GridFS to an HTTP response.
   */
  public streamGridFSFile(
    gridfsId: string,
    res: import('express').Response
  ): void {
    const bucket = getGridFSBucket();
    const objectId = new mongoose.Types.ObjectId(gridfsId);
    const downloadStream = bucket.openDownloadStream(objectId as any);
    downloadStream.pipe(res);
    downloadStream.on('error', () => {
      if (!res.headersSent) {
        res.status(404).json({ success: false, error: 'File not found in storage.' });
      }
    });
  }

  /**
   * Deletes a file from GridFS by its ObjectId hex string.
   */
  public async deleteFile(_s3Key: string, gridfsId?: string): Promise<void> {
    if (!gridfsId) return;
    try {
      const bucket = getGridFSBucket();
      const objectId = new mongoose.Types.ObjectId(gridfsId);
      await bucket.delete(objectId as any);
      logger.info('GRIDFS_DELETE', { gridfsId, message: 'File deleted from GridFS' });
    } catch (err: any) {
      logger.warn('GRIDFS_DELETE_ERROR', { gridfsId, message: err.message });
    }
  }
}

export const storageService = new StorageService();

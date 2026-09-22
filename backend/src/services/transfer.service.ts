import { v4 as uuidv4 } from 'uuid';
import { FileModel, TransferModel, AccessLogModel } from '../models/index.js';
import { storageService } from './s3.service.js';
import { securityService } from './security.service.js';
import { hashIp } from '../utils/generateCode.js';
import { logger } from '../utils/logger.js';

export interface FileRecord {
  id: string;
  original_filename: string;
  s3_key: string;
  gridfs_id: string;
  file_size: number;
  content_type: string;
  created_at: Date;
  download_count: number;
  status: string;
}

export interface TransferRecord {
  id: string;
  file_id: string;
  transfer_code: string;
  pin_hash: string;
  created_at: Date;
  last_accessed_at: Date | null;
  download_count: number;
  status: string;
}

export class TransferService {
  /**
   * Atomic upload flow:
   * Generates IDs -> Hashes PIN -> Uploads to GridFS -> Inserts MongoDB records -> Cleanup on error
   */
  public async createTransfer(
    fileBuffer: Buffer,
    originalFilename: string,
    contentType: string,
    fileSize: number
  ): Promise<{ transferCode: string; pin: string; file: { name: string; size: number } }> {
    const fileId = uuidv4();
    const transferId = uuidv4();
    const sanitizedFilename = securityService.sanitizeFilename(originalFilename);
    const transferCode = await securityService.generateUniqueTransferCode();
    const { pin, pinHash } = await securityService.generateSecurePinCredentials();
    const s3Key = storageService.generateObjectKey(transferId, sanitizedFilename);

    let uploadResult: { storageType: 'gridfs'; s3Key: string; gridfsId: string } | null = null;

    try {
      // 1. Upload to MongoDB GridFS
      uploadResult = await storageService.uploadFile(s3Key, fileBuffer, contentType, sanitizedFilename);

      // 2. Insert File document with gridfs_id
      await FileModel.create({
        id: fileId,
        original_filename: sanitizedFilename,
        s3_key: s3Key,
        gridfs_id: uploadResult.gridfsId,
        file_size: fileSize,
        content_type: contentType || 'application/octet-stream',
        download_count: 0,
        status: 'active',
        created_at: new Date(),
      });

      // 3. Insert Transfer document
      await TransferModel.create({
        id: transferId,
        file_id: fileId,
        transfer_code: transferCode.toUpperCase(),
        pin_hash: pinHash,
        download_count: 0,
        status: 'active',
        created_at: new Date(),
        last_accessed_at: null,
      });

      logger.info('TRANSFER_CREATED', {
        transferCode,
        fileId,
        fileSize,
        message: 'File successfully uploaded to GridFS and transfer record created',
      });

      return {
        transferCode,
        pin,
        file: {
          name: sanitizedFilename,
          size: fileSize,
        },
      };
    } catch (err: any) {
      logger.error('UPLOAD_FAILURE', {
        transferCode,
        error: err.message,
        message: 'Upload operation failed, cleaning up resources',
      });

      // Compensating action: remove orphaned GridFS file if it was uploaded
      if (uploadResult) {
        await storageService.deleteFile(s3Key, uploadResult.gridfsId).catch(() => {});
      }

      // Cleanup partial DB records if any
      await FileModel.deleteOne({ id: fileId }).catch(() => {});
      await TransferModel.deleteOne({ id: transferId }).catch(() => {});

      throw err;
    }
  }

  /**
   * Retrieves safe transfer info without exposing any hashes or secrets
   */
  public async getTransferInfo(transferCode: string): Promise<{
    transferCode: string;
    file: {
      name: string;
      size: number;
      contentType: string;
      createdAt: string;
      downloadCount: number;
    };
    status: string;
  } | null> {
    const normalizedCode = transferCode.trim().toUpperCase();
    const transfer = await TransferModel.findOne({
      transfer_code: normalizedCode,
      status: 'active',
    }).lean();

    if (!transfer) {
      return null;
    }

    const file = await FileModel.findOne({ id: transfer.file_id }).lean();
    if (!file) {
      return null;
    }

    return {
      transferCode: normalizedCode,
      file: {
        name: file.original_filename,
        size: Number(file.file_size),
        contentType: file.content_type,
        createdAt: transfer.created_at.toISOString(),
        downloadCount: transfer.download_count,
      },
      status: transfer.status,
    };
  }

  /**
   * Verifies PIN against transfer credentials with brute-force defense
   */
  public async verifyTransferCredentials(
    transferCode: string,
    pin: string,
    ip: string,
    userAgent: string
  ): Promise<{
    valid: boolean;
    locked?: boolean;
    remainingSeconds?: number;
    file?: { name: string; size: number; contentType: string };
  }> {
    const normalizedCode = transferCode.trim().toUpperCase();

    // 1. Check if transfer code is locked due to excessive failed attempts
    const lockCheck = await securityService.checkBruteForceLock(normalizedCode);
    if (lockCheck.isLocked) {
      return { valid: false, locked: true, remainingSeconds: lockCheck.remainingSeconds };
    }

    // 2. Query transfer record
    const transfer = await TransferModel.findOne({ transfer_code: normalizedCode }).lean();

    if (!transfer) {
      // Do not reveal code non-existence
      await securityService.recordFailedAttempt(normalizedCode, ip);
      return { valid: false };
    }

    if (transfer.status !== 'active') {
      return { valid: false };
    }

    const file = await FileModel.findOne({ id: transfer.file_id }).lean();
    if (!file) {
      return { valid: false };
    }

    // 3. Verify PIN hash
    const isMatch = await securityService.verifyPin(pin, transfer.pin_hash);

    if (!isMatch) {
      const failResult = await securityService.recordFailedAttempt(normalizedCode, ip);
      logger.warn('TRANSFER_VERIFICATION_FAILED', {
        transferCode: normalizedCode,
        ipHash: hashIp(ip),
        message: 'Invalid PIN entered for transfer code',
      });

      // Log access audit
      await AccessLogModel.create({
        id: uuidv4(),
        transfer_id: transfer.id,
        action: 'VERIFY_FAILED',
        ip_hash: hashIp(ip),
        user_agent: userAgent.substring(0, 200),
        created_at: new Date(),
      }).catch(() => {});

      return {
        valid: false,
        locked: failResult.locked,
      };
    }

    // 4. Success - reset failed attempts
    await securityService.resetFailedAttempts(normalizedCode);

    // Audit log
    await AccessLogModel.create({
      id: uuidv4(),
      transfer_id: transfer.id,
      action: 'VERIFY_SUCCESS',
      ip_hash: hashIp(ip),
      user_agent: userAgent.substring(0, 200),
      created_at: new Date(),
    }).catch(() => {});

    return {
      valid: true,
      file: {
        name: file.original_filename,
        size: Number(file.file_size),
        contentType: file.content_type,
      },
    };
  }

  /**
   * Generates a short-lived signed download token upon verified request, increments counts
   */
  public async generateDownload(
    transferCode: string,
    pin: string,
    ip: string,
    userAgent: string,
    requestBaseUrl?: string
  ): Promise<{
    success: boolean;
    downloadUrl?: string;
    expiresInSeconds?: number;
    locked?: boolean;
    remainingSeconds?: number;
  }> {
    const normalizedCode = transferCode.trim().toUpperCase();

    // Check lock
    const lockCheck = await securityService.checkBruteForceLock(normalizedCode);
    if (lockCheck.isLocked) {
      return { success: false, locked: true, remainingSeconds: lockCheck.remainingSeconds };
    }

    const transfer = await TransferModel.findOne({ transfer_code: normalizedCode }).lean();

    if (!transfer) {
      await securityService.recordFailedAttempt(normalizedCode, ip);
      return { success: false };
    }

    if (transfer.status !== 'active') {
      return { success: false };
    }

    const file = await FileModel.findOne({ id: transfer.file_id }).lean();
    if (!file) {
      return { success: false };
    }

    const isMatch = await securityService.verifyPin(pin, transfer.pin_hash);
    if (!isMatch) {
      const failResult = await securityService.recordFailedAttempt(normalizedCode, ip);
      logger.warn('DOWNLOAD_FAILURE', {
        transferCode: normalizedCode,
        ipHash: hashIp(ip),
        message: 'Invalid PIN provided for download authorization',
      });
      return { success: false, locked: failResult.locked };
    }

    // Reset failed attempts
    await securityService.resetFailedAttempts(normalizedCode);

    // Generate short-lived signed download token pointing to GridFS
    const { downloadUrl, expiresInSeconds } = await storageService.getPresignedDownloadUrl(
      file.s3_key,
      file.original_filename,
      file.content_type,
      requestBaseUrl,
      file.gridfs_id
    );

    // Update download count and last accessed time
    await TransferModel.updateOne(
      { id: transfer.id },
      {
        $inc: { download_count: 1 },
        $set: { last_accessed_at: new Date() },
      }
    );

    await FileModel.updateOne(
      { id: file.id },
      {
        $inc: { download_count: 1 },
      }
    );

    // Log access
    await AccessLogModel.create({
      id: uuidv4(),
      transfer_id: transfer.id,
      action: 'DOWNLOAD_TOKEN_ISSUED',
      ip_hash: hashIp(ip),
      user_agent: userAgent.substring(0, 200),
      created_at: new Date(),
    }).catch(() => {});

    logger.info('DOWNLOAD_SUCCESS', {
      transferCode: normalizedCode,
      ipHash: hashIp(ip),
      message: 'Download token issued successfully',
    });

    return {
      success: true,
      downloadUrl,
      expiresInSeconds,
    };
  }
}

export const transferService = new TransferService();

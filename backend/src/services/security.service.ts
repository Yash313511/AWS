import path from 'path';
import { generateTransferCode, generatePin, hashIp } from '../utils/generateCode.js';
import { hashPin, verifyPinHash } from '../utils/hash.js';
import { TransferModel, TransferSecurityTrackingModel } from '../models/index.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export class SecurityService {
  /**
   * Generates a unique transfer code ensuring no collision in MongoDB
   */
  public async generateUniqueTransferCode(): Promise<string> {
    const maxAttempts = 10;
    for (let i = 0; i < maxAttempts; i++) {
      const code = generateTransferCode(6);
      const existing = await TransferModel.findOne({ transfer_code: code.toUpperCase() }).lean();
      if (!existing) {
        return code.toUpperCase();
      }
    }
    // If 6 characters collision occurs (rare), fallback to 8 characters
    return generateTransferCode(8).toUpperCase();
  }

  /**
   * Generates a random 6-digit PIN and its secure bcrypt hash
   */
  public async generateSecurePinCredentials(): Promise<{ pin: string; pinHash: string }> {
    const pin = generatePin();
    const pinHash = await hashPin(pin);
    return { pin, pinHash };
  }

  /**
   * Verifies an entered PIN against stored hash
   */
  public async verifyPin(pin: string, storedHash: string): Promise<boolean> {
    return verifyPinHash(pin, storedHash);
  }

  /**
   * Checks whether a transfer code is currently locked out due to brute-force attempts
   */
  public async checkBruteForceLock(transferCode: string): Promise<{ isLocked: boolean; remainingSeconds?: number }> {
    const normalizedCode = transferCode.trim().toUpperCase();
    const record = await TransferSecurityTrackingModel.findOne({ transfer_code: normalizedCode }).lean();

    if (!record) {
      return { isLocked: false };
    }

    if (record.locked_until) {
      const lockUntilTime = new Date(record.locked_until).getTime();
      const now = Date.now();
      if (lockUntilTime > now) {
        const remainingSeconds = Math.ceil((lockUntilTime - now) / 1000);
        return { isLocked: true, remainingSeconds };
      }
    }

    return { isLocked: false };
  }

  /**
   * Records a failed authentication attempt and locks the transfer code if limit reached
   */
  public async recordFailedAttempt(
    transferCode: string,
    ip: string
  ): Promise<{ locked: boolean; remainingAttempts: number }> {
    const normalizedCode = transferCode.trim().toUpperCase();
    const maxAttempts = env.BRUTE_FORCE_MAX_ATTEMPTS;
    const lockoutMinutes = env.BRUTE_FORCE_LOCKOUT_MINUTES;

    const record = await TransferSecurityTrackingModel.findOneAndUpdate(
      { transfer_code: normalizedCode },
      {
        $inc: { failed_attempts: 1 },
        $set: { last_attempt_at: new Date() },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    const attempts = record.failed_attempts;

    if (attempts >= maxAttempts) {
      const lockedUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);
      await TransferSecurityTrackingModel.updateOne(
        { transfer_code: normalizedCode },
        { $set: { locked_until: lockedUntil } }
      );
      logger.warn('RATE_LIMIT_EXCEEDED', {
        transferCode: normalizedCode,
        ipHash: hashIp(ip),
        message: `Transfer code locked for ${lockoutMinutes} minutes due to ${attempts} failed attempts`,
      });
      return { locked: true, remainingAttempts: 0 };
    }

    return { locked: false, remainingAttempts: Math.max(0, maxAttempts - attempts) };
  }

  /**
   * Resets failed attempts after successful PIN verification
   */
  public async resetFailedAttempts(transferCode: string): Promise<void> {
    const normalizedCode = transferCode.trim().toUpperCase();
    await TransferSecurityTrackingModel.deleteOne({ transfer_code: normalizedCode });
  }

  /**
   * Sanitizes original filename to prevent path traversal and script injection
   */
  public sanitizeFilename(name: string): string {
    // Remove control characters, slashes, null bytes
    const basename = path.basename(name).replace(/[\x00-\x1f\x80-\x9f\\/<>:"|?*]/g, '');
    const clean = basename.trim();
    if (!clean || clean === '.' || clean === '..') {
      return 'download.dat';
    }
    // Restrict max length to 255 chars
    return clean.substring(0, 250);
  }
}

export const securityService = new SecurityService();

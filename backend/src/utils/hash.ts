import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

const SALT_ROUNDS = 10;

/**
 * Applies server pepper and hashes PIN using bcrypt
 */
export const hashPin = async (pin: string): Promise<string> => {
  const pepperedPin = `${pin}:${env.PIN_PEPPER}`;
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(pepperedPin, salt);
};

/**
 * Compares incoming PIN against stored hash using constant-time bcrypt verification
 */
export const verifyPinHash = async (pin: string, storedHash: string): Promise<boolean> => {
  const pepperedPin = `${pin}:${env.PIN_PEPPER}`;
  return bcrypt.compare(pepperedPin, storedHash);
};

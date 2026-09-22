import crypto from 'crypto';

// Unambiguous uppercase alphanumeric alphabet (excluding 0, O, 1, I, L)
const CODE_CHARSET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Generates a cryptographically secure random transfer code (default length: 6)
 * Example: A7K9P2
 */
export const generateTransferCode = (length = 6): string => {
  let result = '';
  const charsetLength = CODE_CHARSET.length;
  // Use crypto.randomBytes for cryptographic unpredictability
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += CODE_CHARSET[randomBytes[i] % charsetLength];
  }
  return result;
};

/**
 * Generates a cryptographically secure 6-digit numeric PIN
 * Example: 482913
 */
export const generatePin = (): string => {
  const pinNum = crypto.randomInt(100000, 1000000);
  return pinNum.toString();
};

/**
 * Generates a sha256 hash of an IP address for privacy-safe access logging
 */
export const hashIp = (ip: string): string => {
  return crypto.createHash('sha256').update(ip + '_salt_ip').digest('hex').substring(0, 16);
};

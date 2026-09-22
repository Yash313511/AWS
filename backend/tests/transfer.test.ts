import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { runMigrations } from '../src/db/migrate.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { env } from '../src/config/env.js';
import { FileModel, TransferModel, TransferSecurityTrackingModel, AccessLogModel } from '../src/models/index.js';
import { Express } from 'express';

let app: Express;
let server: any;
let baseUrl: string;
let mongoServer: any = null;

beforeAll(async () => {
  try {
    // If MONGODB_URI is available in env, connect directly
    await connectDatabase();
  } catch (err) {
    // Fallback to in-memory mongodb
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  }

  await runMigrations();

  app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 5000;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
}, 60000);

afterAll(async () => {
  if (server) {
    server.close();
  }
  // Clean up any test records
  if (mongoose.connection.readyState === 1) {
    await FileModel.deleteMany({ original_filename: 'test-notes.txt' }).catch(() => {});
  }
  await disconnectDatabase();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('Cloud-Based Secure File Exchange API Test Suite (MongoDB)', () => {
  let createdTransferCode = '';
  let createdPin = '';

  it('GET /api/health should return ok and database connected status', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('ok');
    expect(data.database).toBe('connected');
  });

  it('POST /api/files/upload should securely upload a file and return transfer code + PIN', async () => {
    const formData = new FormData();
    const testFileContent = 'Hello Cloud Secure File Exchange 2026!';
    const blob = new Blob([testFileContent], { type: 'text/plain' });
    formData.append('file', blob, 'test-notes.txt');

    const res = await fetch(`${baseUrl}/api/files/upload`, {
      method: 'POST',
      body: formData,
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.transferCode).toBeDefined();
    expect(typeof data.transferCode).toBe('string');
    expect(data.transferCode.length).toBe(6);
    expect(data.pin).toBeDefined();
    expect(typeof data.pin).toBe('string');
    expect(data.pin.length).toBe(6);
    expect(data.file.name).toBe('test-notes.txt');

    createdTransferCode = data.transferCode;
    createdPin = data.pin;
  });

  it('GET /api/transfers/:transferCode should return safe metadata without revealing PIN hash or secrets', async () => {
    const res = await fetch(`${baseUrl}/api/transfers/${createdTransferCode}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.transfer.transferCode).toBe(createdTransferCode);
    expect(data.transfer.file.name).toBe('test-notes.txt');
    expect(data.transfer.pin_hash).toBeUndefined();
    expect(data.transfer.pin).toBeUndefined();
  });

  it('POST /api/transfers/verify should reject an incorrect PIN', async () => {
    const res = await fetch(`${baseUrl}/api/transfers/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transferCode: createdTransferCode,
        pin: '000000', // incorrect PIN
      }),
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('incorrect');
  });

  it('POST /api/transfers/verify should succeed with correct PIN', async () => {
    const res = await fetch(`${baseUrl}/api/transfers/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transferCode: createdTransferCode,
        pin: createdPin,
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.file.name).toBe('test-notes.txt');
  });

  it('POST /api/transfers/:transferCode/download should generate a short-lived download URL and increment counter', async () => {
    const res = await fetch(`${baseUrl}/api/transfers/${createdTransferCode}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pin: createdPin,
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.downloadUrl).toBeDefined();
    expect(data.expiresInSeconds).toBeGreaterThan(0);

    // Verify downloading from the issued download URL
    const fileRes = await fetch(data.downloadUrl);
    expect(fileRes.status).toBe(200);
    const downloadedText = await fileRes.text();
    expect(downloadedText).toBe('Hello Cloud Secure File Exchange 2026!');
  });

  it('POST /api/transfers/verify should trigger a 429 lockout after excessive failed attempts', async () => {
    // Send 4 incorrect PIN attempts
    for (let i = 0; i < 4; i++) {
      await fetch(`${baseUrl}/api/transfers/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transferCode: createdTransferCode,
          pin: '999999',
        }),
      });
    }

    // 5th failed attempt triggers the lockout
    const fifthRes = await fetch(`${baseUrl}/api/transfers/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transferCode: createdTransferCode,
        pin: '999999',
      }),
    });
    expect([401, 429]).toContain(fifthRes.status);

    // Subsequent attempt is blocked with 429
    const lockRes = await fetch(`${baseUrl}/api/transfers/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transferCode: createdTransferCode,
        pin: createdPin, // even with correct PIN, transfer code is temporarily locked!
      }),
    });
    expect(lockRes.status).toBe(429);
    const lockData = await lockRes.json();
    expect(lockData.error).toContain('Too many attempts');
  }, 30000);
});

import test from 'node:test';
import assert from 'node:assert/strict';

import { createAuthRepository } from '../data/repositories/auth-repository.js';

test('persists and restores the active auth session', async () => {
  /** @type {Array<{ sql: string, params: unknown[] }>} */
  const writes = [];
  const database = {
    async runAsync(sql, ...params) {
      writes.push({ sql, params });
      return { changes: 1 };
    },
    async getFirstAsync() {
      return {
        user_id: 'user-1',
        access_token: 'token-1',
        refresh_token: 'refresh-1',
        encryption_key: 'key-1',
        expires_at: '2026-05-13T12:00:00.000Z',
        updated_at: '2026-05-13T11:30:00.000Z',
      };
    },
  };
  const repository = createAuthRepository(database);

  await repository.saveSession({
    userId: 'user-1',
    accessToken: 'token-1',
    refreshToken: 'refresh-1',
    encryptionKey: 'key-1',
    expiresAt: '2026-05-13T12:00:00.000Z',
    updatedAt: '2026-05-13T11:30:00.000Z',
  });

  const restored = await repository.getSession();

  assert.match(writes[0]?.sql ?? '', /INSERT OR REPLACE INTO auth_session/i);
  assert.deepEqual(restored, {
    userId: 'user-1',
    accessToken: 'token-1',
    refreshToken: 'refresh-1',
    encryptionKey: 'key-1',
    expiresAt: '2026-05-13T12:00:00.000Z',
    updatedAt: '2026-05-13T11:30:00.000Z',
  });
});

test('clears the active auth session', async () => {
  /** @type {Array<{ sql: string, params: unknown[] }>} */
  const writes = [];
  const repository = createAuthRepository({
    async runAsync(sql, ...params) {
      writes.push({ sql, params });
      return { changes: 1 };
    },
    async getFirstAsync() {
      return null;
    },
  });

  await repository.clearSession();

  assert.match(writes[0]?.sql ?? '', /DELETE FROM auth_session/i);
});

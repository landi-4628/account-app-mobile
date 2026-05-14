import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createMockAppStorageAdapter,
  createNoopStorageAdapter,
} from './mock-app-storage.js';

test('falls back to empty persisted definitions when backing storage read throws', async () => {
  const storage = createMockAppStorageAdapter({
    getItem: async () => {
      throw new Error('Native module is null');
    },
    setItem: async () => {},
  });

  const result = await storage.readCustomDefinitions('mock-key');

  assert.deepEqual(result, { categories: [], accounts: [] });
});

test('skips writes when backing storage setItem throws', async () => {
  let writes = 0;
  const storage = createMockAppStorageAdapter({
    getItem: async () => null,
    setItem: async () => {
      writes += 1;
      throw new Error('Native module is null');
    },
  });

  await assert.doesNotReject(() =>
    storage.writeCustomDefinitions('mock-key', { categories: [], accounts: [] })
  );
  assert.equal(writes, 1);
});

test('reads sync preferences with defaults when storage is empty or invalid', async () => {
  const emptyStorage = createMockAppStorageAdapter({
    getItem: async () => null,
    setItem: async () => {},
  });
  const invalidStorage = createMockAppStorageAdapter({
    getItem: async () => '{"autoSyncEnabled":"bad"}',
    setItem: async () => {},
  });

  assert.deepEqual(await emptyStorage.readSyncPreferences('sync-key'), {
    autoSyncEnabled: true,
  });
  assert.deepEqual(await invalidStorage.readSyncPreferences('sync-key'), {
    autoSyncEnabled: false,
  });
});

test('writes sync preferences as json when backing storage is available', async () => {
  /** @type {{ key: string | null, value: string | null }} */
  const captured = { key: null, value: null };
  const storage = createMockAppStorageAdapter({
    getItem: async () => null,
    setItem: async (key, value) => {
      captured.key = key;
      captured.value = value;
    },
  });

  await storage.writeSyncPreferences('sync-key', { autoSyncEnabled: true });

  assert.equal(captured.key, 'sync-key');
  assert.equal(captured.value, JSON.stringify({ autoSyncEnabled: true }));
});

test('reads app snapshot as null when storage is empty, invalid, or unavailable', async () => {
  const emptyStorage = createMockAppStorageAdapter({
    getItem: async () => null,
    setItem: async () => {},
  });
  const invalidStorage = createMockAppStorageAdapter({
    getItem: async () => '{"currentMonth":"2026-05"}',
    setItem: async () => {},
  });
  const unavailableStorage = createMockAppStorageAdapter({
    getItem: async () => {
      throw new Error('Native module is null');
    },
    setItem: async () => {},
  });

  assert.equal(await emptyStorage.readAppSnapshot('app-snapshot-key'), null);
  assert.equal(await invalidStorage.readAppSnapshot('app-snapshot-key'), null);
  assert.equal(await unavailableStorage.readAppSnapshot('app-snapshot-key'), null);
});

test('reads and writes app snapshot as json when backing storage is available', async () => {
  /** @type {{ key: string | null, value: string | null }} */
  const captured = { key: null, value: null };
  const snapshot = {
    currentMonth: '2026-05',
    selectedEntryType: 'expense',
    implicitLedgerAccountId: 'acc-wechat',
    transactions: [],
    categories: [],
    syncUpdatedAt: '2026-05-13T10:00:00+08:00',
  };
  const storage = createMockAppStorageAdapter({
    getItem: async () => JSON.stringify(snapshot),
    setItem: async (key, value) => {
      captured.key = key;
      captured.value = value;
    },
  });

  assert.deepEqual(await storage.readAppSnapshot('app-snapshot-key'), snapshot);

  await storage.writeAppSnapshot('app-snapshot-key', snapshot);

  assert.equal(captured.key, 'app-snapshot-key');
  assert.equal(captured.value, JSON.stringify(snapshot));
});

test('noop adapter always resolves empty reads and ignored writes', async () => {
  const storage = createNoopStorageAdapter();

  assert.deepEqual(await storage.readCustomDefinitions('mock-key'), {
    categories: [], accounts: [],
  });
  assert.deepEqual(await storage.readSyncPreferences('sync-key'), {
    autoSyncEnabled: false,
  });
  assert.equal(await storage.readAppSnapshot('app-snapshot-key'), null);
  await assert.doesNotReject(() =>
    storage.writeCustomDefinitions('mock-key', { categories: [], accounts: [] })
  );
  await assert.doesNotReject(() =>
    storage.writeSyncPreferences('sync-key', { autoSyncEnabled: false })
  );
  await assert.doesNotReject(() =>
    storage.writeAppSnapshot('app-snapshot-key', {
      currentMonth: '2026-05',
      selectedEntryType: 'expense',
      transactions: [],
      accounts: [],
      categories: [],
      syncUpdatedAt: '2026-05-13T10:00:00+08:00',
    })
  );
});

test('reads, writes, and clears auth session state as json when storage is available', async () => {
  /** @type {{ key: string | null, value: string | null, removed: string | null }} */
  const captured = { key: null, value: null, removed: null };
  const session = {
    userId: 'user-9',
    accessToken: 'access-9',
    refreshToken: null,
    encryptionKey: 'remote-session',
    expiresAt: '2026-05-13T13:00:00.000Z',
    updatedAt: '2026-05-13T12:00:00.000Z',
  };
  const storage = createMockAppStorageAdapter({
    getItem: async () => JSON.stringify(session),
    setItem: async (key, value) => {
      captured.key = key;
      captured.value = value;
    },
    removeItem: async (key) => {
      captured.removed = key;
    },
  });

  assert.deepEqual(await storage.readAuthSession('auth-session-key'), session);

  await storage.writeAuthSession('auth-session-key', session);
  await storage.clearAuthSession('auth-session-key');

  assert.equal(captured.key, 'auth-session-key');
  assert.equal(captured.value, JSON.stringify(session));
  assert.equal(captured.removed, 'auth-session-key');
});

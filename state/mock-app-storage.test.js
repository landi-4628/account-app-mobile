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

test('noop adapter always resolves empty reads and ignored writes', async () => {
  const storage = createNoopStorageAdapter();

  assert.deepEqual(await storage.readCustomDefinitions('mock-key'), {
    categories: [],
    accounts: [],
  });
  await assert.doesNotReject(() =>
    storage.writeCustomDefinitions('mock-key', { categories: [], accounts: [] })
  );
});

import test from 'node:test';
import assert from 'node:assert/strict';

import { createSyncEngine } from '../data/sync/sync-engine.js';

function createTransactionRecord(overrides = {}) {
  return {
    id: 'tx-1',
    type: 'expense',
    amount: 5200,
    categoryId: 'cat-food',
    accountId: 'acc-cash',
    note: 'Lunch',
    transactionAt: '2026-05-13T12:00:00.000Z',
    syncStatus: 'pending',
    updatedAt: '2026-05-13T12:00:00.000Z',
    ...overrides,
  };
}

test('stores transactions locally first and skips remote sync when auto sync is disabled', async () => {
  /** @type {Array<unknown>} */
  const pushedPayloads = [];
  let stored = null;
  const engine = createSyncEngine({
    transactionRepository: {
      async saveTransaction(input) {
        stored = { ...input, syncStatus: input.syncStatus ?? 'pending' };
        return stored;
      },
      async listSyncCandidates() {
        return stored ? [stored] : [];
      },
      async markTransactionsSynced() {},
      async markTransactionsFailed() {},
    },
    syncRepository: {
      async getSyncPreferences() {
        return { autoSyncEnabled: false };
      },
      async saveSyncState() {},
    },
    syncClient: {
      async pushTransactions(payload) {
        pushedPayloads.push(payload);
        return { synced: [], failed: [], syncedAt: '2026-05-13T12:01:00.000Z' };
      },
    },
  });

  const saved = await engine.saveTransaction(createTransactionRecord());

  assert.equal(saved?.syncStatus, 'pending');
  assert.equal(pushedPayloads.length, 0);
});

test('syncs pending transactions and records both successes and failures', async () => {
  /** @type {Array<{ ids: string[], syncedAt: string }>} */
  const syncedWrites = [];
  /** @type {Array<{ failures: Array<{ id: string, error: string }>, failedAt: string }>} */
  const failedWrites = [];
  /** @type {Array<unknown>} */
  const syncStates = [];
  const engine = createSyncEngine({
    transactionRepository: {
      async saveTransaction(input) {
        return input;
      },
      async listSyncCandidates() {
        return [createTransactionRecord(), createTransactionRecord({ id: 'tx-2' })];
      },
      async markTransactionsSynced(ids, syncedAt) {
        syncedWrites.push({ ids, syncedAt });
      },
      async markTransactionsFailed(failures, failedAt) {
        failedWrites.push({ failures, failedAt });
      },
    },
    syncRepository: {
      async getSyncPreferences() {
        return { autoSyncEnabled: true };
      },
      async saveSyncState(state) {
        syncStates.push(state);
      },
    },
    syncClient: {
      async pushTransactions() {
        return {
          synced: [{ id: 'tx-1' }],
          failed: [{ id: 'tx-2', error: 'timeout' }],
          syncedAt: '2026-05-13T12:05:00.000Z',
        };
      },
    },
  });

  const result = await engine.syncPendingTransactions();

  assert.deepEqual(result, {
    syncedIds: ['tx-1'],
    failedIds: ['tx-2'],
    syncedAt: '2026-05-13T12:05:00.000Z',
  });
  assert.deepEqual(syncedWrites, [
    { ids: ['tx-1'], syncedAt: '2026-05-13T12:05:00.000Z' },
  ]);
  assert.deepEqual(failedWrites, [
    {
      failures: [{ id: 'tx-2', error: 'timeout' }],
      failedAt: '2026-05-13T12:05:00.000Z',
    },
  ]);
  assert.deepEqual(syncStates, [
    {
      lastSyncAt: '2026-05-13T12:05:00.000Z',
      pendingCount: 0,
      failedCount: 1,
    },
  ]);
});

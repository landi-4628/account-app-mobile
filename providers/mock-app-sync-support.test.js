import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getSyncableTransactions,
  getManualSyncPlan,
  shouldAutoSync,
} from './mock-app-sync-support.js';

test('selects pending and failed transactions as sync candidates', () => {
  const transactions = [
    { id: 'tx-1', syncStatus: 'synced' },
    { id: 'tx-2', syncStatus: 'pending' },
    { id: 'tx-3', syncStatus: 'failed' },
  ];

  assert.deepEqual(
    getSyncableTransactions(transactions).map((transaction) => transaction.id),
    ['tx-2', 'tx-3']
  );
});

test('auto sync only runs when enabled, idle, and candidates exist', () => {
  assert.equal(
    shouldAutoSync({
      autoSyncEnabled: true,
      syncInFlight: false,
      syncableCount: 2,
    }),
    true
  );

  assert.equal(
    shouldAutoSync({
      autoSyncEnabled: false,
      syncInFlight: false,
      syncableCount: 2,
    }),
    false
  );

  assert.equal(
    shouldAutoSync({
      autoSyncEnabled: true,
      syncInFlight: true,
      syncableCount: 2,
    }),
    false
  );

  assert.equal(
    shouldAutoSync({
      autoSyncEnabled: true,
      syncInFlight: false,
      syncableCount: 0,
    }),
    false
  );
});

test('manual sync uses remote path when remote is available', () => {
  assert.deepEqual(
    getManualSyncPlan({
      canSyncRemotely: true,
      syncableCount: 2,
    }),
    {
      type: 'remote',
    }
  );
});

test('manual sync defers candidates when remote is unavailable', () => {
  assert.deepEqual(
    getManualSyncPlan({
      canSyncRemotely: false,
      syncableCount: 2,
    }),
    {
      type: 'defer',
    }
  );
});

test('manual sync is a no-op when there are no candidates', () => {
  assert.deepEqual(
    getManualSyncPlan({
      canSyncRemotely: true,
      syncableCount: 0,
    }),
    {
      type: 'noop',
    }
  );
});

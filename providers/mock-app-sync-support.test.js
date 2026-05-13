import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getSyncableTransactions,
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

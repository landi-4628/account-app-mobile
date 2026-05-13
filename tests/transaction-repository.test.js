import test from 'node:test';
import assert from 'node:assert/strict';

import { createTransactionRepository } from '../data/repositories/transaction-repository.js';

test('saves a transaction locally with pending sync status by default', async () => {
  /** @type {Array<{ sql: string, params: unknown[] }>} */
  const writes = [];
  const repository = createTransactionRepository({
    async runAsync(sql, ...params) {
      writes.push({ sql, params });
      return { changes: 1 };
    },
    async getAllAsync() {
      return [];
    },
  });

  const saved = await repository.saveTransaction({
    id: 'tx-1',
    type: 'expense',
    amount: 5200,
    categoryId: 'cat-food',
    accountId: 'acc-cash',
    note: 'Lunch',
    transactionAt: '2026-05-13T12:00:00.000Z',
  });

  assert.equal(saved.syncStatus, 'pending');
  assert.match(writes[0]?.sql ?? '', /INSERT OR REPLACE INTO transactions/i);
  assert.equal(writes[0]?.params[0], 'tx-1');
});

test('lists pending and failed transactions as sync candidates', async () => {
  const repository = createTransactionRepository({
    async runAsync() {
      return { changes: 0 };
    },
    async getAllAsync() {
      return [
        {
          id: 'tx-1',
          type: 'expense',
          amount: 5200,
          category_id: 'cat-food',
          account_id: 'acc-cash',
          note: 'Lunch',
          transaction_at: '2026-05-13T12:00:00.000Z',
          sync_status: 'pending',
          sync_error: null,
          synced_at: null,
          updated_at: '2026-05-13T12:00:00.000Z',
        },
        {
          id: 'tx-2',
          type: 'income',
          amount: 8800,
          category_id: 'cat-salary',
          account_id: 'acc-bank',
          note: 'Bonus',
          transaction_at: '2026-05-12T12:00:00.000Z',
          sync_status: 'failed',
          sync_error: 'timeout',
          synced_at: null,
          updated_at: '2026-05-12T12:00:00.000Z',
        },
      ];
    },
  });

  const candidates = await repository.listSyncCandidates(10);

  assert.deepEqual(
    candidates.map((item) => ({ id: item.id, syncStatus: item.syncStatus, syncError: item.syncError })),
    [
      { id: 'tx-1', syncStatus: 'pending', syncError: null },
      { id: 'tx-2', syncStatus: 'failed', syncError: 'timeout' },
    ]
  );
});

test('marks synced and failed transactions with updated metadata', async () => {
  /** @type {Array<{ sql: string, params: unknown[] }>} */
  const writes = [];
  const repository = createTransactionRepository({
    async runAsync(sql, ...params) {
      writes.push({ sql, params });
      return { changes: 1 };
    },
    async getAllAsync() {
      return [];
    },
  });

  await repository.markTransactionsSynced(['tx-1'], '2026-05-13T12:10:00.000Z');
  await repository.markTransactionsFailed(
    [{ id: 'tx-2', error: 'timeout' }],
    '2026-05-13T12:11:00.000Z'
  );

  assert.match(writes[0]?.sql ?? '', /UPDATE transactions SET sync_status = 'synced'/i);
  assert.match(writes[1]?.sql ?? '', /UPDATE transactions SET sync_status = 'failed'/i);
});

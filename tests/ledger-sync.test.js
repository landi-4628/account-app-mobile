import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDefinitionsPushPayload,
  buildRemoteReferenceMaps,
  buildSnapshotFromRemotePayload,
  buildTransactionsPushPayload,
  hasRemoteLedgerData,
} from '../lib/ledger-sync.js';

test('builds definition sync payloads with client ids and optional remote ids', () => {
  const payload = buildDefinitionsPushPayload(
    [
      {
        id: 'acc-cash',
        remoteId: 12,
        name: 'Cash',
        type: 'cash',
        initialBalance: 5000,
        isActive: true,
      },
    ],
    [
      {
        id: 'cat-food',
        name: 'Food',
        type: 'expense',
        isActive: true,
      },
    ]
  );

  assert.deepEqual(payload, {
    accounts: [
      {
        id: 12,
        client_id: 'acc-cash',
        name: 'Cash',
        type: 'cash',
        currency: 'CNY',
        opening_balance: 5000,
        is_deleted: false,
        deleted_at: undefined,
      },
    ],
    categories: [
      {
        id: undefined,
        client_id: 'cat-food',
        name: 'Food',
        kind: 'expense',
        color: undefined,
        is_deleted: false,
        deleted_at: undefined,
      },
    ],
  });
});

test('builds transaction sync payloads from remote reference maps', () => {
  const payload = buildTransactionsPushPayload(
    [
      {
        id: 'tx-1',
        remoteId: 77,
        type: 'expense',
        amount: 3200,
        accountId: 'acc-cash',
        categoryId: 'cat-food',
        note: 'Lunch',
        transactionAt: '2026-05-13T12:00:00.000Z',
      },
    ],
    {
      accountIds: new Map([['acc-cash', 12]]),
      categoryIds: new Map([['cat-food', 34]]),
    }
  );

  assert.deepEqual(payload, {
    transactions: [
      {
        id: 77,
        client_id: 'tx-1',
        account_id: 12,
        category_id: 34,
        kind: 'expense',
        amount: 3200,
        note: 'Lunch',
        occurred_at: '2026-05-13T12:00:00.000Z',
        is_deleted: false,
        deleted_at: undefined,
      },
    ],
  });
});

test('marks deleted local transactions as tombstones in sync payloads', () => {
  const payload = buildTransactionsPushPayload(
    [
      {
        id: 'tx-2',
        type: 'expense',
        amount: 1800,
        accountId: 'acc-cash',
        categoryId: 'cat-food',
        note: 'Deleted lunch',
        transactionAt: '2026-05-13T12:30:00.000Z',
        deletedAt: '2026-05-13T13:00:00.000Z',
      },
    ],
    {
      accountIds: new Map([['acc-cash', 12]]),
      categoryIds: new Map([['cat-food', 34]]),
    }
  );

  assert.deepEqual(payload, {
    transactions: [
      {
        id: undefined,
        client_id: 'tx-2',
        account_id: 12,
        category_id: 34,
        kind: 'expense',
        amount: 1800,
        note: 'Deleted lunch',
        occurred_at: '2026-05-13T12:30:00.000Z',
        is_deleted: true,
        deleted_at: '2026-05-13T13:00:00.000Z',
      },
    ],
  });
});

test('maps pulled remote ledger data into a local snapshot keyed by client ids', () => {
  const payload = {
    data: {
      server_time: '2026-05-13T13:00:00.000Z',
      accounts: [
        {
          id: 12,
          client_id: 'acc-cash',
          name: 'Cash',
          type: 'cash',
          opening_balance: '5000.00',
          is_deleted: false,
          updated_at: '2026-05-13T11:00:00.000Z',
        },
      ],
      categories: [
        {
          id: 34,
          client_id: 'cat-food',
          name: 'Food',
          kind: 'expense',
          is_deleted: false,
          updated_at: '2026-05-13T11:05:00.000Z',
        },
      ],
      transactions: [
        {
          id: 77,
          client_id: 'tx-1',
          account_id: 12,
          category_id: 34,
          kind: 'expense',
          amount: '3200.00',
          note: 'Lunch',
          occurred_at: '2026-05-13T12:00:00.000Z',
          is_deleted: false,
          updated_at: '2026-05-13T12:10:00.000Z',
        },
      ],
    },
  };

  const snapshot = buildSnapshotFromRemotePayload(payload, {
    currentMonth: '2026-05',
    selectedEntryType: 'expense',
    fallbackSyncUpdatedAt: '2026-05-13T10:00:00.000Z',
  });

  assert.equal(snapshot.accounts[0]?.id, 'acc-cash');
  assert.equal(snapshot.accounts[0]?.remoteId, 12);
  assert.equal(snapshot.categories[0]?.id, 'cat-food');
  assert.equal(snapshot.transactions[0]?.accountId, 'acc-cash');
  assert.equal(snapshot.transactions[0]?.categoryId, 'cat-food');
  assert.equal(snapshot.transactions[0]?.syncStatus, 'synced');
  assert.equal(snapshot.syncUpdatedAt, '2026-05-13T13:00:00.000Z');
});

test('extracts remote reference maps and reports whether the ledger has remote data', () => {
  const payload = {
    data: {
      accounts: [{ id: 12, client_id: 'acc-cash' }],
      categories: [{ id: 34, client_id: 'cat-food' }],
      transactions: [],
    },
  };

  const refs = buildRemoteReferenceMaps(payload);

  assert.equal(hasRemoteLedgerData(payload), true);
  assert.equal(refs.accountIds.get('acc-cash'), 12);
  assert.equal(refs.categoryIds.get('cat-food'), 34);
});

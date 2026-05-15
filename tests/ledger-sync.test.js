import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDefinitionsPushPayload,
  buildRemoteReferenceMaps,
  buildSnapshotFromRemotePayload,
  buildTransactionsPushPayload,
  hasRemoteLedgerData,
} from '../lib/ledger-sync.js';

const REMOTE_CATEGORY_ID = '20000000-0000-4000-8000-000000000034';
const REMOTE_TX_ID = '70000000-0000-4000-8000-000000000077';

test('builds category-only definition sync payloads', () => {
  const payload = buildDefinitionsPushPayload([
    {
      id: 'cat-food',
      name: 'Food',
      type: 'expense',
      isActive: true,
    },
  ]);

  assert.deepEqual(payload, {
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

test('builds transaction sync payloads with local account id and remote category id', () => {
  const payload = buildTransactionsPushPayload(
    [
      {
        id: 'tx-1',
        remoteId: REMOTE_TX_ID,
        type: 'expense',
        amount: 3200,
        accountId: 'acc-cash',
        categoryId: 'cat-food',
        note: 'Lunch',
        transactionAt: '2026-05-13T12:00:00.000Z',
      },
    ],
    {
      categoryIds: new Map([['cat-food', REMOTE_CATEGORY_ID]]),
    }
  );

  assert.deepEqual(payload, {
    transactions: [
      {
        id: REMOTE_TX_ID,
        client_id: 'tx-1',
        account_id: 'acc-cash',
        category_id: REMOTE_CATEGORY_ID,
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
      categoryIds: new Map([['cat-food', REMOTE_CATEGORY_ID]]),
    }
  );

  assert.deepEqual(payload, {
    transactions: [
      {
        id: undefined,
        client_id: 'tx-2',
        account_id: 'acc-cash',
        category_id: REMOTE_CATEGORY_ID,
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

test('skips deleted local transactions that were never synced remotely', () => {
  const payload = buildTransactionsPushPayload(
    [
      {
        id: 'tx-local-deleted',
        type: 'expense',
        amount: 1800,
        accountId: 'acc-cash',
        categoryId: 'cat-food',
        note: 'Deleted before first sync',
        transactionAt: '2026-05-13T12:30:00.000Z',
        deletedAt: '2026-05-13T13:00:00.000Z',
      },
    ],
    {
      categoryIds: new Map(),
    }
  );

  assert.deepEqual(payload, {
    transactions: [],
  });
});

test('syncs deleted remote transactions without requiring a category mapping', () => {
  const payload = buildTransactionsPushPayload(
    [
      {
        id: 'tx-remote-deleted',
        remoteId: REMOTE_TX_ID,
        type: 'expense',
        amount: 1800,
        accountId: 'acc-cash',
        categoryId: 'cat-food',
        note: 'Deleted after sync',
        transactionAt: '2026-05-13T12:30:00.000Z',
        deletedAt: '2026-05-13T13:00:00.000Z',
      },
    ],
    {
      categoryIds: new Map(),
    }
  );

  assert.deepEqual(payload, {
    transactions: [
      {
        id: REMOTE_TX_ID,
        client_id: 'tx-remote-deleted',
        account_id: 'acc-cash',
        category_id: undefined,
        kind: 'expense',
        amount: 1800,
        note: 'Deleted after sync',
        occurred_at: '2026-05-13T12:30:00.000Z',
        is_deleted: true,
        deleted_at: '2026-05-13T13:00:00.000Z',
      },
    ],
  });
});

test('maps pulled remote ledger data into a local snapshot keyed by client ids', () => {
  const REMOTE_ACCOUNT_ID = '10000000-0000-4000-8000-000000000012';
  const payload = {
    data: {
      server_time: '2026-05-13T13:00:00.000Z',
      accounts: [
        {
          id: REMOTE_ACCOUNT_ID,
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
          id: REMOTE_CATEGORY_ID,
          client_id: 'cat-food',
          name: 'Food',
          kind: 'expense',
          is_deleted: false,
          updated_at: '2026-05-13T11:05:00.000Z',
        },
      ],
      transactions: [
        {
          id: REMOTE_TX_ID,
          client_id: 'tx-1',
          account_id: REMOTE_ACCOUNT_ID,
          category_id: REMOTE_CATEGORY_ID,
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

  assert.equal(snapshot.implicitLedgerAccountId, 'acc-cash');
  assert.equal(snapshot.categories[0]?.id, 'cat-food');
  assert.equal(snapshot.transactions[0]?.accountId, 'acc-cash');
  assert.equal(snapshot.transactions[0]?.categoryId, 'cat-food');
  assert.equal(snapshot.transactions[0]?.syncStatus, 'synced');
  assert.equal(snapshot.syncUpdatedAt, '2026-05-13T13:00:00.000Z');
});

test('keeps deleted pulled categories as inactive tombstones for built-in category overrides', () => {
  const payload = {
    data: {
      server_time: '2026-05-13T13:00:00.000Z',
      categories: [
        {
          id: REMOTE_CATEGORY_ID,
          client_id: 'cat-food',
          name: 'Food',
          kind: 'expense',
          is_deleted: true,
          deleted_at: '2026-05-13T12:00:00.000Z',
          updated_at: '2026-05-13T12:00:00.000Z',
        },
      ],
      transactions: [],
    },
  };

  const snapshot = buildSnapshotFromRemotePayload(payload, {
    currentMonth: '2026-05',
    selectedEntryType: 'expense',
    fallbackSyncUpdatedAt: '2026-05-13T10:00:00.000Z',
  });

  assert.deepEqual(snapshot.categories[0], {
    id: 'cat-food',
    remoteId: REMOTE_CATEGORY_ID,
    name: 'Food',
    type: 'expense',
    isActive: false,
    isCustom: true,
    updatedAt: '2026-05-13T12:00:00.000Z',
    deletedAt: '2026-05-13T12:00:00.000Z',
  });
});

test('uses baseline implicit account id when remote payload has no accounts', () => {
  const payload = {
    data: {
      server_time: '2026-05-13T13:00:00.000Z',
      categories: [],
      transactions: [],
    },
  };

  const snapshot = buildSnapshotFromRemotePayload(payload, {
    currentMonth: '2026-05',
    selectedEntryType: 'expense',
    fallbackSyncUpdatedAt: '2026-05-13T10:00:00.000Z',
    baselineImplicitLedgerAccountId: 'acc-wallet',
  });

  assert.equal(snapshot.implicitLedgerAccountId, 'acc-wallet');
});

test('extracts remote reference maps and reports whether the ledger has remote data', () => {
  const payload = {
    data: {
      categories: [{ id: REMOTE_CATEGORY_ID, client_id: 'cat-food' }],
      transactions: [],
    },
  };

  const refs = buildRemoteReferenceMaps(payload);

  assert.equal(hasRemoteLedgerData(payload), true);
  assert.equal(refs.categoryIds.get('cat-food'), REMOTE_CATEGORY_ID);
});

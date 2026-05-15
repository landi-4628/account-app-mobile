import test from 'node:test';
import assert from 'node:assert/strict';

import { createInitialMockAppState } from './mock-app-state.js';
import {
  applyMockAppSnapshot,
  parseMockAppSnapshot,
  selectCompactedMockAppSnapshot,
  selectMockAppSnapshot,
} from './mock-app-snapshot.js';

test('selects the minimal persisted snapshot from full app state', () => {
  const initialState = createInitialMockAppState();
  const state = {
    ...initialState,
    currentMonth: '2026-04',
    selectedEntryType: 'income',
    quickAddOpen: true,
    implicitLedgerAccountId: 'acc-runtime',
    syncUpdatedAt: '2026-05-13T10:00:00+08:00',
    transactions: [
      {
        id: 'tx-runtime-income',
        type: 'income',
        amount: 8800,
        categoryId: 'cat-freelance',
        accountId: 'acc-bank',
        note: 'Runtime',
        transactionAt: '2026-04-12T13:00:00+08:00',
        syncStatus: 'pending',
        deletedAt: '2026-05-13T10:05:00+08:00',
      },
    ],
    categories: [
      ...initialState.categories,
      {
        id: 'cat-runtime-bonus',
        name: 'Bonus',
        type: 'income',
        isActive: true,
        isCustom: true,
      },
    ],
  };

  assert.deepEqual(selectMockAppSnapshot(state), {
    currentMonth: '2026-04',
    selectedEntryType: 'income',
    implicitLedgerAccountId: 'acc-runtime',
    transactions: state.transactions,
    categories: state.categories,
    syncUpdatedAt: '2026-05-13T10:00:00+08:00',
  });
});

test('parses a valid raw snapshot and returns null for missing top-level fields', () => {
  const validRaw = JSON.stringify({
    currentMonth: '2026-05',
    selectedEntryType: 'expense',
    implicitLedgerAccountId: 'acc-wechat',
    transactions: [],
    categories: [],
    syncUpdatedAt: '2026-05-13T10:00:00+08:00',
  });

  assert.deepEqual(parseMockAppSnapshot(validRaw), {
    currentMonth: '2026-05',
    selectedEntryType: 'expense',
    implicitLedgerAccountId: 'acc-wechat',
    transactions: [],
    categories: [],
    syncUpdatedAt: '2026-05-13T10:00:00+08:00',
  });
  assert.equal(
    parseMockAppSnapshot(
      JSON.stringify({
        currentMonth: '2026-05',
        selectedEntryType: 'expense',
        transactions: [],
        categories: [],
        syncUpdatedAt: '2026-05-13T10:00:00+08:00',
      })
    ),
    null
  );
});

test('migrates legacy snapshots that stored an accounts array', () => {
  const legacy = JSON.stringify({
    currentMonth: '2026-05',
    selectedEntryType: 'expense',
    transactions: [],
    accounts: [
      {
        id: 'acc-legacy',
        name: 'Legacy',
        type: 'cash',
        initialBalance: 0,
        currentBalance: 0,
        isActive: true,
        isCustom: false,
      },
    ],
    categories: [],
    syncUpdatedAt: '2026-05-13T10:00:00+08:00',
  });

  const snapshot = parseMockAppSnapshot(legacy);
  assert.equal(snapshot?.implicitLedgerAccountId, 'acc-legacy');
});

test('compacts deleted transactions out of the persisted snapshot view', () => {
  const initialState = createInitialMockAppState();
  const state = {
    ...initialState,
    transactions: [
      {
        id: 'tx-active',
        type: 'income',
        amount: 8800,
        categoryId: 'cat-freelance',
        accountId: 'acc-bank',
        note: 'Active',
        transactionAt: '2026-04-12T13:00:00+08:00',
        syncStatus: 'synced',
      },
      {
        id: 'tx-deleted',
        type: 'expense',
        amount: 3200,
        categoryId: 'cat-food',
        accountId: 'acc-cash',
        note: 'Deleted',
        transactionAt: '2026-04-13T13:00:00+08:00',
        syncStatus: 'pending',
        deletedAt: '2026-05-13T10:05:00+08:00',
      },
    ],
  };

  assert.deepEqual(selectCompactedMockAppSnapshot(state).transactions, [
    {
      id: 'tx-active',
      type: 'income',
      amount: 8800,
      categoryId: 'cat-freelance',
      accountId: 'acc-bank',
      note: 'Active',
      transactionAt: '2026-04-12T13:00:00+08:00',
      syncStatus: 'synced',
    },
  ]);
});

test('returns null when any persisted array contains an invalid item', () => {
  assert.equal(
    parseMockAppSnapshot(
      JSON.stringify({
        currentMonth: '2026-05',
        selectedEntryType: 'expense',
        implicitLedgerAccountId: 'acc-cash',
        transactions: [
          {
            id: 'tx-invalid',
            type: 'expense',
            amount: '3200',
            categoryId: 'cat-food',
            accountId: 'acc-cash',
            note: 'Bad amount',
            transactionAt: '2026-05-13T10:00:00+08:00',
            syncStatus: 'pending',
          },
        ],
        categories: [],
        syncUpdatedAt: '2026-05-13T10:00:00+08:00',
      })
    ),
    null
  );

  assert.equal(
    parseMockAppSnapshot(
      JSON.stringify({
        currentMonth: '2026-05',
        selectedEntryType: 'expense',
        transactions: [],
        accounts: [
          {
            id: 'acc-invalid',
            name: 'Wallet',
            type: 'cash',
            initialBalance: 0,
            currentBalance: 0,
            isActive: 'yes',
          },
        ],
        categories: [],
        syncUpdatedAt: '2026-05-13T10:00:00+08:00',
      })
    ),
    null
  );

  assert.equal(
    parseMockAppSnapshot(
      JSON.stringify({
        currentMonth: '2026-05',
        selectedEntryType: 'expense',
        implicitLedgerAccountId: 'acc-cash',
        transactions: [],
        categories: [
          {
            id: 'cat-invalid',
            name: 'Broken',
            type: 'expense',
            isActive: 'true',
          },
        ],
        syncUpdatedAt: '2026-05-13T10:00:00+08:00',
      })
    ),
    null
  );
});

test('applies a valid snapshot onto initial state without replacing seeded foundations', () => {
  const initialState = createInitialMockAppState();
  const snapshot = {
    currentMonth: '2026-04',
    selectedEntryType: 'income',
    implicitLedgerAccountId: 'acc-bank',
    transactions: [
      {
        id: 'tx-restored',
        type: 'income',
        amount: 500000,
        categoryId: 'cat-salary',
        accountId: 'acc-bank',
        note: 'Restored',
        transactionAt: '2026-04-15T09:00:00+08:00',
        syncStatus: 'synced',
        deletedAt: null,
      },
    ],
    categories: [
      ...initialState.categories,
      {
        id: 'cat-restored-bonus',
        name: 'Bonus',
        type: 'income',
        isActive: true,
        isCustom: true,
      },
    ],
    syncUpdatedAt: '2026-05-13T11:00:00+08:00',
  };

  const restoredState = applyMockAppSnapshot(initialState, snapshot);

  assert.notEqual(restoredState, initialState);
  assert.equal(restoredState.currentMonth, '2026-04');
  assert.equal(restoredState.selectedEntryType, 'income');
  assert.equal(restoredState.quickAddOpen, false);
  assert.equal(restoredState.implicitLedgerAccountId, 'acc-bank');
  assert.deepEqual(restoredState.transactions, snapshot.transactions);
  assert.equal(restoredState.categories.some((category) => category.id === 'cat-food'), true);
  assert.equal(restoredState.categories.some((category) => category.id === 'cat-salary'), true);
  assert.equal(restoredState.categories.some((category) => category.id === 'cat-restored-bonus'), true);
  assert.equal(restoredState.syncUpdatedAt, '2026-05-13T11:00:00+08:00');
  assert.deepEqual(restoredState.seedTransactions, initialState.seedTransactions);
  assert.deepEqual(restoredState.statisticsByMonth, initialState.statisticsByMonth);
  assert.deepEqual(restoredState.user, initialState.user);
});

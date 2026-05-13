import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createInitialMockAppState,
  mockAppReducer,
  selectCurrentMonthData,
  selectSyncSummary,
} from './mock-app-state.js';
import {
  mergePersistedCustomDefinitions,
  selectPersistedCustomDefinitions,
} from './mock-app-persistence-support.js';

test('builds current month summary and sync state from the mock foundations', () => {
  const state = createInitialMockAppState();
  const monthData = selectCurrentMonthData(state);
  const syncSummary = selectSyncSummary(state);

  assert.equal(state.currentMonth, '2026-05');
  assert.equal(state.implicitLedgerAccountId, state.user.defaultAccountId);
  assert.equal(monthData.summary.income, 1460000);
  assert.equal(monthData.summary.expense, 19480);
  assert.equal(monthData.summary.balance, 1440520);
  assert.equal(monthData.summary.pendingCount, 1);
  assert.equal(monthData.summary.failedCount, 1);
  assert.equal(monthData.transactions.length, 6);
  assert.deepEqual(syncSummary, {
    status: 'failed',
    pendingCount: 1,
    failedCount: 1,
    updatedAt: '2026-05-11T12:40:00+08:00',
  });
});

test('switches month using seeded statistics even when that month has no transactions in memory', () => {
  const initialState = createInitialMockAppState();
  const state = mockAppReducer(initialState, {
    type: 'setCurrentMonth',
    month: '2026-04',
  });
  const monthData = selectCurrentMonthData(state);

  assert.equal(state.currentMonth, '2026-04');
  assert.equal(monthData.summary.income, 1180000);
  assert.equal(monthData.summary.expense, 286400);
  assert.equal(monthData.summary.balance, 893600);
  assert.equal(monthData.transactions.length, 0);
});

test('merges April seeded baseline with the first live transaction instead of replacing it', () => {
  const initialState = createInitialMockAppState();
  const state = mockAppReducer(initialState, {
    type: 'addTransaction',
    transaction: {
      id: 'tx-april-test-book',
      type: 'expense',
      amount: 5000,
      categoryId: 'cat-food',
      accountId: 'acc-cash',
      note: 'April test',
      transactionAt: '2026-04-18T09:30:00+08:00',
      syncStatus: 'pending',
    },
  });
  const monthData = selectCurrentMonthData(state);

  assert.equal(state.currentMonth, '2026-04');
  assert.equal(monthData.summary.income, 1180000);
  assert.equal(monthData.summary.expense, 291400);
  assert.equal(monthData.summary.balance, 888600);
  assert.equal(monthData.summary.pendingCount, 1);
  assert.equal(monthData.summary.failedCount, 0);
  assert.equal(monthData.statistics.transactionCount, 19);
  assert.deepEqual(monthData.statistics.expenseBreakdown, [
    { categoryId: 'cat-groceries', amount: 124200, percent: 43 },
    { categoryId: 'cat-food', amount: 101200, percent: 35 },
    { categoryId: 'cat-commute', amount: 66000, percent: 23 },
  ]);
  assert.equal(monthData.transactions.length, 1);
  assert.equal(monthData.transactions[0].id, 'tx-april-test-book');
});

test('adds a transaction and keeps month and sync summaries aligned', () => {
  const initialState = createInitialMockAppState();
  const state = mockAppReducer(initialState, {
    type: 'addTransaction',
    transaction: {
      id: 'tx-test-book',
      type: 'expense',
      amount: 5000,
      categoryId: 'cat-food',
      accountId: 'acc-cash',
      note: 'Test',
      transactionAt: '2026-05-12T09:30:00+08:00',
      syncStatus: 'pending',
    },
  });
  const monthData = selectCurrentMonthData(state);
  const syncSummary = selectSyncSummary(state);

  assert.equal(monthData.transactions[0].id, 'tx-test-book');
  assert.equal(monthData.summary.expense, 24480);
  assert.equal(monthData.summary.balance, 1435520);
  assert.equal(monthData.summary.pendingCount, 2);
  assert.equal(syncSummary.pendingCount, 2);
  assert.equal(syncSummary.failedCount, 1);
});

test('updates a transaction in place and keeps month and sync summaries aligned', () => {
  const initialState = createInitialMockAppState();
  const state = mockAppReducer(initialState, {
    type: 'updateTransaction',
    transactionId: 'tx-coffee',
    updates: {
      amount: 3600,
      categoryId: 'cat-food',
      note: 'Team coffee',
      syncStatus: 'pending',
    },
  });
  const monthData = selectCurrentMonthData(state);
  const syncSummary = selectSyncSummary(state);
  const transaction = state.transactions.find((item) => item.id === 'tx-coffee');

  assert.equal(transaction?.amount, 3600);
  assert.equal(transaction?.categoryId, 'cat-food');
  assert.equal(transaction?.note, 'Team coffee');
  assert.equal(transaction?.syncStatus, 'pending');
  assert.equal(monthData.summary.expense, 20280);
  assert.equal(monthData.summary.balance, 1439720);
  assert.equal(monthData.summary.pendingCount, 2);
  assert.equal(monthData.summary.failedCount, 0);
  assert.equal(syncSummary.status, 'pending');
  assert.equal(syncSummary.pendingCount, 2);
  assert.equal(syncSummary.failedCount, 0);
});

test('moves an edited transaction across month boundaries and keeps summaries aligned', () => {
  const initialState = createInitialMockAppState();
  const state = mockAppReducer(initialState, {
    type: 'updateTransaction',
    transactionId: 'tx-coffee',
    updates: {
      amount: 5000,
      categoryId: 'cat-food',
      accountId: 'acc-cash',
      note: 'April coffee',
      transactionAt: '2026-04-20T10:05:00+08:00',
      syncStatus: 'pending',
    },
  });
  const monthData = selectCurrentMonthData(state);
  const syncSummary = selectSyncSummary(state);
  const transaction = state.transactions.find((item) => item.id === 'tx-coffee');

  assert.equal(state.currentMonth, '2026-04');
  assert.equal(transaction?.transactionAt, '2026-04-20T10:05:00+08:00');
  assert.equal(transaction?.accountId, 'acc-cash');
  assert.equal(monthData.transactions[0].id, 'tx-coffee');
  assert.equal(monthData.summary.income, 1180000);
  assert.equal(monthData.summary.expense, 291400);
  assert.equal(monthData.summary.balance, 888600);
  assert.equal(monthData.summary.pendingCount, 1);
  assert.equal(monthData.summary.failedCount, 0);
  assert.equal(monthData.statistics.transactionCount, 19);
  assert.deepEqual(monthData.statistics.expenseBreakdown, [
    { categoryId: 'cat-groceries', amount: 124200, percent: 43 },
    { categoryId: 'cat-food', amount: 101200, percent: 35 },
    { categoryId: 'cat-commute', amount: 66000, percent: 23 },
  ]);
  assert.equal(syncSummary.status, 'pending');
  assert.equal(syncSummary.pendingCount, 2);
  assert.equal(syncSummary.failedCount, 0);
});

test('deletes a transaction and updates derived balances and counts', () => {
  const initialState = createInitialMockAppState();
  const state = mockAppReducer(initialState, {
    type: 'deleteTransaction',
    transactionId: 'tx-coffee',
  });
  const monthData = selectCurrentMonthData(state);
  const syncSummary = selectSyncSummary(state);
  const deletedTransaction = state.transactions.find((item) => item.id === 'tx-coffee');

  assert.equal(monthData.summary.expense, 16680);
  assert.equal(monthData.summary.balance, 1443320);
  assert.equal(monthData.summary.failedCount, 0);
  assert.equal(monthData.summary.pendingCount, 1);
  assert.equal(monthData.transactions.some((item) => item.id === 'tx-coffee'), false);
  assert.equal(deletedTransaction?.syncStatus, 'pending');
  assert.equal(typeof deletedTransaction?.deletedAt, 'string');
  assert.equal(syncSummary.status, 'pending');
  assert.equal(syncSummary.pendingCount, 1);
  assert.equal(syncSummary.failedCount, 0);
});

test('updates transaction sync status and recalculates sync-derived selectors', () => {
  const initialState = createInitialMockAppState();
  const state = mockAppReducer(initialState, {
    type: 'updateTransactionSyncStatus',
    transactionId: 'tx-coffee',
    syncStatus: 'synced',
  });
  const monthData = selectCurrentMonthData(state);
  const syncSummary = selectSyncSummary(state);

  assert.equal(monthData.summary.failedCount, 0);
  assert.equal(monthData.summary.pendingCount, 1);
  assert.equal(monthData.summary.syncStatus, 'pending');
  assert.equal(syncSummary.status, 'pending');
  assert.equal(syncSummary.failedCount, 0);
});

test('adds a custom category and keeps it active in the selected type list', () => {
  const initialState = createInitialMockAppState();
  const state = mockAppReducer(initialState, {
    type: 'addCategory',
    category: {
      id: 'cat-custom-snacks',
      name: 'Snacks',
      type: 'expense',
      isActive: true,
      isCustom: true,
    },
  });

  assert.equal(state.categories.at(-1)?.id, 'cat-custom-snacks');
  assert.equal(state.categories.at(-1)?.name, 'Snacks');
  assert.equal(state.categories.at(-1)?.isCustom, true);
});

test('toggles a category active state in place', () => {
  const initialState = createInitialMockAppState();
  const state = mockAppReducer(initialState, {
    type: 'toggleCategoryActive',
    categoryId: 'cat-food',
    isActive: false,
  });

  assert.equal(state.categories.find((item) => item.id === 'cat-food')?.isActive, false);
});

test('selects only custom categories for persistence', () => {
  const state = mockAppReducer(createInitialMockAppState(), {
    type: 'addCategory',
    category: {
      id: 'cat-custom-snacks',
      name: 'Snacks',
      type: 'expense',
      isActive: true,
      isCustom: true,
    },
  });

  assert.deepEqual(selectPersistedCustomDefinitions(state), {
    categories: [
      {
        id: 'cat-custom-snacks',
        name: 'Snacks',
        type: 'expense',
        isActive: true,
        isCustom: true,
      },
    ],
    accounts: [],
  });
});

test('merges persisted custom definitions without duplicating seeded ids', () => {
  const initialState = createInitialMockAppState();
  const merged = mergePersistedCustomDefinitions(initialState, {
    categories: [
      {
        id: 'cat-food',
        name: 'Duplicate Seed',
        type: 'expense',
        isActive: true,
        isCustom: true,
      },
      {
        id: 'cat-custom-snacks',
        name: 'Snacks',
        type: 'expense',
        isActive: true,
        isCustom: true,
      },
    ],
  });

  assert.equal(merged.categories.filter((item) => item.id === 'cat-food').length, 1);
  assert.equal(merged.implicitLedgerAccountId, initialState.implicitLedgerAccountId);
  assert.equal(merged.categories.at(-1)?.id, 'cat-custom-snacks');
});

test('hydrates a persisted snapshot into state while keeping seeded foundations', () => {
  const initialState = createInitialMockAppState();
  const state = mockAppReducer(initialState, {
    type: 'hydrateSnapshot',
    snapshot: {
      currentMonth: '2026-04',
      selectedEntryType: 'income',
      implicitLedgerAccountId: 'acc-bank',
      transactions: [
        {
          id: 'tx-restored',
          type: 'income',
          amount: 8888,
          categoryId: 'cat-freelance',
          accountId: 'acc-bank',
          note: 'Restored',
          transactionAt: '2026-04-22T09:00:00+08:00',
          syncStatus: 'pending',
          deletedAt: '2026-05-13T11:05:00+08:00',
        },
      ],
      categories: [
        ...initialState.categories,
        {
          id: 'cat-custom-bonus',
          name: 'Bonus',
          type: 'income',
          isActive: true,
          isCustom: true,
        },
      ],
      syncUpdatedAt: '2026-05-13T11:00:00+08:00',
    },
  });

  assert.equal(state.currentMonth, '2026-04');
  assert.equal(state.selectedEntryType, 'income');
  assert.equal(state.implicitLedgerAccountId, 'acc-bank');
  assert.deepEqual(state.transactions, [
    {
      id: 'tx-restored',
      type: 'income',
      amount: 8888,
      categoryId: 'cat-freelance',
      accountId: 'acc-bank',
      note: 'Restored',
      transactionAt: '2026-04-22T09:00:00+08:00',
      syncStatus: 'pending',
      deletedAt: '2026-05-13T11:05:00+08:00',
    },
  ]);
  assert.equal(state.categories.at(-1)?.id, 'cat-custom-bonus');
  assert.equal(state.syncUpdatedAt, '2026-05-13T11:00:00+08:00');
  assert.deepEqual(state.seedTransactions, initialState.seedTransactions);
  assert.deepEqual(state.statisticsByMonth, initialState.statisticsByMonth);
});

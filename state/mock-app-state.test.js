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

function buildTransaction(overrides = {}) {
  return {
    id: 'tx-test',
    type: 'expense',
    amount: 5000,
    categoryId: 'cat-food',
    accountId: 'acc-cash',
    note: 'Test',
    transactionAt: '2026-05-12T09:30:00+08:00',
    syncStatus: 'pending',
    ...overrides,
  };
}

test('builds an empty unauthenticated foundation state', () => {
  const state = createInitialMockAppState();
  const monthData = selectCurrentMonthData(state);
  const syncSummary = selectSyncSummary(state);

  assert.equal(state.user.name, '未登录');
  assert.equal(state.user.email, '');
  assert.equal(state.implicitLedgerAccountId, '');
  assert.deepEqual(state.categories, []);
  assert.deepEqual(state.transactions, []);
  assert.equal(monthData.summary.income, 0);
  assert.equal(monthData.summary.expense, 0);
  assert.equal(monthData.summary.balance, 0);
  assert.equal(monthData.transactions.length, 0);
  assert.deepEqual(syncSummary, {
    status: 'synced',
    pendingCount: 0,
    failedCount: 0,
    updatedAt: '2026-05-11T12:40:00+08:00',
  });
});

test('adds a transaction and derives month and sync summaries from live data only', () => {
  const state = mockAppReducer(createInitialMockAppState(), {
    type: 'addTransaction',
    transaction: buildTransaction(),
  });
  const monthData = selectCurrentMonthData(state);
  const syncSummary = selectSyncSummary(state);

  assert.equal(monthData.transactions[0].id, 'tx-test');
  assert.equal(monthData.summary.expense, 5000);
  assert.equal(monthData.summary.balance, -5000);
  assert.equal(monthData.summary.pendingCount, 1);
  assert.equal(syncSummary.status, 'pending');
  assert.equal(syncSummary.pendingCount, 1);
});

test('updates a transaction in place and keeps derived summaries aligned', () => {
  const initialState = mockAppReducer(createInitialMockAppState(), {
    type: 'addTransaction',
    transaction: buildTransaction({ id: 'tx-edit', syncStatus: 'synced' }),
  });
  const state = mockAppReducer(initialState, {
    type: 'updateTransaction',
    transactionId: 'tx-edit',
    updates: {
      amount: 3600,
      categoryId: 'cat-snacks',
      note: 'Team coffee',
      syncStatus: 'pending',
    },
  });
  const monthData = selectCurrentMonthData(state);
  const syncSummary = selectSyncSummary(state);

  assert.equal(monthData.summary.expense, 3600);
  assert.equal(monthData.summary.balance, -3600);
  assert.equal(monthData.summary.pendingCount, 1);
  assert.equal(syncSummary.status, 'pending');
  assert.equal(syncSummary.pendingCount, 1);
  assert.equal(state.transactions[0].categoryId, 'cat-snacks');
});

test('moves an edited transaction across month boundaries', () => {
  const initialState = mockAppReducer(createInitialMockAppState(), {
    type: 'addTransaction',
    transaction: buildTransaction({ id: 'tx-shift', syncStatus: 'synced' }),
  });
  const state = mockAppReducer(initialState, {
    type: 'updateTransaction',
    transactionId: 'tx-shift',
    updates: {
      transactionAt: '2026-04-20T10:05:00+08:00',
      syncStatus: 'pending',
    },
  });
  const monthData = selectCurrentMonthData(state);

  assert.equal(state.currentMonth, '2026-04');
  assert.equal(monthData.transactions[0].id, 'tx-shift');
  assert.equal(monthData.summary.expense, 5000);
  assert.equal(monthData.summary.pendingCount, 1);
});

test('deletes a transaction and removes it from derived month lists', () => {
  const initialState = mockAppReducer(createInitialMockAppState(), {
    type: 'addTransaction',
    transaction: buildTransaction({ id: 'tx-delete', syncStatus: 'synced' }),
  });
  const state = mockAppReducer(initialState, {
    type: 'deleteTransaction',
    transactionId: 'tx-delete',
  });
  const monthData = selectCurrentMonthData(state);
  const syncSummary = selectSyncSummary(state);
  const deletedTransaction = state.transactions.find((item) => item.id === 'tx-delete');

  assert.equal(monthData.transactions.length, 0);
  assert.equal(monthData.summary.expense, 0);
  assert.equal(monthData.summary.pendingCount, 0);
  assert.equal(deletedTransaction?.syncStatus, 'pending');
  assert.equal(typeof deletedTransaction?.deletedAt, 'string');
  assert.equal(syncSummary.status, 'synced');
});

test('updates transaction sync status and recalculates sync-derived selectors', () => {
  const initialState = mockAppReducer(createInitialMockAppState(), {
    type: 'addTransaction',
    transaction: buildTransaction({ id: 'tx-sync' }),
  });
  const state = mockAppReducer(initialState, {
    type: 'updateTransactionSyncStatus',
    transactionId: 'tx-sync',
    syncStatus: 'synced',
  });
  const monthData = selectCurrentMonthData(state);
  const syncSummary = selectSyncSummary(state);

  assert.equal(monthData.summary.failedCount, 0);
  assert.equal(monthData.summary.pendingCount, 0);
  assert.equal(monthData.summary.syncStatus, 'synced');
  assert.equal(syncSummary.status, 'synced');
});

test('adds a custom category and keeps it active in state', () => {
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

  assert.equal(state.categories.at(-1)?.id, 'cat-custom-snacks');
  assert.equal(state.categories.at(-1)?.isCustom, true);
});

test('toggles a category active state in place', () => {
  const initialState = mockAppReducer(createInitialMockAppState(), {
    type: 'addCategory',
    category: {
      id: 'cat-food',
      name: 'Food',
      type: 'expense',
      isActive: true,
      isCustom: true,
    },
  });
  const state = mockAppReducer(initialState, {
    type: 'toggleCategoryActive',
    categoryId: 'cat-food',
    isActive: false,
  });

  assert.equal(state.categories.find((item) => item.id === 'cat-food')?.isActive, false);
});

test('deleting a category also soft-deletes transactions under that category', () => {
  const withCategory = mockAppReducer(createInitialMockAppState(), {
    type: 'addCategory',
    category: {
      id: 'cat-food',
      name: 'Food',
      type: 'expense',
      isActive: true,
      isCustom: true,
    },
  });
  const withTransactions = mockAppReducer(
    mockAppReducer(withCategory, {
      type: 'addTransaction',
      transaction: buildTransaction({ id: 'tx-food', categoryId: 'cat-food', syncStatus: 'synced' }),
    }),
    {
      type: 'addTransaction',
      transaction: buildTransaction({
        id: 'tx-other',
        categoryId: 'cat-commute',
        note: 'Bus',
        syncStatus: 'synced',
      }),
    }
  );

  const state = mockAppReducer(withTransactions, {
    type: 'deleteCategory',
    categoryId: 'cat-food',
  });

  const deletedCategory = state.categories.find((item) => item.id === 'cat-food');
  const deletedTransaction = state.transactions.find((item) => item.id === 'tx-food');
  const untouchedTransaction = state.transactions.find((item) => item.id === 'tx-other');
  const monthData = selectCurrentMonthData(state);

  assert.equal(deletedCategory?.isActive, false);
  assert.equal(typeof deletedCategory?.deletedAt, 'string');
  assert.equal(deletedTransaction?.syncStatus, 'pending');
  assert.equal(typeof deletedTransaction?.deletedAt, 'string');
  assert.equal(untouchedTransaction?.deletedAt, undefined);
  assert.deepEqual(monthData.transactions.map((item) => item.id), ['tx-other']);
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

test('merges persisted custom definitions into an empty baseline', () => {
  const merged = mergePersistedCustomDefinitions(createInitialMockAppState(), {
    categories: [
      {
        id: 'cat-custom-snacks',
        name: 'Snacks',
        type: 'expense',
        isActive: true,
        isCustom: true,
      },
    ],
  });

  assert.equal(merged.categories.length, 1);
  assert.equal(merged.categories[0].id, 'cat-custom-snacks');
  assert.equal(merged.implicitLedgerAccountId, '');
});

test('hydrates a persisted snapshot onto the empty baseline', () => {
  const state = mockAppReducer(createInitialMockAppState(), {
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
  assert.equal(state.transactions[0].id, 'tx-restored');
  assert.equal(state.categories[0].id, 'cat-custom-bonus');
  assert.equal(state.syncUpdatedAt, '2026-05-13T11:00:00+08:00');
});

test('resetState restores the empty unauthenticated baseline', () => {
  const withData = mockAppReducer(createInitialMockAppState(), {
    type: 'addCategory',
    category: {
      id: 'cat-custom-reset',
      name: 'Reset',
      type: 'expense',
      isActive: true,
      isCustom: true,
    },
  });
  const reset = mockAppReducer(withData, { type: 'resetState' });

  assert.equal(reset.user.name, '未登录');
  assert.deepEqual(reset.categories, []);
  assert.deepEqual(reset.transactions, []);
});

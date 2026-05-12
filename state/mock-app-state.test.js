import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createInitialMockAppState,
  mockAppReducer,
  selectAccountSummaries,
  selectCurrentMonthData,
  selectSyncSummary,
} from './mock-app-state.js';

test('builds current month and account summaries from the mock foundations', () => {
  const state = createInitialMockAppState();
  const monthData = selectCurrentMonthData(state);
  const accountSummaries = selectAccountSummaries(state);
  const syncSummary = selectSyncSummary(state);

  assert.equal(state.currentMonth, '2026-05');
  assert.equal(monthData.summary.income, 1460000);
  assert.equal(monthData.summary.expense, 19480);
  assert.equal(monthData.summary.balance, 1440520);
  assert.equal(monthData.summary.pendingCount, 1);
  assert.equal(monthData.summary.failedCount, 1);
  assert.equal(monthData.transactions.length, 6);
  assert.deepEqual(
    accountSummaries.map((account) => ({
      id: account.id,
      currentBalance: account.currentBalance,
    })),
    [
      { id: 'acc-cash', currentBalance: 75620 },
      { id: 'acc-bank', currentBalance: 1543120 },
      { id: 'acc-alipay', currentBalance: 118300 },
      { id: 'acc-wechat', currentBalance: 90300 },
    ]
  );
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

test('adds a transaction and keeps month, account, and sync summaries aligned', () => {
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
  const cashAccount = selectAccountSummaries(state).find((account) => account.id === 'acc-cash');
  const syncSummary = selectSyncSummary(state);

  assert.equal(monthData.transactions[0].id, 'tx-test-book');
  assert.equal(monthData.summary.expense, 24480);
  assert.equal(monthData.summary.balance, 1435520);
  assert.equal(monthData.summary.pendingCount, 2);
  assert.equal(cashAccount?.currentBalance, 70620);
  assert.equal(syncSummary.pendingCount, 2);
  assert.equal(syncSummary.failedCount, 1);
});

test('deletes a transaction and updates derived balances and counts', () => {
  const initialState = createInitialMockAppState();
  const state = mockAppReducer(initialState, {
    type: 'deleteTransaction',
    transactionId: 'tx-coffee',
  });
  const monthData = selectCurrentMonthData(state);
  const wechatAccount = selectAccountSummaries(state).find((account) => account.id === 'acc-wechat');
  const syncSummary = selectSyncSummary(state);

  assert.equal(monthData.summary.expense, 16680);
  assert.equal(monthData.summary.balance, 1443320);
  assert.equal(monthData.summary.failedCount, 0);
  assert.equal(wechatAccount?.currentBalance, 93100);
  assert.equal(syncSummary.status, 'pending');
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

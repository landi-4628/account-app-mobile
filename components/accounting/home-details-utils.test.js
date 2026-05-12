import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDetailsSummaryItems,
  getAccountingMonthLabel,
  groupTransactionsByDay,
} from './home-details-utils.js';

const transactions = [
  {
    id: 'tx-1',
    type: 'expense',
    amount: 3200,
    categoryId: 'cat-food',
    accountId: 'acc-wechat',
    note: 'Lunch',
    transactionAt: '2026-05-12T12:30:00+08:00',
    syncStatus: 'pending',
  },
  {
    id: 'tx-2',
    type: 'income',
    amount: 1200000,
    categoryId: 'cat-salary',
    accountId: 'acc-bank',
    note: 'Salary',
    transactionAt: '2026-05-11T09:00:00+08:00',
    syncStatus: 'synced',
  },
  {
    id: 'tx-3',
    type: 'expense',
    amount: 600,
    categoryId: 'cat-commute',
    accountId: 'acc-alipay',
    note: 'Subway',
    transactionAt: '2026-05-11T08:15:00+08:00',
    syncStatus: 'synced',
  },
];

test('uses configured month labels before falling back to formatter output', () => {
  assert.equal(getAccountingMonthLabel('2026-05'), '2026年5月');
  assert.equal(getAccountingMonthLabel('2026-03'), 'Mar 2026');
});

test('groups transactions into today, yesterday, and dated sections in ledger timezone order', () => {
  const groups = groupTransactionsByDay(transactions, 'Asia/Shanghai', '2026-05-12T18:00:00+08:00');

  assert.deepEqual(
    groups.map((group) => ({
      key: group.key,
      label: group.label,
      totalIncome: group.totalIncome,
      totalExpense: group.totalExpense,
      ids: group.transactions.map((transaction) => transaction.id),
    })),
    [
      {
        key: '2026-05-12',
        label: 'Today',
        totalIncome: 0,
        totalExpense: 3200,
        ids: ['tx-1'],
      },
      {
        key: '2026-05-11',
        label: 'Yesterday',
        totalIncome: 1200000,
        totalExpense: 600,
        ids: ['tx-2', 'tx-3'],
      },
    ]
  );
});

test('builds details summary items in the visual order used by the strip', () => {
  assert.deepEqual(
    buildDetailsSummaryItems({
      income: 1460000,
      expense: 19480,
      balance: 1440520,
    }),
    [
      { key: 'income', label: 'Income', value: 1460000, tone: 'income' },
      { key: 'expense', label: 'Expense', value: 19480, tone: 'expense' },
      { key: 'balance', label: 'Balance', value: 1440520, tone: 'default' },
    ]
  );
});

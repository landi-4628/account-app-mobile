/** @type {import('@/types/accounting').MonthlyStatistics[]} */
export const mockMonthlyStatistics = [
  {
    month: '2026-05',
    summaryCard: {
      month: '2026-05',
      income: 1460000,
      expense: 19480,
      balance: 1440520,
      syncStatus: 'pending',
      pendingCount: 1,
      failedCount: 1,
    },
    expenseBreakdown: [
      {
        categoryId: 'cat-groceries',
        amount: 12880,
        percent: 66,
      },
      {
        categoryId: 'cat-food',
        amount: 3200,
        percent: 16,
      },
      {
        categoryId: 'cat-coffee',
        amount: 2800,
        percent: 14,
      },
      {
        categoryId: 'cat-commute',
        amount: 600,
        percent: 4,
      },
    ],
    incomeBreakdown: [
      {
        categoryId: 'cat-salary',
        amount: 1200000,
        percent: 82,
      },
      {
        categoryId: 'cat-freelance',
        amount: 260000,
        percent: 18,
      },
    ],
    transactionCount: 6,
    pendingCount: 1,
  },
  {
    month: '2026-04',
    summaryCard: {
      month: '2026-04',
      income: 1180000,
      expense: 286400,
      balance: 893600,
      syncStatus: 'synced',
      pendingCount: 0,
      failedCount: 0,
    },
    expenseBreakdown: [
      {
        categoryId: 'cat-groceries',
        amount: 124200,
        percent: 43,
      },
      {
        categoryId: 'cat-food',
        amount: 96200,
        percent: 34,
      },
      {
        categoryId: 'cat-commute',
        amount: 66000,
        percent: 23,
      },
    ],
    incomeBreakdown: [
      {
        categoryId: 'cat-salary',
        amount: 1180000,
        percent: 100,
      },
    ],
    transactionCount: 18,
    pendingCount: 0,
  },
];

/** @type {import('@/types/accounting').SyncSummary} */
export const mockSyncSummary = {
  status: 'pending',
  pendingCount: 1,
  failedCount: 1,
  updatedAt: '2026-05-11T12:40:00+08:00',
};

export const mockCurrentMonth = '2026-05';

/** @type {Record<string, import('@/types/accounting').MonthlyStatistics>} */
export const mockStatisticsByMonth = Object.fromEntries(
  mockMonthlyStatistics.map((item) => [item.month, item])
);

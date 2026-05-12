// @ts-nocheck
import { mockAccounts } from '../data/mock/mock-accounts.js';
import { mockCategories } from '../data/mock/mock-categories.js';
import {
  mockCurrentMonth,
  mockMonthlyStatistics,
  mockStatisticsByMonth,
  mockSyncSummary,
} from '../data/mock/mock-statistics.js';
import { mockTransactions } from '../data/mock/mock-transactions.js';
import { mockUser } from '../data/mock/mock-user.js';

const DEFAULT_ENTRY_TYPE = 'expense';

function cloneAccounts() {
  return mockAccounts.map((account) => ({ ...account }));
}

function cloneCategories() {
  return mockCategories.map((category) => ({ ...category }));
}

function cloneTransactions() {
  return mockTransactions.map((transaction) => ({ ...transaction }));
}

function cloneStatisticsByMonth() {
  return Object.fromEntries(
    Object.entries(mockStatisticsByMonth).map(([month, stats]) => [month, structuredClone(stats)])
  );
}

function getMonthKey(transactionAt) {
  return transactionAt.slice(0, 7);
}

function sortTransactionsDescending(transactions) {
  return [...transactions].sort((left, right) => right.transactionAt.localeCompare(left.transactionAt));
}

function getSyncStatus(pendingCount, failedCount) {
  if (failedCount > 0) {
    return 'failed';
  }

  if (pendingCount > 0) {
    return 'pending';
  }

  return 'synced';
}

function buildBreakdown(transactions, entryType) {
  const filtered = transactions.filter((transaction) => transaction.type === entryType);
  const total = filtered.reduce((sum, transaction) => sum + transaction.amount, 0);
  const grouped = filtered.reduce((map, transaction) => {
    map.set(transaction.categoryId, (map.get(transaction.categoryId) ?? 0) + transaction.amount);
    return map;
  }, new Map());

  return [...grouped.entries()]
    .map(([categoryId, amount]) => ({
      categoryId,
      amount,
      percent: total === 0 ? 0 : Math.round((amount / total) * 100),
    }))
    .sort((left, right) => right.amount - left.amount);
}

export function createInitialMockAppState() {
  return {
    currentMonth: mockCurrentMonth,
    selectedEntryType: DEFAULT_ENTRY_TYPE,
    quickAddOpen: false,
    user: { ...mockUser },
    accounts: cloneAccounts(),
    categories: cloneCategories(),
    transactions: cloneTransactions(),
    statisticsByMonth: cloneStatisticsByMonth(),
    syncUpdatedAt: mockSyncSummary.updatedAt,
  };
}

export function mockAppReducer(state, action) {
  switch (action.type) {
    case 'openQuickAdd':
      return { ...state, quickAddOpen: true };
    case 'closeQuickAdd':
      return { ...state, quickAddOpen: false };
    case 'setSelectedEntryType':
      return { ...state, selectedEntryType: action.entryType };
    case 'setCurrentMonth':
      return { ...state, currentMonth: action.month };
    case 'addTransaction':
      return {
        ...state,
        currentMonth: getMonthKey(action.transaction.transactionAt),
        transactions: sortTransactionsDescending([action.transaction, ...state.transactions]),
      };
    case 'deleteTransaction':
      return {
        ...state,
        transactions: state.transactions.filter(
          (transaction) => transaction.id !== action.transactionId
        ),
      };
    case 'updateTransactionSyncStatus':
      return {
        ...state,
        syncUpdatedAt: action.updatedAt ?? state.syncUpdatedAt,
        transactions: state.transactions.map((transaction) =>
          transaction.id === action.transactionId
            ? { ...transaction, syncStatus: action.syncStatus }
            : transaction
        ),
      };
    default:
      return state;
  }
}

export function selectAvailableMonths(state) {
  const months = new Set(Object.keys(state.statisticsByMonth));

  state.transactions.forEach((transaction) => {
    months.add(getMonthKey(transaction.transactionAt));
  });

  return [...months].sort((left, right) => right.localeCompare(left));
}

export function selectCurrentMonthTransactions(state) {
  return sortTransactionsDescending(
    state.transactions.filter((transaction) => getMonthKey(transaction.transactionAt) === state.currentMonth)
  );
}

export function selectCurrentMonthSummary(state) {
  const transactions = selectCurrentMonthTransactions(state);
  const fallback = state.statisticsByMonth[state.currentMonth]?.summaryCard;

  if (transactions.length === 0 && fallback) {
    return { ...fallback };
  }

  const income = transactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const expense = transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const pendingCount = transactions.filter((transaction) => transaction.syncStatus === 'pending').length;
  const failedCount = transactions.filter((transaction) => transaction.syncStatus === 'failed').length;

  return {
    month: state.currentMonth,
    income,
    expense,
    balance: income - expense,
    syncStatus: getSyncStatus(pendingCount, failedCount),
    pendingCount,
    failedCount,
  };
}

export function selectCurrentMonthStatistics(state) {
  const transactions = selectCurrentMonthTransactions(state);
  const fallback = state.statisticsByMonth[state.currentMonth];

  if (transactions.length === 0 && fallback) {
    return structuredClone(fallback);
  }

  return {
    month: state.currentMonth,
    summaryCard: selectCurrentMonthSummary(state),
    expenseBreakdown: buildBreakdown(transactions, 'expense'),
    incomeBreakdown: buildBreakdown(transactions, 'income'),
    transactionCount: transactions.length,
    pendingCount: transactions.filter((transaction) => transaction.syncStatus === 'pending').length,
  };
}

export function selectAccountSummaries(state) {
  return state.accounts.map((account) => {
    const delta = state.transactions.reduce((sum, transaction) => {
      if (transaction.accountId !== account.id) {
        return sum;
      }

      return sum + (transaction.type === 'income' ? transaction.amount : -transaction.amount);
    }, 0);

    return {
      ...account,
      currentBalance: account.initialBalance + delta,
    };
  });
}

export function selectSyncSummary(state) {
  const pendingCount = state.transactions.filter((transaction) => transaction.syncStatus === 'pending').length;
  const failedCount = state.transactions.filter((transaction) => transaction.syncStatus === 'failed').length;

  return {
    status: getSyncStatus(pendingCount, failedCount),
    pendingCount,
    failedCount,
    updatedAt: state.syncUpdatedAt,
  };
}

export function selectCurrentMonthData(state) {
  return {
    month: state.currentMonth,
    transactions: selectCurrentMonthTransactions(state),
    summary: selectCurrentMonthSummary(state),
    statistics: selectCurrentMonthStatistics(state),
    availableMonths: selectAvailableMonths(state),
  };
}

export function selectCategoriesByType(state, entryType) {
  return state.categories.filter((category) => category.type === entryType);
}

export function selectTransactionById(state, transactionId) {
  return state.transactions.find((transaction) => transaction.id === transactionId) ?? null;
}

export function selectSeededMonthlyStatistics() {
  return mockMonthlyStatistics.map((item) => structuredClone(item));
}

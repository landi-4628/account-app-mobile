import {
  mockCurrentMonth,
  mockSyncSummary,
} from '../data/mock/mock-statistics.js';
import { mergePersistedCustomDefinitions } from './mock-app-persistence-support.js';
import { applyMockAppSnapshot } from './mock-app-snapshot.js';

const DEFAULT_ENTRY_TYPE = 'expense';

/**
 * @typedef {import('../types/accounting').EntryType} EntryType
 * @typedef {import('../types/accounting').CategoryId} CategoryId
 * @typedef {import('../types/accounting').LedgerCategory} LedgerCategory
 * @typedef {import('../types/accounting').TransactionRecord} TransactionRecord
 * @typedef {TransactionRecord & { deletedAt?: string | null | undefined }} LocalTransactionRecord
 * @typedef {import('../types/accounting').SummaryCardData} SummaryCardData
 * @typedef {import('../types/accounting').CategoryBreakdownItem} CategoryBreakdownItem
 * @typedef {import('../types/accounting').MonthlyStatistics} MonthlyStatistics
 * @typedef {import('../types/accounting').SyncSummary} SyncSummary
 */

/**
 * @typedef {object} MockAppState
 * @property {string} currentMonth
 * @property {EntryType} selectedEntryType
 * @property {boolean} quickAddOpen
 * @property {import('../types/accounting').AccountingUser} user
 * @property {string} implicitLedgerAccountId
 * @property {LedgerCategory[]} categories
 * @property {LocalTransactionRecord[]} transactions
 * @property {LocalTransactionRecord[]} seedTransactions
 * @property {Record<string, MonthlyStatistics>} statisticsByMonth
 * @property {string} syncUpdatedAt
 */

/**
 * @typedef {{ type: 'openQuickAdd' }} OpenQuickAddAction
 * @typedef {{ type: 'closeQuickAdd' }} CloseQuickAddAction
 * @typedef {{ type: 'setSelectedEntryType', entryType: EntryType }} SetSelectedEntryTypeAction
 * @typedef {{ type: 'setCurrentMonth', month: string }} SetCurrentMonthAction
 * @typedef {{ type: 'addTransaction', transaction: LocalTransactionRecord }} AddTransactionAction
 * @typedef {{ type: 'updateTransaction', transactionId: string, updates: Partial<LocalTransactionRecord> }} UpdateTransactionAction
 * @typedef {{ type: 'deleteTransaction', transactionId: string }} DeleteTransactionAction
 * @typedef {{ type: 'updateTransactionSyncStatus', transactionId: string, syncStatus: import('../types/accounting').SyncStatus, updatedAt?: string | undefined }} UpdateTransactionSyncStatusAction
 * @typedef {{ type: 'addCategory', category: LedgerCategory }} AddCategoryAction
 * @typedef {{ type: 'toggleCategoryActive', categoryId: string, isActive: boolean }} ToggleCategoryActiveAction
 * @typedef {{ type: 'updateCategory', categoryId: string, updates: Partial<LedgerCategory> }} UpdateCategoryAction
 * @typedef {{ type: 'deleteCategory', categoryId: string }} DeleteCategoryAction
 * @typedef {{ type: 'reconcileCustomDefinitions', categories: LedgerCategory[] }} ReconcileCustomDefinitionsAction
 * @typedef {{ type: 'hydrateCustomDefinitions', definitions: { categories?: LedgerCategory[] | undefined } }} HydrateCustomDefinitionsAction
 * @typedef {{ type: 'hydrateSnapshot', snapshot: import('./mock-app-snapshot.js').MockAppSnapshot }} HydrateSnapshotAction
 * @typedef {{ type: 'resetState' }} ResetStateAction
 * @typedef {OpenQuickAddAction | CloseQuickAddAction | SetSelectedEntryTypeAction | SetCurrentMonthAction | AddTransactionAction | UpdateTransactionAction | DeleteTransactionAction | UpdateTransactionSyncStatusAction | AddCategoryAction | ToggleCategoryActiveAction | UpdateCategoryAction | DeleteCategoryAction | ReconcileCustomDefinitionsAction | HydrateCustomDefinitionsAction | HydrateSnapshotAction | ResetStateAction} MockAppAction
 */

/**
 * @typedef {object} SummaryDelta
 * @property {number} income
 * @property {number} expense
 * @property {number} pendingCount
 * @property {number} failedCount
 * @property {number} transactionCount
 */

/**
 * @typedef {object} MonthDelta
 * @property {SummaryDelta} summary
 * @property {Map<CategoryId, number>} expenseAmounts
 * @property {Map<CategoryId, number>} incomeAmounts
 */

/**
 * @typedef {object} CurrentMonthData
 * @property {string} month
 * @property {TransactionRecord[]} transactions
 * @property {SummaryCardData} summary
 * @property {MonthlyStatistics} statistics
 * @property {string[]} availableMonths
 */

const EMPTY_USER = {
  id: '',
  name: '未登录',
  email: '',
  ledgerName: '',
  currency: 'CNY',
  timezone: 'Asia/Shanghai',
  defaultAccountId: '',
};

/**
 * @param {string} transactionAt
 * @returns {string}
 */
function getMonthKey(transactionAt) {
  return transactionAt.slice(0, 7);
}

/**
 * @param {LocalTransactionRecord[]} transactions
 * @returns {LocalTransactionRecord[]}
 */
function sortTransactionsDescending(transactions) {
  return [...transactions].sort((left, right) => right.transactionAt.localeCompare(left.transactionAt));
}

/**
 * @param {TransactionRecord & { deletedAt?: string | null | undefined }} transaction
 * @returns {boolean}
 */
function isDeletedTransaction(transaction) {
  return transaction.deletedAt != null;
}

/**
 * @param {number} pendingCount
 * @param {number} failedCount
 * @returns {import('../types/accounting').SyncStatus}
 */
function getSyncStatus(pendingCount, failedCount) {
  if (failedCount > 0) {
    return 'failed';
  }

  if (pendingCount > 0) {
    return 'pending';
  }

  return 'synced';
}

/**
 * @param {string} month
 * @returns {SummaryCardData}
 */
function createEmptySummary(month) {
  return {
    month,
    income: 0,
    expense: 0,
    balance: 0,
    syncStatus: 'synced',
    pendingCount: 0,
    failedCount: 0,
  };
}

/**
 * @returns {SummaryDelta}
 */
function createEmptySummaryDelta() {
  return {
    income: 0,
    expense: 0,
    pendingCount: 0,
    failedCount: 0,
    transactionCount: 0,
  };
}

/**
 * @param {string} month
 * @returns {MonthlyStatistics}
 */
function createEmptyStatistics(month) {
  return {
    month,
    summaryCard: createEmptySummary(month),
    expenseBreakdown: [],
    incomeBreakdown: [],
    transactionCount: 0,
    pendingCount: 0,
  };
}

/**
 * @param {CategoryBreakdownItem[]} items
 * @returns {Map<CategoryId, number>}
 */
function breakdownItemsToMap(items) {
  return items.reduce((map, item) => {
    map.set(item.categoryId, item.amount);
    return map;
  }, new Map());
}

/**
 * @param {Map<CategoryId, number>} amounts
 * @param {Map<CategoryId, number>} delta
 */
function applyBreakdownDelta(amounts, delta) {
  delta.forEach((amount, categoryId) => {
    const nextAmount = (amounts.get(categoryId) ?? 0) + amount;

    if (nextAmount <= 0) {
      amounts.delete(categoryId);
      return;
    }

    amounts.set(categoryId, nextAmount);
  });
}

/**
 * @param {Map<CategoryId, number>} amounts
 * @param {number} total
 * @returns {CategoryBreakdownItem[]}
 */
function buildBreakdownFromMap(amounts, total) {
  return [...amounts.entries()]
    .map(([categoryId, amount]) => ({
      categoryId,
      amount,
      percent: total === 0 ? 0 : Math.round((amount / total) * 100),
    }))
    .sort((left, right) => right.amount - left.amount);
}

/**
 * @param {SummaryDelta} summary
 * @param {Map<CategoryId, number>} breakdown
 * @param {LocalTransactionRecord | undefined} transaction
 * @param {1 | -1} direction
 */
function applyTransactionDelta(summary, breakdown, transaction, direction) {
  if (!transaction) {
    return;
  }

  if (transaction.type === 'income') {
    summary.income += transaction.amount * direction;
  } else {
    summary.expense += transaction.amount * direction;
  }

  summary.transactionCount += direction;

  if (transaction.syncStatus === 'pending') {
    summary.pendingCount += direction;
  }

  if (transaction.syncStatus === 'failed') {
    summary.failedCount += direction;
  }

  const nextAmount = (breakdown.get(transaction.categoryId) ?? 0) + transaction.amount * direction;

  if (nextAmount === 0) {
    breakdown.delete(transaction.categoryId);
    return;
  }

  breakdown.set(transaction.categoryId, nextAmount);
}

/**
 * @param {MockAppState} state
 * @param {string} month
 * @returns {MonthDelta}
 */
function calculateMonthDelta(state, month) {
  /** @type {Map<string, LocalTransactionRecord>} */
  const currentById = new Map();
  /** @type {Map<string, LocalTransactionRecord>} */
  const seedById = new Map();

  state.transactions.forEach((transaction) => {
    if (!isDeletedTransaction(transaction) && getMonthKey(transaction.transactionAt) === month) {
      currentById.set(transaction.id, transaction);
    }
  });

  state.seedTransactions.forEach((transaction) => {
    if (getMonthKey(transaction.transactionAt) === month) {
      seedById.set(transaction.id, transaction);
    }
  });

  const summary = createEmptySummaryDelta();
  /** @type {Map<CategoryId, number>} */
  const expenseAmounts = new Map();
  /** @type {Map<CategoryId, number>} */
  const incomeAmounts = new Map();

  new Set([...seedById.keys(), ...currentById.keys()]).forEach((transactionId) => {
    const seedTransaction = seedById.get(transactionId);
    const currentTransaction = currentById.get(transactionId);

    applyTransactionDelta(
      summary,
      seedTransaction?.type === 'income' ? incomeAmounts : expenseAmounts,
      seedTransaction,
      -1
    );
    applyTransactionDelta(
      summary,
      currentTransaction?.type === 'income' ? incomeAmounts : expenseAmounts,
      currentTransaction,
      1
    );
  });

  return {
    summary,
    expenseAmounts,
    incomeAmounts,
  };
}

/**
 * @param {MockAppState} state
 * @param {string} month
 * @returns {MonthlyStatistics}
 */
function mergeMonthStatistics(state, month) {
  const baseStatistics = state.statisticsByMonth[month]
    ? structuredClone(state.statisticsByMonth[month])
    : createEmptyStatistics(month);
  const delta = calculateMonthDelta(state, month);
  const income = baseStatistics.summaryCard.income + delta.summary.income;
  const expense = baseStatistics.summaryCard.expense + delta.summary.expense;
  const pendingCount = Math.max(0, baseStatistics.summaryCard.pendingCount + delta.summary.pendingCount);
  const failedCount = Math.max(0, baseStatistics.summaryCard.failedCount + delta.summary.failedCount);
  const expenseAmounts = breakdownItemsToMap(baseStatistics.expenseBreakdown);
  const incomeAmounts = breakdownItemsToMap(baseStatistics.incomeBreakdown);

  applyBreakdownDelta(expenseAmounts, delta.expenseAmounts);
  applyBreakdownDelta(incomeAmounts, delta.incomeAmounts);

  return {
    month,
    summaryCard: {
      month,
      income,
      expense,
      balance: income - expense,
      syncStatus: getSyncStatus(pendingCount, failedCount),
      pendingCount,
      failedCount,
    },
    expenseBreakdown: buildBreakdownFromMap(expenseAmounts, expense),
    incomeBreakdown: buildBreakdownFromMap(incomeAmounts, income),
    transactionCount: Math.max(0, baseStatistics.transactionCount + delta.summary.transactionCount),
    pendingCount,
  };
}

/** @returns {MockAppState} */
export function createInitialMockAppState() {
  return {
    currentMonth: mockCurrentMonth,
    selectedEntryType: DEFAULT_ENTRY_TYPE,
    quickAddOpen: false,
    user: { ...EMPTY_USER },
    implicitLedgerAccountId: '',
    categories: [],
    transactions: [],
    seedTransactions: [],
    statisticsByMonth: {},
    syncUpdatedAt: mockSyncSummary.updatedAt,
  };
}

/**
 * @template {{ id: string, isCustom?: boolean | undefined }} T
 * @param {T[]} base
 * @param {T[]} incoming
 * @returns {T[]}
 */
function reconcileCustomRows(base, incoming) {
  const incomingById = new Map(incoming.map((item) => [item.id, item]));
  const merged = base.map((item) => {
    if (!item.isCustom) {
      return item;
    }

    const patch = incomingById.get(item.id);
    return patch ? { ...item, ...patch } : item;
  });
  const baseIds = new Set(base.map((b) => b.id));
  const appended = incoming.filter((item) => !baseIds.has(item.id));
  return [...merged, ...appended];
}

/**
 * @param {MockAppState} state
 * @param {MockAppAction} action
 * @returns {MockAppState}
 */
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
    case 'updateTransaction': {
      let nextMonth = state.currentMonth;
      const nextTransactions = state.transactions.map((transaction) => {
        if (transaction.id !== action.transactionId) {
          return transaction;
        }

        const nextTransaction = { ...transaction, ...action.updates };
        nextMonth = getMonthKey(nextTransaction.transactionAt);
        return nextTransaction;
      });

      return {
        ...state,
        currentMonth: nextMonth,
        transactions: sortTransactionsDescending(nextTransactions),
      };
    }
    case 'deleteTransaction':
      return {
        ...state,
        transactions: state.transactions.map((transaction) =>
          transaction.id === action.transactionId
            ? {
                ...transaction,
                deletedAt: transaction.deletedAt ?? new Date().toISOString(),
                syncStatus: 'pending',
              }
            : transaction
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
    case 'addCategory':
      return {
        ...state,
        categories: [...state.categories, action.category],
      };
    case 'toggleCategoryActive':
      return {
        ...state,
        categories: state.categories.map((category) =>
          category.id === action.categoryId
            ? { ...category, isActive: action.isActive }
            : category
        ),
      };
    case 'updateCategory':
      return {
        ...state,
        categories: state.categories.map((category) =>
          category.id === action.categoryId ? { ...category, ...action.updates } : category
        ),
      };
    case 'deleteCategory': {
      const deletedAt = new Date().toISOString();
      return {
        ...state,
        categories: state.categories.map((category) =>
          category.id === action.categoryId
            ? { ...category, deletedAt, isActive: false }
            : category
        ),
      };
    }
    case 'reconcileCustomDefinitions':
      return {
        ...state,
        categories: reconcileCustomRows(state.categories, action.categories),
      };
    case 'hydrateSnapshot':
      return applyMockAppSnapshot(state, action.snapshot);
    case 'hydrateCustomDefinitions':
      return mergePersistedCustomDefinitions(state, action.definitions);
    case 'resetState':
      return createInitialMockAppState();
    default:
      return state;
  }
}

/**
 * @param {MockAppState} state
 * @returns {string[]}
 */
export function selectAvailableMonths(state) {
  const months = new Set(Object.keys(state.statisticsByMonth));

  state.transactions.forEach((transaction) => {
    if (!isDeletedTransaction(transaction)) {
      months.add(getMonthKey(transaction.transactionAt));
    }
  });

  return [...months].sort((left, right) => right.localeCompare(left));
}

/**
 * @param {MockAppState} state
 * @returns {LocalTransactionRecord[]}
 */
export function selectCurrentMonthTransactions(state) {
  return sortTransactionsDescending(
    state.transactions.filter(
      (transaction) =>
        !isDeletedTransaction(transaction) && getMonthKey(transaction.transactionAt) === state.currentMonth
    )
  );
}

/**
 * @param {MockAppState} state
 * @returns {SummaryCardData}
 */
export function selectCurrentMonthSummary(state) {
  return mergeMonthStatistics(state, state.currentMonth).summaryCard;
}

/**
 * @param {MockAppState} state
 * @returns {MonthlyStatistics}
 */
export function selectCurrentMonthStatistics(state) {
  return mergeMonthStatistics(state, state.currentMonth);
}

/**
 * @param {MockAppState} state
 * @returns {SyncSummary}
 */
export function selectSyncSummary(state) {
  const pendingCount = state.transactions.filter(
    (transaction) => !isDeletedTransaction(transaction) && transaction.syncStatus === 'pending'
  ).length;
  const failedCount = state.transactions.filter(
    (transaction) => !isDeletedTransaction(transaction) && transaction.syncStatus === 'failed'
  ).length;

  return {
    status: getSyncStatus(pendingCount, failedCount),
    pendingCount,
    failedCount,
    updatedAt: state.syncUpdatedAt,
  };
}

/**
 * @param {MockAppState} state
 * @returns {CurrentMonthData}
 */
export function selectCurrentMonthData(state) {
  return {
    month: state.currentMonth,
    transactions: selectCurrentMonthTransactions(state),
    summary: selectCurrentMonthSummary(state),
    statistics: selectCurrentMonthStatistics(state),
    availableMonths: selectAvailableMonths(state),
  };
}

/**
 * @param {MockAppState} state
 * @param {EntryType} entryType
 * @returns {LedgerCategory[]}
 */
export function selectCategoriesByType(state, entryType) {
  return state.categories.filter(
    (category) => category.type === entryType && category.deletedAt == null
  );
}

/**
 * @param {MockAppState} state
 * @param {string} transactionId
 * @returns {LocalTransactionRecord | null}
 */
export function selectTransactionById(state, transactionId) {
  return state.transactions.find((transaction) => transaction.id === transactionId) ?? null;
}

/** @returns {MonthlyStatistics[]} */
export function selectSeededMonthlyStatistics() {
  return [];
}

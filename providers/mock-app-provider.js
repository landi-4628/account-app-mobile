import React, { createContext, useContext, useMemo, useReducer } from 'react';

import {
  createInitialMockAppState,
  mockAppReducer,
  selectAccountSummaries,
  selectCategoriesByType,
  selectCurrentMonthData,
  selectSeededMonthlyStatistics,
  selectSyncSummary,
  selectTransactionById,
} from '../state/mock-app-state.js';

/**
 * @typedef {import('../types/accounting').EntryType} EntryType
 * @typedef {import('../types/accounting').LedgerAccount} LedgerAccount
 * @typedef {import('../types/accounting').LedgerCategory} LedgerCategory
 * @typedef {import('../types/accounting').MonthlyStatistics} MonthlyStatistics
 * @typedef {import('../types/accounting').NewTransactionInput} NewTransactionInput
 * @typedef {import('../types/accounting').SyncSummary} SyncSummary
 * @typedef {import('../types/accounting').TransactionRecord} TransactionRecord
 * @typedef {ReturnType<typeof createInitialMockAppState>} MockAppState
 * @typedef {ReturnType<typeof selectCurrentMonthData>} CurrentMonthData
 */

/**
 * @typedef {object} MockAppActions
 * @property {() => void} openQuickAdd
 * @property {() => void} closeQuickAdd
 * @property {(entryType: EntryType) => void} setSelectedEntryType
 * @property {(month: string) => void} setCurrentMonth
 * @property {(input: NewTransactionInput & { id?: string | undefined, syncStatus?: import('../types/accounting').SyncStatus | undefined }) => void} addTransaction
 * @property {(transactionId: string) => void} deleteTransaction
 * @property {(transactionId: string, syncStatus: import('../types/accounting').SyncStatus, updatedAt?: string | undefined) => void} updateTransactionSyncStatus
 */

/**
 * @typedef {object} MockAppSelectors
 * @property {(entryType: EntryType) => LedgerCategory[]} getCategoriesByType
 * @property {(transactionId: string) => TransactionRecord | null} getTransactionById
 */

/**
 * @typedef {object} MockAppContextValue
 * @property {MockAppState} state
 * @property {MockAppState['user']} user
 * @property {string} currentMonth
 * @property {EntryType} selectedEntryType
 * @property {boolean} quickAddOpen
 * @property {LedgerAccount[]} accounts
 * @property {LedgerCategory[]} categories
 * @property {TransactionRecord[]} transactions
 * @property {CurrentMonthData} currentMonthData
 * @property {LedgerAccount[]} accountSummaries
 * @property {SyncSummary} syncSummary
 * @property {string[]} availableMonths
 * @property {MonthlyStatistics[]} seededMonthlyStatistics
 * @property {MockAppActions} actions
 * @property {MockAppSelectors} selectors
 */

const MockAppContext =
  /** @type {React.Context<MockAppContextValue | null>} */ (
    createContext(/** @type {MockAppContextValue | null} */ (null))
  );

/**
 * @param {NewTransactionInput & { id?: string | undefined, syncStatus?: import('../types/accounting').SyncStatus | undefined }} input
 * @returns {TransactionRecord}
 */
function createTransactionRecord(input) {
  return {
    id: input.id ?? `tx-${Date.now()}`,
    type: input.type,
    amount: input.amount,
    categoryId: input.categoryId,
    accountId: input.accountId,
    note: input.note ?? '',
    transactionAt: input.transactionAt,
    syncStatus: input.syncStatus ?? 'pending',
  };
}

/**
 * @param {{ children: import('react').ReactNode }} props
 * @returns {import('react').ReactNode}
 */
export function MockAppProvider({ children }) {
  const [state, dispatch] = useReducer(mockAppReducer, undefined, createInitialMockAppState);

  const currentMonthData = useMemo(() => selectCurrentMonthData(state), [state]);
  const accountSummaries = useMemo(() => selectAccountSummaries(state), [state]);
  const syncSummary = useMemo(() => selectSyncSummary(state), [state]);
  const seededMonthlyStatistics = useMemo(() => selectSeededMonthlyStatistics(), []);

  /** @type {MockAppContextValue} */
  const value = useMemo(
    () => ({
      state,
      user: state.user,
      currentMonth: state.currentMonth,
      selectedEntryType: state.selectedEntryType,
      quickAddOpen: state.quickAddOpen,
      accounts: accountSummaries,
      categories: state.categories,
      transactions: state.transactions,
      currentMonthData,
      accountSummaries,
      syncSummary,
      availableMonths: currentMonthData.availableMonths,
      seededMonthlyStatistics,
      actions: {
        openQuickAdd: () => dispatch({ type: 'openQuickAdd' }),
        closeQuickAdd: () => dispatch({ type: 'closeQuickAdd' }),
        setSelectedEntryType: (entryType) => dispatch({ type: 'setSelectedEntryType', entryType }),
        setCurrentMonth: (month) => dispatch({ type: 'setCurrentMonth', month }),
        addTransaction: (input) =>
          dispatch({
            type: 'addTransaction',
            transaction: createTransactionRecord(input),
          }),
        deleteTransaction: (transactionId) =>
          dispatch({
            type: 'deleteTransaction',
            transactionId,
          }),
        updateTransactionSyncStatus: (transactionId, syncStatus, updatedAt) =>
          dispatch({
            type: 'updateTransactionSyncStatus',
            transactionId,
            syncStatus,
            updatedAt,
          }),
      },
      selectors: {
        getCategoriesByType: (entryType) => selectCategoriesByType(state, entryType),
        getTransactionById: (transactionId) => selectTransactionById(state, transactionId),
      },
    }),
    [accountSummaries, currentMonthData, seededMonthlyStatistics, state, syncSummary]
  );

  return React.createElement(MockAppContext.Provider, { value }, children);
}

/** @returns {MockAppContextValue} */
export function useMockApp() {
  const context = useContext(MockAppContext);

  if (!context) {
    throw new Error('useMockApp must be used within a MockAppProvider');
  }

  return context;
}

/** @returns {CurrentMonthData} */
export function useCurrentMonthData() {
  return useMockApp().currentMonthData;
}

/** @returns {LedgerAccount[]} */
export function useAccountSummaries() {
  return useMockApp().accountSummaries;
}

/** @returns {SyncSummary} */
export function useSyncSummary() {
  return useMockApp().syncSummary;
}

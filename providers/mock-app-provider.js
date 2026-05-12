// @ts-nocheck
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

const MockAppContext = createContext(null);

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
 */
export function MockAppProvider({ children }) {
  const [state, dispatch] = useReducer(mockAppReducer, undefined, createInitialMockAppState);

  const currentMonthData = useMemo(() => selectCurrentMonthData(state), [state]);
  const accountSummaries = useMemo(() => selectAccountSummaries(state), [state]);
  const syncSummary = useMemo(() => selectSyncSummary(state), [state]);
  const seededMonthlyStatistics = useMemo(() => selectSeededMonthlyStatistics(), []);

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

export function useMockApp() {
  const context = useContext(MockAppContext);

  if (!context) {
    throw new Error('useMockApp must be used within a MockAppProvider');
  }

  return context;
}

export function useCurrentMonthData() {
  return useMockApp().currentMonthData;
}

export function useAccountSummaries() {
  return useMockApp().accountSummaries;
}

export function useSyncSummary() {
  return useMockApp().syncSummary;
}

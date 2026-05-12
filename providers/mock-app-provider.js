import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';

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
import {
  MOCK_APP_CUSTOM_DEFINITIONS_STORAGE_KEY,
  selectPersistedCustomDefinitions,
} from '../state/mock-app-persistence-support.js';
import {
  createMockAppStorageAdapter,
} from '../state/mock-app-storage.js';

/**
 * @typedef {import('../types/accounting').EntryType} EntryType
 * @typedef {import('../types/accounting').LedgerAccount} LedgerAccount
 * @typedef {import('../types/accounting').LedgerCategory} LedgerCategory
 * @typedef {import('../types/accounting').MonthlyStatistics} MonthlyStatistics
 * @typedef {import('../types/accounting').EditTransactionInput} EditTransactionInput
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
 * @property {(transactionId: string, updates: EditTransactionInput) => void} updateTransaction
 * @property {(transactionId: string) => void} deleteTransaction
 * @property {(transactionId: string, syncStatus: import('../types/accounting').SyncStatus, updatedAt?: string | undefined) => void} updateTransactionSyncStatus
 * @property {(input: { name: string, type: EntryType }) => LedgerCategory} addCategory
 * @property {(input: { name: string, type: import('../types/accounting').AccountType }) => LedgerAccount} addAccount
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
const persistedDefinitionStorage = createMockAppStorageAdapter(AsyncStorage);

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
  const [hydrated, setHydrated] = useState(false);

  const currentMonthData = useMemo(() => selectCurrentMonthData(state), [state]);
  const accountSummaries = useMemo(() => selectAccountSummaries(state), [state]);
  const syncSummary = useMemo(() => selectSyncSummary(state), [state]);
  const seededMonthlyStatistics = useMemo(() => selectSeededMonthlyStatistics(), []);
  const persistedDefinitions = useMemo(() => selectPersistedCustomDefinitions(state), [state]);

  useEffect(() => {
    let active = true;

    async function hydrateCustomDefinitions() {
      try {
        const definitions = await persistedDefinitionStorage.readCustomDefinitions(
          MOCK_APP_CUSTOM_DEFINITIONS_STORAGE_KEY
        );

        if (active) {
          dispatch({
            type: 'hydrateCustomDefinitions',
            definitions,
          });
        }
      } finally {
        if (active) {
          setHydrated(true);
        }
      }
    }

    void hydrateCustomDefinitions();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    void persistedDefinitionStorage.writeCustomDefinitions(
      MOCK_APP_CUSTOM_DEFINITIONS_STORAGE_KEY,
      persistedDefinitions
    );
  }, [hydrated, persistedDefinitions]);

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
        updateTransaction: (transactionId, updates) =>
          dispatch({
            type: 'updateTransaction',
            transactionId,
            updates,
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
        addCategory: ({ name, type }) => {
          const category = createCustomCategoryRecord(name, type);

          dispatch({
            type: 'addCategory',
            category,
          });

          return category;
        },
        addAccount: ({ name, type }) => {
          const account = createCustomAccountRecord(name, type);

          dispatch({
            type: 'addAccount',
            account,
          });

          return account;
        },
      },
      selectors: {
        getCategoriesByType: (entryType) => selectCategoriesByType(state, entryType),
        getTransactionById: (transactionId) => selectTransactionById(state, transactionId),
      },
    }),
    [accountSummaries, currentMonthData, seededMonthlyStatistics, state, syncSummary]
  );

  if (!hydrated) {
    return null;
  }

  return React.createElement(MockAppContext.Provider, { value }, children);
}

/**
 * @param {string} name
 * @param {EntryType} type
 * @returns {LedgerCategory}
 */
function createCustomCategoryRecord(name, type) {
  return {
    id: `cat-custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    type,
    isActive: true,
    isCustom: true,
  };
}

/**
 * @param {string} name
 * @param {import('../types/accounting').AccountType} type
 * @returns {LedgerAccount}
 */
function createCustomAccountRecord(name, type) {
  return {
    id: `acc-custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    type,
    initialBalance: 0,
    currentBalance: 0,
    isActive: true,
    isCustom: true,
  };
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

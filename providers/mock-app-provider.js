import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';

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
import { mockAppRuntimeStorageAdapter } from '../state/mock-app-runtime-storage.js';
import { selectMockAppSnapshot } from '../state/mock-app-snapshot.js';
import { getSyncableTransactions, shouldAutoSync } from './mock-app-sync-support.js';

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
 * @property {(enabled: boolean) => void} setAutoSyncEnabled
 * @property {() => Promise<void>} syncPendingTransactions
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
 * @property {boolean} autoSyncEnabled
 * @property {boolean} syncInFlight
 * @property {string[]} availableMonths
 * @property {MonthlyStatistics[]} seededMonthlyStatistics
 * @property {MockAppActions} actions
 * @property {MockAppSelectors} selectors
 */

const MockAppContext =
  /** @type {React.Context<MockAppContextValue | null>} */ (
    createContext(/** @type {MockAppContextValue | null} */ (null))
  );
const MOCK_APP_SYNC_PREFERENCES_STORAGE_KEY = 'mock-app-sync-preferences';
const MOCK_APP_STATE_SNAPSHOT_STORAGE_KEY = 'mock-app-state-snapshot';

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
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [syncInFlight, setSyncInFlight] = useState(false);

  const currentMonthData = useMemo(() => selectCurrentMonthData(state), [state]);
  const accountSummaries = useMemo(() => selectAccountSummaries(state), [state]);
  const syncSummary = useMemo(() => selectSyncSummary(state), [state]);
  const seededMonthlyStatistics = useMemo(() => selectSeededMonthlyStatistics(), []);
  const persistedDefinitions = useMemo(() => selectPersistedCustomDefinitions(state), [state]);
  const syncableTransactions = useMemo(() => getSyncableTransactions(state.transactions), [state.transactions]);

  useEffect(() => {
    let active = true;

    async function hydrateRuntimeState() {
      try {
        const [snapshot, definitions, syncPreferences] = await Promise.all([
          mockAppRuntimeStorageAdapter.readAppSnapshot(MOCK_APP_STATE_SNAPSHOT_STORAGE_KEY),
          mockAppRuntimeStorageAdapter.readCustomDefinitions(
            MOCK_APP_CUSTOM_DEFINITIONS_STORAGE_KEY
          ),
          mockAppRuntimeStorageAdapter.readSyncPreferences(MOCK_APP_SYNC_PREFERENCES_STORAGE_KEY),
        ]);

        if (active) {
          if (snapshot) {
            dispatch({
              type: 'hydrateSnapshot',
              snapshot,
            });
          } else {
            dispatch({
              type: 'hydrateCustomDefinitions',
              definitions,
            });
          }
          setAutoSyncEnabled(syncPreferences.autoSyncEnabled);
        }
      } finally {
        if (active) {
          setHydrated(true);
        }
      }
    }

    void hydrateRuntimeState();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    void mockAppRuntimeStorageAdapter.writeAppSnapshot(
      MOCK_APP_STATE_SNAPSHOT_STORAGE_KEY,
      selectMockAppSnapshot(state)
    );
  }, [hydrated, state]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    void mockAppRuntimeStorageAdapter.writeCustomDefinitions(
      MOCK_APP_CUSTOM_DEFINITIONS_STORAGE_KEY,
      persistedDefinitions
    );
  }, [hydrated, persistedDefinitions]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    void mockAppRuntimeStorageAdapter.writeSyncPreferences(
      MOCK_APP_SYNC_PREFERENCES_STORAGE_KEY,
      { autoSyncEnabled }
    );
  }, [autoSyncEnabled, hydrated]);

  const syncPendingTransactions = useCallback(async () => {
    if (syncInFlight) {
      return;
    }

    const syncableIds = getSyncableTransactions(state.transactions).map((transaction) => transaction.id);
    if (syncableIds.length === 0) {
      return;
    }

    setSyncInFlight(true);

    try {
      const updatedAt = new Date().toISOString();

      syncableIds.forEach((transactionId, index) => {
        dispatch({
          type: 'updateTransactionSyncStatus',
          transactionId,
          syncStatus: 'synced',
          updatedAt: index === syncableIds.length - 1 ? updatedAt : undefined,
        });
      });
    } finally {
      setSyncInFlight(false);
    }
  }, [state.transactions, syncInFlight]);

  useEffect(() => {
    if (
      !hydrated ||
      !shouldAutoSync({
        autoSyncEnabled,
        syncInFlight,
        syncableCount: syncableTransactions.length,
      })
    ) {
      return;
    }

    void syncPendingTransactions();
  }, [autoSyncEnabled, hydrated, syncInFlight, syncPendingTransactions, syncableTransactions.length]);

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
      autoSyncEnabled,
      syncInFlight,
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
        setAutoSyncEnabled: (enabled) => setAutoSyncEnabled(enabled),
        syncPendingTransactions,
      },
      selectors: {
        getCategoriesByType: (entryType) => selectCategoriesByType(state, entryType),
        getTransactionById: (transactionId) => selectTransactionById(state, transactionId),
      },
    }),
    [
      accountSummaries,
      autoSyncEnabled,
      currentMonthData,
      seededMonthlyStatistics,
      state,
      syncInFlight,
      syncPendingTransactions,
      syncSummary,
    ]
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

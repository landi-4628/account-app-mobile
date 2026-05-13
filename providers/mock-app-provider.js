import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { createApiClient } from '../lib/api-client.js';
import { createAuthApi } from '../lib/auth-api.js';
import {
  buildDefinitionsPushPayload,
  buildRemoteReferenceMaps,
  buildSnapshotFromRemotePayload,
  buildTransactionsPushPayload,
  createLedgerSyncApi,
  hasRemoteLedgerData,
} from '../lib/ledger-sync.js';

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
import {
  selectCompactedMockAppSnapshot,
  selectMockAppSnapshot,
} from '../state/mock-app-snapshot.js';
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
 * @typedef {import('../data/repositories/auth-repository.js').AuthSession} AuthSession
 * @typedef {import('../state/mock-app-state.js').MockAppAction} MockAppAction
 * @typedef {ReturnType<typeof createInitialMockAppState>} MockAppState
 * @typedef {ReturnType<typeof selectCurrentMonthData>} CurrentMonthData
 * @typedef {import('../lib/auth-api.js').RemoteAuthUser} RemoteAuthUser
 * @typedef {LedgerAccount & { remoteId?: number | undefined, updatedAt?: string | undefined, deletedAt?: string | null }} LocalLedgerAccount
 * @typedef {LedgerCategory & { remoteId?: number | undefined, updatedAt?: string | undefined, deletedAt?: string | null, color?: string | undefined }} LocalLedgerCategory
 * @typedef {TransactionRecord & { remoteId?: number | undefined, updatedAt?: string | undefined, deletedAt?: string | null, syncError?: string | null, syncedAt?: string | null }} LocalTransactionRecord
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
 * @property {(input: { email: string, password: string }) => Promise<unknown>} login
 * @property {(input: { name: string, email: string, password: string }) => Promise<unknown>} register
 * @property {(input: { name: string, email: string, ledgerName: string, timezone: string, defaultAccountId: string }) => Promise<unknown>} updateProfile
 * @property {(input: { currentPassword: string, nextPassword: string, confirmPassword: string }) => Promise<void>} changePassword
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
const MOCK_APP_AUTH_SESSION_STORAGE_KEY = 'mock-app-auth-session';
const REMOTE_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:3000';

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
  const [authSession, setAuthSession] = useState(
    /** @type {AuthSession | null} */ (null)
  );
  const [remoteUser, setRemoteUser] = useState(
    /** @type {(RemoteAuthUser & {
     *   ledgerName?: string | undefined,
     *   timezone?: string | undefined,
     *   defaultAccountId?: string | undefined,
     * }) | null} */ (null)
  );

  const authApi = useMemo(
    () =>
      createAuthApi({
        apiClient: createApiClient({
          baseUrl: REMOTE_API_BASE_URL,
        }),
      }),
    []
  );
  const ledgerSyncApi = useMemo(
    () =>
      createLedgerSyncApi({
        apiClient: createApiClient({
          baseUrl: REMOTE_API_BASE_URL,
        }),
      }),
    []
  );

  const currentMonthData = useMemo(() => selectCurrentMonthData(state), [state]);
  const accountSummaries = useMemo(() => selectAccountSummaries(state), [state]);
  const syncSummary = useMemo(() => selectSyncSummary(state), [state]);
  const seededMonthlyStatistics = useMemo(() => selectSeededMonthlyStatistics(), []);
  const persistedDefinitions = useMemo(() => selectPersistedCustomDefinitions(state), [state]);
  const syncableTransactions = useMemo(() => getSyncableTransactions(state.transactions), [state.transactions]);
  const remoteAccessToken = authSession?.accessToken ?? null;
  const remoteLedgerId = remoteUser?.currentLedgerId ?? null;
  const canSyncRemotely = Boolean(remoteAccessToken && remoteLedgerId != null);
  const reduceState = useCallback(
    /**
     * @param {MockAppState} currentState
     * @param {MockAppAction} action
     */
    (currentState, action) => mockAppReducer(currentState, action),
    []
  );

  const hydrateRemoteLedgerState = useCallback(
    /**
     * @param {string} accessToken
     * @param {MockAppState} snapshotBaseState
     * @param {{ compactLocalDeletionsOnEmptyPull?: boolean | undefined }} [options]
     */
    async (accessToken, snapshotBaseState, options = {}) => {
      const payload = await ledgerSyncApi.pull(accessToken);
      if (!hasRemoteLedgerData(payload)) {
        if (options.compactLocalDeletionsOnEmptyPull) {
          dispatch({
            type: 'hydrateSnapshot',
            snapshot: selectCompactedMockAppSnapshot(snapshotBaseState),
          });
          return true;
        }

        return false;
      }

      dispatch({
        type: 'hydrateSnapshot',
        snapshot: buildSnapshotFromRemotePayload(payload, {
          currentMonth: snapshotBaseState.currentMonth,
          selectedEntryType: snapshotBaseState.selectedEntryType,
          fallbackSyncUpdatedAt: snapshotBaseState.syncUpdatedAt,
        }),
      });

      return true;
    },
    [ledgerSyncApi]
  );

  const syncRemoteState = useCallback(
    /**
     * @param {MockAppState} nextState
     */
    async (nextState) => {
      if (!remoteAccessToken || remoteLedgerId == null) {
        return false;
      }

      const definitionPayload = buildDefinitionsPushPayload(nextState.accounts, nextState.categories);
      const definitionResponse = await ledgerSyncApi.pushDefinitions(remoteAccessToken, definitionPayload);
      const references = buildRemoteReferenceMaps(definitionResponse);
      const transactionsToSync = getSyncableTransactions(nextState.transactions);

      if (transactionsToSync.length > 0) {
        const transactionPayload = buildTransactionsPushPayload(transactionsToSync, references);
        await ledgerSyncApi.pushTransactions(remoteAccessToken, transactionPayload);
      }

      await hydrateRemoteLedgerState(remoteAccessToken, nextState, {
        compactLocalDeletionsOnEmptyPull: true,
      });
      return true;
    },
    [hydrateRemoteLedgerState, ledgerSyncApi, remoteAccessToken, remoteLedgerId]
  );

  useEffect(() => {
    let active = true;

    async function hydrateRuntimeState() {
      try {
        const [snapshot, definitions, syncPreferences, savedSession] = await Promise.all([
          mockAppRuntimeStorageAdapter.readAppSnapshot(MOCK_APP_STATE_SNAPSHOT_STORAGE_KEY),
          mockAppRuntimeStorageAdapter.readCustomDefinitions(
            MOCK_APP_CUSTOM_DEFINITIONS_STORAGE_KEY
          ),
          mockAppRuntimeStorageAdapter.readSyncPreferences(MOCK_APP_SYNC_PREFERENCES_STORAGE_KEY),
          mockAppRuntimeStorageAdapter.readAuthSession(MOCK_APP_AUTH_SESSION_STORAGE_KEY),
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
          setAuthSession(savedSession ?? null);
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
    const accessToken = authSession?.accessToken;
    if (!hydrated || !accessToken) {
      return;
    }

    let active = true;
    const currentAccessToken = accessToken;

    async function hydrateRemoteUser() {
      try {
        const user = await authApi.getCurrentUser(currentAccessToken);
        if (active) {
          setRemoteUser(user);
        }
      } catch {
        if (active) {
          setAuthSession(null);
          setRemoteUser(null);
          void mockAppRuntimeStorageAdapter.clearAuthSession(MOCK_APP_AUTH_SESSION_STORAGE_KEY);
        }
      }
    }

    void hydrateRemoteUser();

    return () => {
      active = false;
    };
  }, [authApi, authSession?.accessToken, hydrated]);

  useEffect(() => {
    if (!hydrated || !remoteAccessToken || remoteLedgerId == null) {
      return;
    }

    let active = true;
    const currentAccessToken = remoteAccessToken;

    async function hydrateRemoteLedger() {
      try {
        await hydrateRemoteLedgerState(currentAccessToken, state);
      } catch {
        if (!active) {
          return;
        }
      }
    }

    void hydrateRemoteLedger();

    return () => {
      active = false;
    };
  }, [hydrated, hydrateRemoteLedgerState, remoteAccessToken, remoteLedgerId]);

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

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!authSession) {
      void mockAppRuntimeStorageAdapter.clearAuthSession(MOCK_APP_AUTH_SESSION_STORAGE_KEY);
      return;
    }

    void mockAppRuntimeStorageAdapter.writeAuthSession(
      MOCK_APP_AUTH_SESSION_STORAGE_KEY,
      authSession
    );
  }, [authSession, hydrated]);

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
      if (canSyncRemotely) {
        await syncRemoteState(state);
        return;
      }

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
  }, [canSyncRemotely, state, state.transactions, syncInFlight, syncRemoteState]);

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

  const effectiveUser = useMemo(
    () => mergeAccountingUser(state.user, remoteUser ?? undefined),
    [remoteUser, state.user]
  );

  /** @type {MockAppContextValue} */
  const value = useMemo(
    () => ({
      state,
      user: effectiveUser,
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
        addTransaction: (input) => {
          /** @type {MockAppAction} */
          const action = {
            type: 'addTransaction',
            transaction: createTransactionRecord(input),
          };
          const nextState = reduceState(state, action);
          dispatch(action);
          if (canSyncRemotely) {
            void syncRemoteState(nextState);
          }
        },
        updateTransaction: (transactionId, updates) => {
          /** @type {MockAppAction} */
          const action = {
            type: 'updateTransaction',
            transactionId,
            updates: {
              ...updates,
              syncStatus: 'pending',
            },
          };
          const nextState = reduceState(state, action);
          dispatch(action);
          if (canSyncRemotely) {
            void syncRemoteState(nextState);
          }
        },
        deleteTransaction: (transactionId) => {
          /** @type {MockAppAction} */
          const action = {
            type: 'deleteTransaction',
            transactionId,
          };
          const nextState = reduceState(state, action);
          dispatch(action);
          if (canSyncRemotely) {
            void syncRemoteState(nextState);
          }
        },
        updateTransactionSyncStatus: (transactionId, syncStatus, updatedAt) =>
          dispatch({
            type: 'updateTransactionSyncStatus',
            transactionId,
            syncStatus,
            updatedAt,
          }),
        addCategory: ({ name, type }) => {
          const category = createCustomCategoryRecord(name, type);
          /** @type {MockAppAction} */
          const action = {
            type: 'addCategory',
            category,
          };
          const nextState = reduceState(state, action);

          dispatch(action);
          if (canSyncRemotely) {
            void syncRemoteState(nextState);
          }

          return category;
        },
        addAccount: ({ name, type }) => {
          const account = createCustomAccountRecord(name, type);
          /** @type {MockAppAction} */
          const action = {
            type: 'addAccount',
            account,
          };
          const nextState = reduceState(state, action);

          dispatch(action);
          if (canSyncRemotely) {
            void syncRemoteState(nextState);
          }

          return account;
        },
        setAutoSyncEnabled: (enabled) => setAutoSyncEnabled(enabled),
        syncPendingTransactions,
        login: async ({ email, password }) => {
          const result = await authApi.login({ email, password });
          setAuthSession(result.session);
          setRemoteUser(result.user);
          return result.user;
        },
        register: async ({ name, email, password }) => {
          const result = await authApi.register({ name, email, password });
          setAuthSession(result.session);
          setRemoteUser(result.user);
          return result.user;
        },
        updateProfile: async (draft) => {
          if (!authSession?.accessToken) {
            throw new Error('You need to sign in before updating the profile');
          }

          const user = await authApi.updateProfile(authSession.accessToken, draft);
          setRemoteUser({
            ...user,
            ledgerName: draft.ledgerName,
            timezone: draft.timezone,
            defaultAccountId: draft.defaultAccountId,
          });
          return user;
        },
        changePassword: async (draft) => {
          if (!authSession?.accessToken) {
            throw new Error('You need to sign in before changing the password');
          }

          await authApi.changePassword(authSession.accessToken, draft);
        },
      },
      selectors: {
        getCategoriesByType: (entryType) => selectCategoriesByType(state, entryType),
        getTransactionById: (transactionId) => selectTransactionById(state, transactionId),
      },
    }),
    [
      accountSummaries,
      authApi,
      autoSyncEnabled,
      canSyncRemotely,
      currentMonthData,
      effectiveUser,
      hydrateRemoteLedgerState,
      ledgerSyncApi,
      reduceState,
      remoteAccessToken,
      seededMonthlyStatistics,
      state,
      syncInFlight,
      syncRemoteState,
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
 * @param {import('../types/accounting.js').AccountingUser} baseUser
 * @param {{
 *   id?: string | number | undefined,
 *   name?: string | undefined,
 *   email?: string | undefined,
 *   ledgerName?: string | undefined,
 *   timezone?: string | undefined,
 *   defaultAccountId?: string | undefined,
 * }} [remoteUser]
 */
function mergeAccountingUser(baseUser, remoteUser) {
  if (!remoteUser) {
    return baseUser;
  }

  return {
    ...baseUser,
    id: remoteUser.id == null ? baseUser.id : String(remoteUser.id),
    name: typeof remoteUser.name === 'string' ? remoteUser.name : baseUser.name,
    email: typeof remoteUser.email === 'string' ? remoteUser.email : baseUser.email,
    ledgerName: typeof remoteUser.ledgerName === 'string' ? remoteUser.ledgerName : baseUser.ledgerName,
    timezone: typeof remoteUser.timezone === 'string' ? remoteUser.timezone : baseUser.timezone,
    defaultAccountId:
      typeof remoteUser.defaultAccountId === 'string'
        ? remoteUser.defaultAccountId
        : baseUser.defaultAccountId,
  };
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

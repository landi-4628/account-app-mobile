import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, Modal, Text, View } from 'react-native';
import { createApiClient } from '../lib/api-client.js';
import { createAuthApi } from '../lib/auth-api.js';
import { createLedgerApi } from '../lib/ledger-api.js';
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
import { useSQLiteContext } from 'expo-sqlite';
import { createCategoryRepository } from '../data/repositories/category-repository.js';
import { createTransactionRepository } from '../data/repositories/transaction-repository.js';
import { createLedgerDefinitionsApi } from '../lib/ledger-definitions-api.js';
import { getCustomCategoryAppearance } from '../constants/accounting-categories.js';
import {
  ledgerCategoryToInsert,
  repoCategoryRowToLedger,
} from './local-definition-mappers.js';
import { useAccountingTheme } from '../components/accounting/use-accounting-theme';
import {
  getManualSyncPlan,
  getSyncableTransactions,
  shouldAutoSync,
} from './mock-app-sync-support.js';

/**
 * 数据策略：业务读写以本地快照与 SQLite 为准（秒开、离线可用）；有网且开启自动同步时
 * 异步推送待同步流水；登录/恢复会话后从云端拉取并合并到本地。换账号时先清空再拉取。
 */

/**
 * @typedef {import('../types/accounting').EntryType} EntryType
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
 * @typedef {import('../lib/ledger-api.js').RemoteLedger} RemoteLedger
 * @typedef {LedgerCategory & { remoteId?: string | undefined, updatedAt?: string | undefined, deletedAt?: string | null, color?: string | undefined }} LocalLedgerCategory
 * @typedef {TransactionRecord & { remoteId?: string | undefined, updatedAt?: string | undefined, deletedAt?: string | null, syncError?: string | null, syncedAt?: string | null }} LocalTransactionRecord
 */

/**
 * @typedef {object} MockAppActions
 * @property {() => void} openQuickAdd
 * @property {() => void} closeQuickAdd
 * @property {(entryType: EntryType) => void} setSelectedEntryType
 * @property {(month: string) => void} setCurrentMonth
 * @property {(input: NewTransactionInput & { id?: string | undefined, syncStatus?: import('../types/accounting').SyncStatus | undefined }) => Promise<void>} addTransaction
 * @property {(transactionId: string, updates: EditTransactionInput) => void} updateTransaction
 * @property {(transactionId: string) => void} deleteTransaction
 * @property {(transactionId: string, syncStatus: import('../types/accounting').SyncStatus, updatedAt?: string | undefined) => void} updateTransactionSyncStatus
 * @property {(input: { name: string, type: EntryType }) => Promise<LedgerCategory>} addCategory
 * @property {(categoryId: string, isActive: boolean) => Promise<void>} toggleCategoryActive
 * @property {(categoryId: string, updates: Partial<LedgerCategory>) => Promise<void>} updateCategory
 * @property {(categoryId: string) => Promise<void>} deleteCategory
 * @property {(enabled: boolean) => void} setAutoSyncEnabled
 * @property {() => Promise<void>} syncPendingTransactions
 * @property {() => Promise<{ currentLedgerId: string | null, ledgers: RemoteLedger[] }>} loadMyLedgers
 * @property {(input: { name: string, baseCurrency?: string | null | undefined }) => Promise<RemoteLedger>} createLedger
 * @property {(ledgerId: string) => Promise<{ currentLedgerId: string | null }>} switchLedger
 * @property {(input: { email: string, password: string }) => Promise<unknown>} login
 * @property {(input: { name: string, email: string, password: string }) => Promise<unknown>} register
 * @property {() => Promise<void>} logout
 * @property {(input: { name: string, email: string, ledgerName: string, timezone: string }) => Promise<unknown>} updateProfile
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
 * @property {string} implicitLedgerAccountId
 * @property {LedgerCategory[]} categories
 * @property {TransactionRecord[]} transactions
 * @property {CurrentMonthData} currentMonthData
 * @property {SyncSummary} syncSummary
 * @property {boolean} autoSyncEnabled
 * @property {RemoteLedger | null} currentLedger
 * @property {RemoteLedger[]} myLedgers
 * @property {boolean} isAuthenticated
 * @property {boolean} canSyncRemotely
 * @property {boolean} syncInFlight
 * @property {boolean} ledgerBootstrapLoading
 * @property {{ visible: boolean, label: string }} remoteActivity
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
const REMOTE_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://192.168.5.119:3000';
const AUTH_REQUIRED_MESSAGE = '请先登录';
const REMOTE_ACTIVITY_COPY = {
  'hydrate-user': '正在同步账户信息…',
  'load-ledgers': '正在加载账本…',
  'hydrate-ledger': '正在从云端同步账本数据…',
  'manual-sync': '正在同步账本数据…',
  'auto-sync': '正在自动同步…',
  'transaction-sync': '正在同步记录…',
  'create-ledger': '正在创建账本…',
  'switch-ledger': '正在切换账本…',
  'create-category': '正在同步分类…',
  'toggle-category': '正在同步分类…',
  'update-category': '正在同步分类…',
  'delete-category': '正在同步分类…',
};
const LEDGER_BOOTSTRAP_ACTIVITY_KEYS = new Set(['hydrate-user', 'hydrate-ledger']);

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
  const [remoteActivity, setRemoteActivity] = useState(
    /** @type {Array<{ key: string, label: string }>} */ ([])
  );
  const [authSession, setAuthSession] = useState(
    /** @type {AuthSession | null} */ (null)
  );
  const [remoteUser, setRemoteUser] = useState(
    /** @type {(RemoteAuthUser & {
     *   ledgerName?: string | undefined,
     *   timezone?: string | undefined,
     * }) | null} */ (null)
  );
  const stateRef = useRef(state);
  const lastAuthenticatedUserIdRef = useRef(/** @type {string | null} */ (null));
  const skipNextRemoteLedgerPullRef = useRef(false);
  const hydratedRemoteLedgerKeyRef = useRef(/** @type {string | null} */ (null));
  const [myLedgers, setMyLedgers] = useState(/** @type {RemoteLedger[]} */ ([]));
  const [currentLedgerId, setCurrentLedgerId] = useState(/** @type {string | null} */ (null));

  const authApi = useMemo(
    () =>
      createAuthApi({
        apiClient: createApiClient({
          baseUrl: REMOTE_API_BASE_URL,
        }),
      }),
    []
  );
  const ledgerApi = useMemo(
    () =>
      createLedgerApi({
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

  const sqlite = useSQLiteContext();
  const categoryRepo = useMemo(() => createCategoryRepository(/** @type {any} */ (sqlite)), [sqlite]);
  const transactionRepo = useMemo(
    () => createTransactionRepository(/** @type {any} */ (sqlite)),
    [sqlite]
  );
  const definitionsApi = useMemo(
    () =>
      createLedgerDefinitionsApi({
        apiClient: createApiClient({
          baseUrl: REMOTE_API_BASE_URL,
        }),
      }),
    []
  );

  const currentMonthData = useMemo(() => selectCurrentMonthData(state), [state]);
  const syncSummary = useMemo(() => selectSyncSummary(state), [state]);
  const seededMonthlyStatistics = useMemo(() => selectSeededMonthlyStatistics(), []);
  const persistedDefinitions = useMemo(() => selectPersistedCustomDefinitions(state), [state]);
  const syncableTransactions = useMemo(() => getSyncableTransactions(state.transactions), [state.transactions]);
  const remoteAccessToken = authSession?.accessToken ?? null;
  const remoteLedgerId = resolveRemoteLedgerId(remoteUser);
  const currentLedger = useMemo(
    () => myLedgers.find((ledger) => ledger.id === currentLedgerId) ?? myLedgers[0] ?? null,
    [currentLedgerId, myLedgers]
  );
  const canSyncRemotely = Boolean(remoteAccessToken && remoteLedgerId != null);
  const isAuthenticated = Boolean(authSession?.accessToken);
  const ownerUserId = authSession?.userId ?? '';

  const ensureAuthenticated = useCallback(() => {
    if (!authSession?.accessToken) {
      throw new Error(AUTH_REQUIRED_MESSAGE);
    }

    return authSession.accessToken;
  }, [authSession?.accessToken]);

  const runRemoteActivity = useCallback(async (key, work) => {
    const activity = {
      key,
      label: REMOTE_ACTIVITY_COPY[key] ?? REMOTE_ACTIVITY_COPY['manual-sync'],
    };

    setRemoteActivity((current) => [...current, activity]);

    try {
      return await work();
    } finally {
      setRemoteActivity((current) => {
        const index = current.findIndex((item) => item.key === key);

        if (index === -1) {
          return current;
        }

        const next = [...current];
        next.splice(index, 1);
        return next;
      });
    }
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const persistCustomCategory = useCallback(
    async (/** @type {LedgerCategory} */ category) => {
      if (!ownerUserId || !category.isCustom) {
        return;
      }

      await categoryRepo.saveCategory(ledgerCategoryToInsert(category, ownerUserId));
    },
    [categoryRepo, ownerUserId]
  );

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

        dispatch({
          type: 'hydrateSnapshot',
          snapshot: buildSnapshotFromRemotePayload(payload, {
            currentMonth: snapshotBaseState.currentMonth,
            selectedEntryType: snapshotBaseState.selectedEntryType,
            fallbackSyncUpdatedAt: snapshotBaseState.syncUpdatedAt,
            baselineImplicitLedgerAccountId:
              snapshotBaseState.implicitLedgerAccountId || snapshotBaseState.user.defaultAccountId,
          }),
        });
        return true;
      }

      dispatch({
        type: 'hydrateSnapshot',
        snapshot: buildSnapshotFromRemotePayload(payload, {
          currentMonth: snapshotBaseState.currentMonth,
          selectedEntryType: snapshotBaseState.selectedEntryType,
          fallbackSyncUpdatedAt: snapshotBaseState.syncUpdatedAt,
          baselineImplicitLedgerAccountId:
            snapshotBaseState.implicitLedgerAccountId || snapshotBaseState.user.defaultAccountId,
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

      const definitionPayload = buildDefinitionsPushPayload(nextState.categories);
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

  const triggerRemoteSync = useCallback(
    async (nextState, activityKey) => {
      if (!canSyncRemotely) {
        return false;
      }

      return runRemoteActivity(activityKey, async () => syncRemoteState(nextState));
    },
    [canSyncRemotely, runRemoteActivity, syncRemoteState]
  );

  const completeSessionFromAuthResponse = useCallback(
    /**
     * @param {{ session: AuthSession, user: RemoteAuthUser & { currentLedgerId?: string | null | undefined } }} result
     */
    async (result) => {
      const previousUserId = lastAuthenticatedUserIdRef.current;
      let baseline = state;

      if (previousUserId != null && previousUserId !== result.session.userId) {
        const snapshot = buildSnapshotFromRemotePayload({ data: {} }, {
          currentMonth: state.currentMonth,
          selectedEntryType: state.selectedEntryType,
          fallbackSyncUpdatedAt: state.syncUpdatedAt,
          baselineImplicitLedgerAccountId:
            state.implicitLedgerAccountId || state.user.defaultAccountId,
        });
        /** @type {import('../state/mock-app-state.js').MockAppAction} */
        const action = {
          type: 'hydrateSnapshot',
          snapshot,
        };
        baseline = reduceState(state, action);
        dispatch(action);
      }

      skipNextRemoteLedgerPullRef.current = true;
      lastAuthenticatedUserIdRef.current = result.session.userId;
      setAuthSession(result.session);
      setRemoteUser(result.user);

      try {
        const token = result.session.accessToken;
        const ledgerId = resolveRemoteLedgerId(result.user);
        if (token != null && ledgerId != null) {
          hydratedRemoteLedgerKeyRef.current = `${result.session.userId}:${ledgerId}`;
          await runRemoteActivity('hydrate-ledger', async () =>
            hydrateRemoteLedgerState(token, baseline)
          );
        }
      } finally {
        skipNextRemoteLedgerPullRef.current = false;
      }

      return result.user;
    },
    [dispatch, hydrateRemoteLedgerState, reduceState, runRemoteActivity, state]
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
          if (savedSession) {
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
        const user = await runRemoteActivity('hydrate-user', async () =>
          authApi.getCurrentUser(currentAccessToken)
        );
        if (active) {
          setRemoteUser(user);
        }
      } catch {
        if (active) {
          setAuthSession(null);
          setRemoteUser(null);
          dispatch({ type: 'resetState' });
          setMyLedgers([]);
          setCurrentLedgerId(null);
          void mockAppRuntimeStorageAdapter.clearAuthSession(MOCK_APP_AUTH_SESSION_STORAGE_KEY);
        }
      }
    }

    void hydrateRemoteUser();

    return () => {
      active = false;
    };
  }, [authApi, authSession?.accessToken, hydrated, runRemoteActivity]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    let active = true;

    async function hydrateLedgers() {
      if (!remoteAccessToken) {
        if (active) {
          setMyLedgers([]);
          setCurrentLedgerId(null);
        }
        return;
      }

      try {
        const result = await runRemoteActivity('load-ledgers', async () =>
          ledgerApi.listMyLedgers(remoteAccessToken)
        );
        const nextCurrentLedgerId = result.currentLedgerId ?? result.ledgers[0]?.id ?? null;

        if (!active) {
          return;
        }

        setMyLedgers(result.ledgers);
        setCurrentLedgerId(nextCurrentLedgerId);
        setRemoteUser((current) =>
          applySelectedLedgerToRemoteUser(current, result.ledgers, nextCurrentLedgerId)
        );
      } catch {
        if (!active) {
          return;
        }

        setMyLedgers([]);
        setCurrentLedgerId(null);
      }
    }

    void hydrateLedgers();

    return () => {
      active = false;
    };
  }, [hydrated, ledgerApi, remoteAccessToken, runRemoteActivity]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    lastAuthenticatedUserIdRef.current = authSession?.userId ?? null;
  }, [authSession?.userId, hydrated]);

  useEffect(() => {
    if (!hydrated || !ownerUserId) {
      return;
    }

    let active = true;

    async function pullLocalDefinitions() {
      try {
        const categoryRows = await categoryRepo.listCategories(ownerUserId);

        if (!active) {
          return;
        }

        dispatch({
          type: 'reconcileCustomDefinitions',
          categories: categoryRows.map(repoCategoryRowToLedger),
        });
      } catch {
        // SQLite may be unavailable during rapid teardown; ignore.
      }
    }

    void pullLocalDefinitions();

    return () => {
      active = false;
    };
  }, [hydrated, ownerUserId, categoryRepo]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!remoteAccessToken || remoteLedgerId == null) {
      hydratedRemoteLedgerKeyRef.current = null;
      return;
    }

    let active = true;
    const currentAccessToken = remoteAccessToken;
    const remoteLedgerKey = `${authSession?.userId ?? 'anonymous'}:${remoteLedgerId}`;

    async function hydrateRemoteLedger() {
      if (hydratedRemoteLedgerKeyRef.current === remoteLedgerKey) {
        return;
      }

      hydratedRemoteLedgerKeyRef.current = remoteLedgerKey;

      if (skipNextRemoteLedgerPullRef.current) {
        skipNextRemoteLedgerPullRef.current = false;
        return;
      }

      try {
        await runRemoteActivity('hydrate-ledger', async () =>
          hydrateRemoteLedgerState(currentAccessToken, stateRef.current)
        );
      } catch {
        hydratedRemoteLedgerKeyRef.current = null;
        if (!active) {
          return;
        }
      }
    }

    void hydrateRemoteLedger();

    return () => {
      active = false;
    };
  }, [
    authSession?.userId,
    hydrated,
    hydrateRemoteLedgerState,
    remoteAccessToken,
    remoteLedgerId,
    runRemoteActivity,
  ]);

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

    ensureAuthenticated();

    const syncPlan = getManualSyncPlan({
      canSyncRemotely,
      syncableCount: syncableTransactions.length,
    });

    if (syncPlan.type === 'noop') {
      return;
    }

    setSyncInFlight(true);

    try {
      if (syncPlan.type === 'remote') {
        await runRemoteActivity('manual-sync', async () => syncRemoteState(state));
      }
    } finally {
      setSyncInFlight(false);
    }
  }, [canSyncRemotely, ensureAuthenticated, runRemoteActivity, state, syncInFlight, syncRemoteState, syncableTransactions.length]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Best effort on the remote side; local session still needs to be cleared.
    }

    setAuthSession(null);
    setRemoteUser(null);
    lastAuthenticatedUserIdRef.current = null;
    dispatch({ type: 'resetState' });
    setMyLedgers([]);
    setCurrentLedgerId(null);
    await mockAppRuntimeStorageAdapter.clearAuthSession(MOCK_APP_AUTH_SESSION_STORAGE_KEY);
  }, [authApi]);

  const loadMyLedgers = useCallback(async () => {
    const accessToken = ensureAuthenticated();
    const result = await runRemoteActivity('load-ledgers', async () =>
      ledgerApi.listMyLedgers(accessToken)
    );
    const nextCurrentLedgerId = result.currentLedgerId ?? result.ledgers[0]?.id ?? null;
    setMyLedgers(result.ledgers);
    setCurrentLedgerId(nextCurrentLedgerId);
    setRemoteUser((current) =>
      applySelectedLedgerToRemoteUser(current, result.ledgers, nextCurrentLedgerId)
    );
    return {
      currentLedgerId: nextCurrentLedgerId,
      ledgers: result.ledgers,
    };
  }, [ensureAuthenticated, ledgerApi, runRemoteActivity]);

  const createLedger = useCallback(
    async ({ name, baseCurrency }) => {
      const trimmedName = String(name ?? '').trim();
      if (!trimmedName) {
        throw new Error('Ledger name is required');
      }
      const accessToken = ensureAuthenticated();
      const result = await runRemoteActivity('create-ledger', async () =>
        ledgerApi.createLedger(accessToken, {
          name: trimmedName,
          baseCurrency,
        })
      );
      const nextLedgers = upsertLedger(myLedgers, result.ledger);
      const nextCurrentLedgerId = result.currentLedgerId ?? result.ledger.id;
      setMyLedgers(nextLedgers);
      setCurrentLedgerId(nextCurrentLedgerId);
      setRemoteUser((current) =>
        applySelectedLedgerToRemoteUser(current, nextLedgers, nextCurrentLedgerId)
      );
      return result.ledger;
    },
    [ensureAuthenticated, ledgerApi, myLedgers, runRemoteActivity]
  );

  const switchLedger = useCallback(
    async (ledgerId) => {
      const targetLedgerId = String(ledgerId);
      const accessToken = ensureAuthenticated();
      const result = await runRemoteActivity('switch-ledger', async () =>
        ledgerApi.switchLedger(accessToken, targetLedgerId)
      );
      const nextCurrentLedgerId = result.currentLedgerId ?? targetLedgerId;
      setCurrentLedgerId(nextCurrentLedgerId);
      setRemoteUser((current) =>
        applySelectedLedgerToRemoteUser(current, myLedgers, nextCurrentLedgerId)
      );
      return {
        currentLedgerId: nextCurrentLedgerId,
      };
    },
    [ensureAuthenticated, ledgerApi, myLedgers, runRemoteActivity]
  );

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

    void (async () => {
      if (syncInFlight) {
        return;
      }

      setSyncInFlight(true);

      try {
        await runRemoteActivity('auto-sync', async () => syncRemoteState(state));
      } finally {
        setSyncInFlight(false);
      }
    })();
  }, [autoSyncEnabled, hydrated, runRemoteActivity, state, syncInFlight, syncRemoteState, syncableTransactions.length]);

  const currentRemoteActivity = useMemo(
    () => remoteActivity[remoteActivity.length - 1] ?? null,
    [remoteActivity]
  );
  const ledgerBootstrapLoading = useMemo(
    () => remoteActivity.some((activity) => LEDGER_BOOTSTRAP_ACTIVITY_KEYS.has(activity.key)),
    [remoteActivity]
  );

  const effectiveUser = useMemo(
    () => mergeAccountingUser(state.user, remoteUser ?? undefined, currentLedger ?? undefined),
    [currentLedger, remoteUser, state.user]
  );

  /** @type {MockAppContextValue} */
  const value = useMemo(
    () => ({
      state,
      user: effectiveUser,
      currentMonth: state.currentMonth,
      selectedEntryType: state.selectedEntryType,
      quickAddOpen: state.quickAddOpen,
      implicitLedgerAccountId: state.implicitLedgerAccountId || effectiveUser.defaultAccountId,
      categories: state.categories,
      transactions: state.transactions,
      currentMonthData,
      syncSummary,
      autoSyncEnabled,
      currentLedger,
      myLedgers,
      isAuthenticated,
      canSyncRemotely,
      syncInFlight,
      ledgerBootstrapLoading,
      remoteActivity: {
        visible: currentRemoteActivity != null,
        label: currentRemoteActivity?.label ?? '',
      },
      availableMonths: currentMonthData.availableMonths,
      seededMonthlyStatistics,
      actions: {
        openQuickAdd: () => dispatch({ type: 'openQuickAdd' }),
        closeQuickAdd: () => dispatch({ type: 'closeQuickAdd' }),
        setSelectedEntryType: (entryType) => dispatch({ type: 'setSelectedEntryType', entryType }),
        setCurrentMonth: (month) => dispatch({ type: 'setCurrentMonth', month }),
        addTransaction: async (input) => {
          ensureAuthenticated();
          /** @type {MockAppAction} */
          const action = {
            type: 'addTransaction',
            transaction: createTransactionRecord(input),
          };
          const nextState = reduceState(state, action);
          await transactionRepo.saveTransaction(action.transaction);
          dispatch(action);
          if (canSyncRemotely) {
            void triggerRemoteSync(nextState, 'transaction-sync');
          }
        },
        updateTransaction: (transactionId, updates) => {
          ensureAuthenticated();
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
            void triggerRemoteSync(nextState, 'transaction-sync');
          }
        },
        deleteTransaction: (transactionId) => {
          ensureAuthenticated();
          /** @type {MockAppAction} */
          const action = {
            type: 'deleteTransaction',
            transactionId,
          };
          const nextState = reduceState(state, action);
          dispatch(action);
          if (canSyncRemotely) {
            void triggerRemoteSync(nextState, 'transaction-sync');
          }
        },
        updateTransactionSyncStatus: (transactionId, syncStatus, updatedAt) =>
          dispatch({
            type: 'updateTransactionSyncStatus',
            transactionId,
            syncStatus,
            updatedAt,
          }),
        loadMyLedgers,
        createLedger,
        switchLedger,
        addCategory: async ({ name, type }) => {
          ensureAuthenticated();
          const category = createCustomCategoryRecord(name, type, state.categories);
          /** @type {MockAppAction} */
          const action = {
            type: 'addCategory',
            category,
          };
          let working = reduceState(state, action);
          dispatch(action);
          await persistCustomCategory(working.categories.find((c) => c.id === category.id) ?? category);

          if (canSyncRemotely) {
            const accessToken = remoteAccessToken;
            if (!accessToken) {
              return category;
            }

            await runRemoteActivity('create-category', async () => {
              try {
              const res = await definitionsApi.createCategory(accessToken, {
                client_id: category.id,
                name: category.name,
                kind: category.type,
              });
              const remote = res?.data?.category;
              if (remote?.id) {
                const ua = {
                  type: 'updateCategory',
                  categoryId: category.id,
                  updates: { remoteId: String(remote.id) },
                };
                working = reduceState(working, /** @type {any} */ (ua));
                dispatch(/** @type {any} */ (ua));
                await persistCustomCategory(
                  working.categories.find((c) => c.id === category.id) ?? category
                );
              }
            } catch {
              // 远端失败时保留本地记录
            }

            await syncRemoteState(working);
            });
          }

          return category;
        },
        toggleCategoryActive: async (categoryId, isActive) => {
          ensureAuthenticated();
          const existingCategory = state.categories.find((category) => category.id === categoryId);
          if (!existingCategory) {
            return;
          }

          /** @type {MockAppAction} */
          const action = {
            type: 'toggleCategoryActive',
            categoryId,
            isActive,
          };
          let working = reduceState(state, action);
          dispatch(action);
          const cat = working.categories.find((c) => c.id === categoryId);
          if (cat?.isCustom) {
            await persistCustomCategory(cat);
          }

          if (canSyncRemotely && cat?.remoteId && remoteAccessToken) {
            await runRemoteActivity('toggle-category', async () => {
              try {
                await definitionsApi.updateCategory(remoteAccessToken, cat.remoteId, {
                  is_deleted: !isActive,
                  ...(isActive ? { deleted_at: null } : { deleted_at: new Date().toISOString() }),
                });
              } catch {
                // ignore
              }

              await syncRemoteState(working);
            });
          } else if (canSyncRemotely) {
            await runRemoteActivity('toggle-category', async () => syncRemoteState(working));
          }
        },
        updateCategory: async (categoryId, updates) => {
          ensureAuthenticated();
          const existingCategory = state.categories.find((category) => category.id === categoryId);
          if (!existingCategory?.isCustom) {
            return;
          }

          /** @type {MockAppAction} */
          const action = {
            type: 'updateCategory',
            categoryId,
            updates,
          };
          let working = reduceState(state, action);
          dispatch(action);
          const cat = working.categories.find((c) => c.id === categoryId);
          if (cat?.isCustom) {
            await persistCustomCategory(cat);
          }

          if (canSyncRemotely && cat?.remoteId && remoteAccessToken) {
            await runRemoteActivity('update-category', async () => {
              try {
                await definitionsApi.updateCategory(remoteAccessToken, cat.remoteId, {
                  name: updates.name ?? cat.name,
                  kind: updates.type ?? cat.type,
                  color: updates.color ?? cat.color,
                });
              } catch {
                // ignore
              }

              await syncRemoteState(working);
            });
          } else if (canSyncRemotely) {
            await runRemoteActivity('update-category', async () => syncRemoteState(working));
          }
        },
        deleteCategory: async (categoryId) => {
          ensureAuthenticated();
          const existingCategory = state.categories.find((category) => category.id === categoryId);
          if (!existingCategory?.isCustom) {
            return;
          }

          /** @type {MockAppAction} */
          const action = { type: 'deleteCategory', categoryId };
          let working = reduceState(state, action);
          dispatch(action);
          const cat = working.categories.find((c) => c.id === categoryId);
          const deletedAt = cat?.deletedAt ?? new Date().toISOString();
          if (ownerUserId) {
            await categoryRepo.softDeleteCategory(categoryId, deletedAt, ownerUserId);
          }

          if (canSyncRemotely && cat?.remoteId && remoteAccessToken) {
            await runRemoteActivity('delete-category', async () => {
              try {
                await definitionsApi.deleteCategory(remoteAccessToken, cat.remoteId);
              } catch {
                // ignore
              }

              await syncRemoteState(working);
            });
          } else if (canSyncRemotely) {
            await runRemoteActivity('delete-category', async () => syncRemoteState(working));
          }
        },
        setAutoSyncEnabled: (enabled) => setAutoSyncEnabled(enabled),
        syncPendingTransactions,
        login: async ({ email, password }) => {
          const result = await authApi.login({ email, password });
          return completeSessionFromAuthResponse(result);
        },
        register: async ({ name, email, password }) => {
          const result = await authApi.register({ name, email, password });
          return completeSessionFromAuthResponse(result);
        },
        logout,
        updateProfile: async (draft) => {
          const accessToken = ensureAuthenticated();
          const user = await authApi.updateProfile(accessToken, draft);
          setRemoteUser({
            ...user,
            ledgerName: draft.ledgerName,
            timezone: draft.timezone,
          });
          return user;
        },
        changePassword: async (draft) => {
          const accessToken = ensureAuthenticated();
          await authApi.changePassword(accessToken, draft);
        },
      },
      selectors: {
        getCategoriesByType: (entryType) => selectCategoriesByType(state, entryType),
        getTransactionById: (transactionId) => selectTransactionById(state, transactionId),
      },
    }),
    [
      authApi,
      authSession,
      autoSyncEnabled,
      canSyncRemotely,
      categoryRepo,
      createLedger,
      currentMonthData,
      currentLedger,
      definitionsApi,
      currentRemoteActivity,
      ensureAuthenticated,
      effectiveUser,
      hydrateRemoteLedgerState,
      loadMyLedgers,
      ledgerSyncApi,
      ownerUserId,
      persistCustomCategory,
      reduceState,
      remoteAccessToken,
      myLedgers,
      isAuthenticated,
      seededMonthlyStatistics,
      state,
      switchLedger,
      syncInFlight,
      triggerRemoteSync,
      transactionRepo,
      runRemoteActivity,
      syncRemoteState,
      syncPendingTransactions,
      syncSummary,
      completeSessionFromAuthResponse,
      ledgerBootstrapLoading,
      logout,
    ]
  );

  if (!hydrated) {
    return null;
  }

  return React.createElement(
    MockAppContext.Provider,
    { value },
    children,
    React.createElement(RemoteActivityBackdrop, { key: 'remote-activity' })
  );
}

function RemoteActivityBackdrop() {
  const { remoteActivity } = useMockApp();
  const theme = useAccountingTheme();

  /** @type {import('react-native').ViewStyle} */
  const fillRoot = {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  };

  /** @type {import('react-native').TextStyle} */
  const captionText = {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.body,
    color: '#ffffff',
    textAlign: 'center',
  };

  return React.createElement(
    Modal,
    {
      visible: remoteActivity.visible,
      transparent: true,
      animationType: 'fade',
      statusBarTranslucent: true,
    },
    React.createElement(
      View,
      { style: fillRoot },
      React.createElement(ActivityIndicator, { size: 'large', color: '#ffffff' }),
      React.createElement(Text, { style: captionText }, remoteActivity.label)
    )
  );
}

/**
 * @param {import('../types/accounting.js').AccountingUser} baseUser
 * @param {{
 *   id?: string | number | undefined,
 *   name?: string | undefined,
 *   email?: string | undefined,
 *   ledgerName?: string | undefined,
 *   timezone?: string | undefined,
 * }} [remoteUser]
 * @param {{ name?: string | undefined } | undefined} [currentLedger]
 */
function mergeAccountingUser(baseUser, remoteUser, currentLedger) {
  if (!remoteUser) {
    return {
      ...baseUser,
      ledgerName:
        typeof currentLedger?.name === 'string' && currentLedger.name
          ? currentLedger.name
          : baseUser.ledgerName,
    };
  }

  return {
    ...baseUser,
    id: remoteUser.id == null ? baseUser.id : String(remoteUser.id),
    name: typeof remoteUser.name === 'string' ? remoteUser.name : baseUser.name,
    email: typeof remoteUser.email === 'string' ? remoteUser.email : baseUser.email,
    ledgerName:
      typeof currentLedger?.name === 'string' && currentLedger.name
        ? currentLedger.name
        : typeof remoteUser.ledgerName === 'string'
          ? remoteUser.ledgerName
          : baseUser.ledgerName,
    timezone: typeof remoteUser.timezone === 'string' ? remoteUser.timezone : baseUser.timezone,
  };
}

/**
 * @param {{ currentLedgerId?: string | null | undefined, current_ledger_id?: string | null | undefined } | null | undefined} remoteUser
 */
function resolveRemoteLedgerId(remoteUser) {
  return remoteUser?.currentLedgerId ?? remoteUser?.current_ledger_id ?? null;
}

/**
 * @param {string} name
 * @param {EntryType} type
 * @param {LedgerCategory[]} existingCategories
 * @returns {LedgerCategory}
 */
function createCustomCategoryRecord(name, type, existingCategories) {
  const existingCount = existingCategories.filter((category) => category.type === type).length;
  const appearance = getCustomCategoryAppearance(type, existingCount);

  return {
    id: `cat-custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    type,
    isActive: true,
    isCustom: true,
    color: appearance.color,
    iconName: appearance.iconName,
    sortOrder: existingCount + 100,
  };
}

/**
 * @param {RemoteLedger[]} ledgers
 * @param {RemoteLedger} ledger
 * @returns {RemoteLedger[]}
 */
function upsertLedger(ledgers, ledger) {
  const index = ledgers.findIndex((item) => item.id === ledger.id);
  if (index === -1) {
    return [...ledgers, ledger];
  }

  return ledgers.map((item) => (item.id === ledger.id ? ledger : item));
}

/**
 * @param {(RemoteAuthUser & { ledgerName?: string | undefined, timezone?: string | undefined }) | null} current
 * @param {RemoteLedger[]} ledgers
 * @param {string | null} currentLedgerId
 */
function applySelectedLedgerToRemoteUser(current, ledgers, currentLedgerId) {
  if (!current) {
    return current;
  }

  const selected = ledgers.find((ledger) => ledger.id === currentLedgerId) ?? null;

  return {
    ...current,
    currentLedgerId,
    ledgerName: selected?.name ?? current.ledgerName,
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

/** @returns {SyncSummary} */
export function useSyncSummary() {
  return useMockApp().syncSummary;
}

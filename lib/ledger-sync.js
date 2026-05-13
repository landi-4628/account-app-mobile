/**
 * @typedef {import('../state/mock-app-snapshot.js').MockAppSnapshot} MockAppSnapshot
 * @typedef {import('../types/accounting').AccountType} AccountType
 * @typedef {import('../types/accounting').EntryType} EntryType
 */

/**
 * @param {{
 *   apiClient: {
 *     get: (path: string, options?: { headers?: Record<string, string> }) => Promise<any>,
 *     post: (path: string, body: unknown, options?: { headers?: Record<string, string> }) => Promise<any>,
 *     delete?: (path: string, options?: { headers?: Record<string, string> }) => Promise<any>,
 *   },
 * }} input
 */
export function createLedgerSyncApi(input) {
  return {
    /**
     * @param {string} accessToken
     * @param {string | undefined} [since]
     */
    async pull(accessToken, since) {
      const query = since ? `?since=${encodeURIComponent(since)}` : '';
      return input.apiClient.get(`/api/sync/pull${query}`, {
        headers: buildAuthHeaders(accessToken),
      });
    },

    /**
     * @param {string} accessToken
     * @param {{ accounts: Array<Record<string, unknown>>, categories: Array<Record<string, unknown>> }} payload
     */
    async pushDefinitions(accessToken, payload) {
      return input.apiClient.post(
        '/api/sync/push',
        {
          accounts: payload.accounts,
          categories: payload.categories,
          transactions: [],
        },
        {
          headers: buildAuthHeaders(accessToken),
        }
      );
    },

    /**
     * @param {string} accessToken
     * @param {{ transactions: Array<Record<string, unknown>> }} payload
     */
    async pushTransactions(accessToken, payload) {
      return input.apiClient.post(
        '/api/sync/push',
        {
          accounts: [],
          categories: [],
          transactions: payload.transactions,
        },
        {
          headers: buildAuthHeaders(accessToken),
        }
      );
    },

    /**
     * @param {string} accessToken
     * @param {string | number} remoteTransactionId
     */
    async deleteTransaction(accessToken, remoteTransactionId) {
      if (!input.apiClient.delete) {
        throw new Error('API client does not support DELETE requests');
      }

      return input.apiClient.delete(`/api/transactions/${remoteTransactionId}`, {
        headers: buildAuthHeaders(accessToken),
      });
    },
  };
}

/**
 * @param {string} accessToken
 */
function buildAuthHeaders(accessToken) {
  return {
    authorization: `Bearer ${accessToken}`,
  };
}

/**
 * @param {Array<Record<string, unknown>>} accounts
 * @param {Array<Record<string, unknown>>} categories
 */
export function buildDefinitionsPushPayload(accounts, categories) {
  return {
    accounts: accounts.map((account) => ({
      id: toRemoteNumericId(account.remoteId),
      client_id: String(account.id),
      name: String(account.name),
      type: String(account.type),
      currency: 'CNY',
      opening_balance: Number(account.initialBalance ?? 0),
      is_deleted: account.isActive === false,
      deleted_at: account.deletedAt ?? undefined,
    })),
    categories: categories.map((category) => ({
      id: toRemoteNumericId(category.remoteId),
      client_id: String(category.id),
      name: String(category.name),
      kind: String(category.type),
      color: category.color == null ? undefined : String(category.color),
      is_deleted: category.isActive === false,
      deleted_at: category.deletedAt ?? undefined,
    })),
  };
}

/**
 * @param {Array<Record<string, unknown>>} transactions
 * @param {{ accountIds: Map<string, number>, categoryIds: Map<string, number> }} references
 */
export function buildTransactionsPushPayload(transactions, references) {
  return {
    transactions: transactions.map((transaction) => {
      const accountRemoteId = references.accountIds.get(String(transaction.accountId));
      const categoryRemoteId = references.categoryIds.get(String(transaction.categoryId));

      if (!accountRemoteId) {
        throw new Error(`Cannot sync transaction ${transaction.id}: missing remote account mapping`);
      }

      if (!categoryRemoteId) {
        throw new Error(`Cannot sync transaction ${transaction.id}: missing remote category mapping`);
      }

      return {
        id: toRemoteNumericId(transaction.remoteId),
        client_id: String(transaction.id),
        account_id: accountRemoteId,
        category_id: categoryRemoteId,
        kind: String(transaction.type),
        amount: Number(transaction.amount),
        note: String(transaction.note ?? ''),
        occurred_at: String(transaction.transactionAt),
        is_deleted: transaction.deletedAt != null,
        deleted_at: transaction.deletedAt ?? undefined,
      };
    }),
  };
}

/**
 * @param {{ data?: { accounts?: Array<Record<string, unknown>>, categories?: Array<Record<string, unknown>>, transactions?: Array<Record<string, unknown>>, server_time?: string } }} payload
 */
export function hasRemoteLedgerData(payload) {
  const accounts = payload?.data?.accounts ?? [];
  const categories = payload?.data?.categories ?? [];
  const transactions = payload?.data?.transactions ?? [];

  return accounts.length > 0 || categories.length > 0 || transactions.length > 0;
}

/**
 * @param {{ data?: { accounts?: Array<Record<string, unknown>>, categories?: Array<Record<string, unknown>>, transactions?: Array<Record<string, unknown>>, server_time?: string } }} payload
 * @param {{ currentMonth: string, selectedEntryType: import('../types/accounting.js').EntryType, fallbackSyncUpdatedAt: string }} options
 * @returns {MockAppSnapshot}
 */
export function buildSnapshotFromRemotePayload(payload, options) {
  const remoteAccounts = (payload?.data?.accounts ?? []).filter((account) => !toBooleanFlag(account.is_deleted));
  const remoteCategories = (payload?.data?.categories ?? []).filter((category) => !toBooleanFlag(category.is_deleted));
  const accountClientIdsByRemoteId = new Map();
  const categoryClientIdsByRemoteId = new Map();

  const accounts = remoteAccounts.map((account) => {
    const localId = getLocalId(account);
    const remoteId = toRemoteNumericId(account.id);
    if (remoteId) {
      accountClientIdsByRemoteId.set(remoteId, localId);
    }

    return {
      id: localId,
      remoteId,
      name: String(account.name),
      type: /** @type {AccountType} */ (String(account.type)),
      initialBalance: Number(account.opening_balance ?? 0),
      currentBalance: Number(account.opening_balance ?? 0),
      isActive: true,
      isCustom: true,
      updatedAt: String(account.updatedAt ?? account.updated_at ?? options.fallbackSyncUpdatedAt),
      deletedAt: null,
    };
  });

  const categories = remoteCategories.map((category) => {
    const localId = getLocalId(category);
    const remoteId = toRemoteNumericId(category.id);
    if (remoteId) {
      categoryClientIdsByRemoteId.set(remoteId, localId);
    }

    return {
      id: localId,
      remoteId,
      name: String(category.name),
      type: /** @type {EntryType} */ (String(category.kind)),
      isActive: true,
      isCustom: true,
      updatedAt: String(category.updatedAt ?? category.updated_at ?? options.fallbackSyncUpdatedAt),
      deletedAt: null,
    };
  });

  const transactions = (payload?.data?.transactions ?? [])
    .filter((transaction) => !toBooleanFlag(transaction.is_deleted))
    .map((transaction) => {
      const remoteId = toRemoteNumericId(transaction.id);
      const accountId =
        accountClientIdsByRemoteId.get(Number(transaction.account_id)) ?? String(transaction.account_id);
      const categoryId =
        categoryClientIdsByRemoteId.get(Number(transaction.category_id)) ?? String(transaction.category_id);

      return {
        id: getLocalId(transaction),
        remoteId,
        type: /** @type {EntryType} */ (String(transaction.kind)),
        amount: Number(transaction.amount),
        categoryId: String(categoryId),
        accountId: String(accountId),
        note: String(transaction.note ?? ''),
        transactionAt: String(transaction.occurred_at),
        syncStatus: /** @type {import('../types/accounting.js').SyncStatus} */ ('synced'),
        syncError: null,
        syncedAt: String(payload?.data?.server_time ?? options.fallbackSyncUpdatedAt),
        updatedAt: String(transaction.updatedAt ?? transaction.updated_at ?? options.fallbackSyncUpdatedAt),
        deletedAt: null,
      };
    });

  return {
    currentMonth: options.currentMonth,
    selectedEntryType: options.selectedEntryType,
    accounts,
    categories,
    transactions,
    syncUpdatedAt: String(payload?.data?.server_time ?? options.fallbackSyncUpdatedAt),
  };
}

/**
 * @param {{ data?: { accounts?: Array<Record<string, unknown>>, categories?: Array<Record<string, unknown>> } }} payload
 */
export function buildRemoteReferenceMaps(payload) {
  const accountIds = new Map();
  const categoryIds = new Map();

  for (const account of payload?.data?.accounts ?? []) {
    const remoteId = toRemoteNumericId(account.id);
    if (remoteId) {
      accountIds.set(getLocalId(account), remoteId);
    }
  }

  for (const category of payload?.data?.categories ?? []) {
    const remoteId = toRemoteNumericId(category.id);
    if (remoteId) {
      categoryIds.set(getLocalId(category), remoteId);
    }
  }

  return { accountIds, categoryIds };
}

/**
 * @param {unknown} value
 */
function getLocalId(
  /** @type {Record<string, unknown>} */ value
) {
  return String(value?.client_id ?? value?.id);
}

/**
 * @param {unknown} value
 */
function toRemoteNumericId(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * @param {unknown} value
 */
function toBooleanFlag(value) {
  return value === true || value === 1;
}

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
     * @param {{ categories: Array<Record<string, unknown>> }} payload
     */
    async pushDefinitions(accessToken, payload) {
      return input.apiClient.post(
        '/api/sync/push',
        {
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
          transactions: payload.transactions,
        },
        {
          headers: buildAuthHeaders(accessToken),
        }
      );
    },

    /**
     * @param {string} accessToken
     * @param {string} remoteTransactionId
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
 * @param {Array<Record<string, unknown>>} categories
 */
export function buildDefinitionsPushPayload(categories) {
  return {
    categories: categories.map((category) => ({
      id: toRemoteEntityId(category.remoteId),
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
 * @param {{ categoryIds: Map<string, string> }} references
 */
export function buildTransactionsPushPayload(transactions, references) {
  return {
    transactions: transactions.flatMap((transaction) => {
      const remoteTransactionId = toRemoteEntityId(transaction.remoteId);
      const isDeleted = transaction.deletedAt != null;
      const categoryRemoteId = references.categoryIds.get(String(transaction.categoryId));

      if (!categoryRemoteId) {
        if (isDeleted && !remoteTransactionId) {
          return [];
        }

        if (!isDeleted) {
          throw new Error(`Cannot sync transaction ${transaction.id}: missing remote category mapping`);
        }
      }

      return [{
        id: remoteTransactionId,
        client_id: String(transaction.id),
        account_id: String(transaction.accountId),
        category_id: categoryRemoteId,
        kind: String(transaction.type),
        amount: Number(transaction.amount),
        note: String(transaction.note ?? ''),
        occurred_at: String(transaction.transactionAt),
        is_deleted: isDeleted,
        deleted_at: transaction.deletedAt ?? undefined,
      }];
    }),
  };
}

/**
 * @param {{ data?: { accounts?: Array<Record<string, unknown>>, categories?: Array<Record<string, unknown>>, transactions?: Array<Record<string, unknown>>, server_time?: string } }} payload
 */
export function hasRemoteLedgerData(payload) {
  const categories = payload?.data?.categories ?? [];
  const transactions = payload?.data?.transactions ?? [];

  return categories.length > 0 || transactions.length > 0;
}

/**
 * @param {{ data?: { accounts?: Array<Record<string, unknown>>, categories?: Array<Record<string, unknown>>, transactions?: Array<Record<string, unknown>>, server_time?: string } }} payload
 * @param {{ currentMonth: string, selectedEntryType: import('../types/accounting.js').EntryType, fallbackSyncUpdatedAt: string, baselineImplicitLedgerAccountId?: string | undefined }} options
 * @returns {MockAppSnapshot}
 */
export function buildSnapshotFromRemotePayload(payload, options) {
  const remoteAccounts = (payload?.data?.accounts ?? []).filter((account) => !toBooleanFlag(account.is_deleted));
  const remoteCategories = (payload?.data?.categories ?? []).filter((category) => !toBooleanFlag(category.is_deleted));
  const accountClientIdsByRemoteId = new Map();
  const categoryClientIdsByRemoteId = new Map();

  remoteAccounts.forEach((account) => {
    const localId = getLocalId(account);
    const remoteId = toRemoteEntityId(account.id);
    if (remoteId) {
      accountClientIdsByRemoteId.set(remoteId, localId);
    }
  });

  let implicitLedgerAccountId = '';

  if (remoteAccounts.length > 0) {
    implicitLedgerAccountId = getLocalId(remoteAccounts[0]);
  } else if (typeof options.baselineImplicitLedgerAccountId === 'string' && options.baselineImplicitLedgerAccountId) {
    implicitLedgerAccountId = options.baselineImplicitLedgerAccountId;
  }

  const categories = remoteCategories.map((category) => {
    const localId = getLocalId(category);
    const remoteId = toRemoteEntityId(category.id);
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
      const remoteId = toRemoteEntityId(transaction.id);
      const accountRemoteKey = toRemoteEntityId(transaction.account_id);
      const categoryRemoteKey = toRemoteEntityId(transaction.category_id);
      const accountId =
        (accountRemoteKey && accountClientIdsByRemoteId.get(accountRemoteKey)) ??
        String(transaction.account_id);
      const categoryId =
        (categoryRemoteKey && categoryClientIdsByRemoteId.get(categoryRemoteKey)) ??
        String(transaction.category_id);

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

  if (!implicitLedgerAccountId && transactions.length > 0) {
    implicitLedgerAccountId = String(transactions[0].accountId);
  }

  return {
    currentMonth: options.currentMonth,
    selectedEntryType: options.selectedEntryType,
    implicitLedgerAccountId,
    categories,
    transactions,
    syncUpdatedAt: String(payload?.data?.server_time ?? options.fallbackSyncUpdatedAt),
  };
}

/**
 * @param {{ data?: { categories?: Array<Record<string, unknown>> } }} payload
 */
export function buildRemoteReferenceMaps(payload) {
  const categoryIds = new Map();

  for (const category of payload?.data?.categories ?? []) {
    const remoteId = toRemoteEntityId(category.id);
    if (remoteId) {
      categoryIds.set(getLocalId(category), remoteId);
    }
  }

  return { categoryIds };
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
 * @returns {string | undefined}
 */
function toRemoteEntityId(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  const trimmed = String(value).trim();
  return trimmed === '' ? undefined : trimmed;
}

/**
 * @param {unknown} value
 */
function toBooleanFlag(value) {
  return value === true || value === 1;
}

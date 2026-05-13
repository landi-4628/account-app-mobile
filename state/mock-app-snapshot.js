/**
 * @typedef {import('./mock-app-state.js').MockAppState} MockAppState
 * @typedef {import('../types/accounting').EntryType} EntryType
 * @typedef {import('../types/accounting').LedgerAccount} LedgerAccount
 * @typedef {import('../types/accounting').LedgerCategory} LedgerCategory
 * @typedef {import('../types/accounting').TransactionRecord} TransactionRecord
 */

/**
 * @typedef {object} MockAppSnapshot
 * @property {string} currentMonth
 * @property {EntryType} selectedEntryType
 * @property {TransactionRecord[]} transactions
 * @property {LedgerAccount[]} accounts
 * @property {LedgerCategory[]} categories
 * @property {string} syncUpdatedAt
 */

/**
 * @param {MockAppState} state
 * @returns {MockAppSnapshot}
 */
export function selectMockAppSnapshot(state) {
  return {
    currentMonth: state.currentMonth,
    selectedEntryType: state.selectedEntryType,
    transactions: state.transactions.map((transaction) => ({ ...transaction })),
    accounts: state.accounts.map((account) => ({ ...account })),
    categories: state.categories.map((category) => ({ ...category })),
    syncUpdatedAt: state.syncUpdatedAt,
  };
}

/**
 * @param {MockAppState} state
 * @returns {MockAppSnapshot}
 */
export function selectCompactedMockAppSnapshot(state) {
  return {
    currentMonth: state.currentMonth,
    selectedEntryType: state.selectedEntryType,
    transactions: state.transactions
      .filter((transaction) => transaction.deletedAt == null)
      .map((transaction) => ({ ...transaction })),
    accounts: state.accounts.map((account) => ({ ...account })),
    categories: state.categories.map((category) => ({ ...category })),
    syncUpdatedAt: state.syncUpdatedAt,
  };
}

/**
 * @param {string | null | undefined | unknown} raw
 * @returns {MockAppSnapshot | null}
 */
export function parseMockAppSnapshot(raw) {
  if (!raw) {
    return null;
  }

  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;

    if (!isSnapshotShape(parsed)) {
      return null;
    }

    return {
      currentMonth: parsed.currentMonth,
      selectedEntryType: parsed.selectedEntryType,
      transactions: parsed.transactions.map((transaction) => ({ ...transaction })),
      accounts: parsed.accounts.map((account) => ({ ...account })),
      categories: parsed.categories.map((category) => ({ ...category })),
      syncUpdatedAt: parsed.syncUpdatedAt,
    };
  } catch {
    return null;
  }
}

/**
 * @param {MockAppState} initialState
 * @param {MockAppSnapshot} snapshot
 * @returns {MockAppState}
 */
export function applyMockAppSnapshot(initialState, snapshot) {
  return {
    ...initialState,
    currentMonth: snapshot.currentMonth,
    selectedEntryType: snapshot.selectedEntryType,
    transactions: snapshot.transactions.map((transaction) => ({ ...transaction })),
    accounts: snapshot.accounts.map((account) => ({ ...account })),
    categories: snapshot.categories.map((category) => ({ ...category })),
    syncUpdatedAt: snapshot.syncUpdatedAt,
  };
}

/**
 * @param {unknown} value
 * @returns {value is MockAppSnapshot}
 */
function isSnapshotShape(value) {
  return Boolean(
    value
      && typeof value === 'object'
      && 'currentMonth' in value
      && 'selectedEntryType' in value
      && 'transactions' in value
      && 'accounts' in value
      && 'categories' in value
      && 'syncUpdatedAt' in value
      && typeof value.currentMonth === 'string'
      && isEntryType(value.selectedEntryType)
      && Array.isArray(value.transactions)
      && value.transactions.every(isTransactionRecord)
      && Array.isArray(value.accounts)
      && value.accounts.every(isLedgerAccount)
      && Array.isArray(value.categories)
      && value.categories.every(isLedgerCategory)
      && typeof value.syncUpdatedAt === 'string'
  );
}

/**
 * @param {unknown} value
 * @returns {value is EntryType}
 */
function isEntryType(value) {
  return value === 'expense' || value === 'income';
}

/**
 * @param {unknown} value
 * @returns {value is import('../types/accounting').SyncStatus}
 */
function isSyncStatus(value) {
  return value === 'synced' || value === 'pending' || value === 'failed';
}

/**
 * @param {unknown} value
 * @returns {value is LedgerCategory}
 */
function isLedgerCategory(value) {
  return Boolean(
    value
      && typeof value === 'object'
      && 'id' in value
      && 'name' in value
      && 'type' in value
      && 'isActive' in value
      && typeof value.id === 'string'
      && typeof value.name === 'string'
      && isEntryType(value.type)
      && typeof value.isActive === 'boolean'
      && (!('isCustom' in value) || typeof value.isCustom === 'boolean')
  );
}

/**
 * @param {unknown} value
 * @returns {value is LedgerAccount}
 */
function isLedgerAccount(value) {
  return Boolean(
    value
      && typeof value === 'object'
      && 'id' in value
      && 'name' in value
      && 'type' in value
      && 'initialBalance' in value
      && 'currentBalance' in value
      && 'isActive' in value
      && typeof value.id === 'string'
      && typeof value.name === 'string'
      && isAccountType(value.type)
      && typeof value.initialBalance === 'number'
      && typeof value.currentBalance === 'number'
      && typeof value.isActive === 'boolean'
      && (!('isCustom' in value) || typeof value.isCustom === 'boolean')
  );
}

/**
 * @param {unknown} value
 * @returns {value is import('../types/accounting').AccountType}
 */
function isAccountType(value) {
  return value === 'cash' || value === 'bank' || value === 'alipay' || value === 'wechat';
}

/**
 * @param {unknown} value
 * @returns {value is TransactionRecord}
 */
function isTransactionRecord(value) {
  return Boolean(
    value
      && typeof value === 'object'
      && 'id' in value
      && 'type' in value
      && 'amount' in value
      && 'categoryId' in value
      && 'accountId' in value
      && 'note' in value
      && 'transactionAt' in value
      && 'syncStatus' in value
      && typeof value.id === 'string'
      && isEntryType(value.type)
      && typeof value.amount === 'number'
      && typeof value.categoryId === 'string'
      && typeof value.accountId === 'string'
      && typeof value.note === 'string'
      && typeof value.transactionAt === 'string'
      && isSyncStatus(value.syncStatus)
      && (!('deletedAt' in value) || value.deletedAt === null || typeof value.deletedAt === 'string')
  );
}

/**
 * @typedef {'expense' | 'income'} EntryType
 */

/**
 * @typedef {'synced' | 'pending' | 'failed'} SyncStatus
 */

/**
 * @typedef {'cash' | 'bank' | 'alipay' | 'wechat'} AccountType
 */

/**
 * @typedef {'CNY'} CurrencyCode
 */

/**
 * @typedef {string} CategoryId
 */

/**
 * @typedef {object} LedgerAccount
 * @property {string} id
 * @property {string} name
 * @property {AccountType} type
 * @property {number} initialBalance
 * @property {number} currentBalance
 * @property {boolean} isActive
 * @property {boolean | undefined} [isCustom]
 * @property {string | undefined} [remoteId]
 * @property {string | null | undefined} [deletedAt]
 */

/**
 * @typedef {object} LedgerCategory
 * @property {CategoryId} id
 * @property {string} name
 * @property {EntryType} type
 * @property {boolean} isActive
 * @property {boolean | undefined} [isCustom]
 * @property {string | undefined} [remoteId]
 * @property {string | null | undefined} [deletedAt]
 * @property {string | undefined} [color]
 */

/**
 * @typedef {object} TransactionRecord
 * @property {string} id
 * @property {EntryType} type
 * @property {number} amount
 * @property {CategoryId} categoryId
 * @property {string} accountId
 * @property {string} note
 * @property {string} transactionAt
 * @property {SyncStatus} syncStatus
 */

/**
 * @typedef {object} AccountingUser
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} ledgerName
 * @property {CurrencyCode} currency
 * @property {string} timezone
 * @property {string} defaultAccountId
 */

/**
 * @typedef {object} SummaryCardData
 * @property {string} month
 * @property {number} income
 * @property {number} expense
 * @property {number} balance
 * @property {SyncStatus} syncStatus
 * @property {number} pendingCount
 * @property {number} failedCount
 */

/**
 * @typedef {object} CategoryBreakdownItem
 * @property {CategoryId} categoryId
 * @property {number} amount
 * @property {number} percent
 */

/**
 * @typedef {object} MonthlyStatistics
 * @property {string} month
 * @property {SummaryCardData} summaryCard
 * @property {CategoryBreakdownItem[]} expenseBreakdown
 * @property {CategoryBreakdownItem[]} incomeBreakdown
 * @property {number} transactionCount
 * @property {number} pendingCount
 */

/**
 * @typedef {object} SyncSummary
 * @property {SyncStatus} status
 * @property {number} pendingCount
 * @property {number} failedCount
 * @property {string} updatedAt
 */

/**
 * @typedef {Pick<TransactionRecord, 'type' | 'amount' | 'categoryId' | 'accountId' | 'transactionAt'> & {
 *   note?: string | undefined
 * }} NewTransactionInput
 */

/**
 * @typedef {Partial<NewTransactionInput>} EditTransactionInput
 */

export {};

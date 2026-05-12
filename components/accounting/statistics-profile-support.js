import { accountingCategoryLabels, accountingCopy } from '../../constants/accounting-copy.js';

import { formatTransactionDateTime } from './helpers.js';

const accountTypeLabels = accountingCopy.accountTypes;

/**
 * @param {import('../../types/accounting').CategoryId} categoryId
 */
export function getAccountingCategoryLabel(categoryId) {
  return accountingCategoryLabels[categoryId] ?? categoryId;
}

/**
 * @param {import('../../types/accounting').AccountType} accountType
 */
export function getAccountTypeLabel(accountType) {
  return accountTypeLabels[accountType] ?? accountType;
}

/**
 * @param {import('../../types/accounting').SyncSummary} syncSummary
 * @param {string | undefined} timeZone
 */
export function getSyncSummaryDetail(syncSummary, timeZone) {
  const updatedAt = `${accountingCopy.profile.syncUpdatedPrefix} ${formatTransactionDateTime(syncSummary.updatedAt, timeZone)}`;

  if (syncSummary.failedCount > 0 && syncSummary.pendingCount > 0) {
    return `${updatedAt} | 失败 ${syncSummary.failedCount} 条，待同步 ${syncSummary.pendingCount} 条`;
  }

  if (syncSummary.failedCount > 0) {
    return `${updatedAt} | 失败 ${syncSummary.failedCount} 条`;
  }

  if (syncSummary.pendingCount > 0) {
    return `${updatedAt} | 待同步 ${syncSummary.pendingCount} 条`;
  }

  return `${updatedAt} | ${accountingCopy.profile.allSynced}`;
}

/**
 * @param {import('../../types/accounting').SyncStatus} status
 * @returns {string | null}
 */
export function getSyncActionLabel(status) {
  if (status === 'failed') {
    return accountingCopy.actions.retrySync;
  }

  if (status === 'pending') {
    return accountingCopy.actions.syncNow;
  }

  return null;
}

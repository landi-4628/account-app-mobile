import { accountingCategoryLabels } from '../../constants/accounting-copy.js';

import { formatTransactionDateTime } from './helpers.js';

const accountTypeLabels = {
  cash: 'Cash',
  bank: 'Bank card',
  alipay: 'Alipay',
  wechat: 'WeChat wallet',
};

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
  const updatedAt = `Last update ${formatTransactionDateTime(syncSummary.updatedAt, timeZone)}`;

  if (syncSummary.failedCount > 0 && syncSummary.pendingCount > 0) {
    return `${updatedAt} | ${syncSummary.failedCount} failed, ${syncSummary.pendingCount} pending`;
  }

  if (syncSummary.failedCount > 0) {
    return `${updatedAt} | ${syncSummary.failedCount} failed`;
  }

  if (syncSummary.pendingCount > 0) {
    return `${updatedAt} | ${syncSummary.pendingCount} pending`;
  }

  return `${updatedAt} | All changes synced`;
}

/**
 * @param {import('../../types/accounting').SyncStatus} status
 * @returns {string | null}
 */
export function getSyncActionLabel(status) {
  if (status === 'failed') {
    return 'Retry sync';
  }

  if (status === 'pending') {
    return 'Sync now';
  }

  return null;
}

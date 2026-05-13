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

function buildUpdatedAtCopy(syncSummary, timeZone) {
  return `${accountingCopy.profile.syncUpdatedPrefix} ${formatTransactionDateTime(syncSummary.updatedAt, timeZone)}`;
}

function buildLegacySyncDetail(syncSummary, updatedAt) {
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

function buildModeSyncDetail(syncSummary, updatedAt, isAutoSyncEnabled) {
  const detailParts = [
    isAutoSyncEnabled ? '已保存到本地，有网时自动同步' : '仅保存在本地，可稍后手动同步',
  ];

  if (syncSummary.failedCount > 0) {
    detailParts.push(`失败 ${syncSummary.failedCount} 条`);
  }

  if (syncSummary.pendingCount > 0) {
    detailParts.push(`待同步 ${syncSummary.pendingCount} 条`);
  }

  if (syncSummary.failedCount === 0 && syncSummary.pendingCount === 0 && isAutoSyncEnabled) {
    detailParts[0] = '已保存到本地，并已完成自动同步';
  }

  return `${updatedAt} | ${detailParts.join('，')}`;
}

/**
 * @param {import('../../types/accounting').SyncSummary} syncSummary
 * @param {string | undefined} timeZone
 * @param {{ isAutoSyncEnabled?: boolean } | undefined} options
 */
export function getSyncSummaryDetail(syncSummary, timeZone, options) {
  const updatedAt = buildUpdatedAtCopy(syncSummary, timeZone);

  if (typeof options?.isAutoSyncEnabled === 'boolean') {
    return buildModeSyncDetail(syncSummary, updatedAt, options.isAutoSyncEnabled);
  }

  return buildLegacySyncDetail(syncSummary, updatedAt);
}

/**
 * @param {import('../../types/accounting').SyncStatus} status
 * @param {{ isAutoSyncEnabled?: boolean, hasPendingChanges?: boolean } | undefined} options
 * @returns {string | null}
 */
export function getSyncActionLabel(status, options) {
  if (options?.isAutoSyncEnabled === false) {
    return options.hasPendingChanges ? '手动同步' : null;
  }

  if (status === 'failed') {
    return accountingCopy.actions.retrySync;
  }

  if (status === 'pending') {
    return accountingCopy.actions.syncNow;
  }

  return null;
}

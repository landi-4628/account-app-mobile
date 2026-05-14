import { accountingCategoryLabels, accountingCopy } from '../../constants/accounting-copy.js';

import { formatTransactionDateTime } from './helpers.js';

const accountTypeLabels = accountingCopy.accountTypes;
const unavailableSyncBaseCopy =
  '\u5f53\u524d\u4e0d\u53ef\u8fdc\u7aef\u540c\u6b65\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5';

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
    return `${updatedAt} | \u5931\u8d25 ${syncSummary.failedCount} \u6761\uff0c\u5f85\u540c\u6b65 ${syncSummary.pendingCount} \u6761`;
  }

  if (syncSummary.failedCount > 0) {
    return `${updatedAt} | \u5931\u8d25 ${syncSummary.failedCount} \u6761`;
  }

  if (syncSummary.pendingCount > 0) {
    return `${updatedAt} | \u5f85\u540c\u6b65 ${syncSummary.pendingCount} \u6761`;
  }

  return `${updatedAt} | ${accountingCopy.profile.allSynced}`;
}

function getModeBaseDetail(isAutoSyncEnabled, canSyncRemotely) {
  if (canSyncRemotely === false) {
    if (isAutoSyncEnabled) {
      return `\u5df2\u4fdd\u5b58\u5728\u672c\u5730\uff0c${unavailableSyncBaseCopy}`;
    }

    return `\u4ec5\u4fdd\u5b58\u5728\u672c\u5730\uff0c${unavailableSyncBaseCopy}`;
  }

  return isAutoSyncEnabled
    ? '\u5df2\u4fdd\u5b58\u5230\u672c\u5730\uff0c\u6709\u7f51\u65f6\u81ea\u52a8\u540c\u6b65'
    : '\u4ec5\u4fdd\u5b58\u5728\u672c\u5730\uff0c\u53ef\u7a0d\u540e\u624b\u52a8\u540c\u6b65';
}

function buildModeSyncDetail(syncSummary, updatedAt, isAutoSyncEnabled, canSyncRemotely) {
  const detailParts = [getModeBaseDetail(isAutoSyncEnabled, canSyncRemotely)];

  if (syncSummary.failedCount > 0) {
    detailParts.push(`\u5931\u8d25 ${syncSummary.failedCount} \u6761`);
  }

  if (syncSummary.pendingCount > 0) {
    detailParts.push(`\u5f85\u540c\u6b65 ${syncSummary.pendingCount} \u6761`);
  }

  if (
    syncSummary.failedCount === 0
    && syncSummary.pendingCount === 0
    && isAutoSyncEnabled
    && canSyncRemotely !== false
  ) {
    detailParts[0] = '\u5df2\u4fdd\u5b58\u5230\u672c\u5730\uff0c\u5e76\u5df2\u5b8c\u6210\u81ea\u52a8\u540c\u6b65';
  }

  return `${updatedAt} | ${detailParts.join('\uff0c')}`;
}

/**
 * @param {import('../../types/accounting').SyncSummary} syncSummary
 * @param {string | undefined} timeZone
 * @param {{ isAutoSyncEnabled?: boolean, canSyncRemotely?: boolean } | undefined} options
 */
export function getSyncSummaryDetail(syncSummary, timeZone, options) {
  const updatedAt = buildUpdatedAtCopy(syncSummary, timeZone);

  if (typeof options?.isAutoSyncEnabled === 'boolean') {
    return buildModeSyncDetail(
      syncSummary,
      updatedAt,
      options.isAutoSyncEnabled,
      options.canSyncRemotely
    );
  }

  return buildLegacySyncDetail(syncSummary, updatedAt);
}

/**
 * @param {{
 *   hasPendingChanges?: boolean,
 *   canSyncRemotely?: boolean,
 * } | undefined} options
 * @returns {string | null}
 */
export function getManualSyncUnavailableMessage(options) {
  if (!options?.hasPendingChanges || options.canSyncRemotely !== false) {
    return null;
  }

  return '\u5f53\u524d\u65e0\u6cd5\u8fde\u63a5\u8fdc\u7aef\u540c\u6b65\uff0c\u53d8\u66f4\u5df2\u4fdd\u5b58\u5728\u672c\u5730\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002';
}

/**
 * @param {import('../../types/accounting').SyncStatus} status
 * @param {{
 *   isAutoSyncEnabled?: boolean,
 *   hasPendingChanges?: boolean,
 *   canSyncRemotely?: boolean,
 *   isSyncInFlight?: boolean,
 * } | undefined} options
 * @returns {string | null}
 */
export function getSyncActionLabel(status, options) {
  if (options?.isSyncInFlight && options.hasPendingChanges) {
    return '\u540c\u6b65\u4e2d...';
  }

  if (options?.hasPendingChanges && options.canSyncRemotely === false) {
    return '\u6682\u4e0d\u53ef\u540c\u6b65';
  }

  if (options?.isAutoSyncEnabled === false) {
    if (status === 'failed') {
      return accountingCopy.actions.retrySync;
    }

    return options.hasPendingChanges ? '\u624b\u52a8\u540c\u6b65' : null;
  }

  if (status === 'failed') {
    return accountingCopy.actions.retrySync;
  }

  if (status === 'pending') {
    return accountingCopy.actions.syncNow;
  }

  return null;
}

/**
 * @param {Array<{ id: string, syncStatus: import('../types/accounting').SyncStatus, deletedAt?: string | null | undefined }>} transactions
 */
export function getSyncableTransactions(transactions) {
  return transactions.filter(
    (transaction) => transaction.syncStatus === 'pending' || transaction.syncStatus === 'failed'
  );
}

/**
 * @param {{ canSyncRemotely: boolean, syncableCount: number }} input
 * @returns {{ type: 'noop' | 'remote' | 'defer' }}
 */
export function getManualSyncPlan(input) {
  if (input.syncableCount <= 0) {
    return { type: 'noop' };
  }

  if (input.canSyncRemotely) {
    return { type: 'remote' };
  }

  return { type: 'defer' };
}

/**
 * @param {{ autoSyncEnabled: boolean, syncInFlight: boolean, syncableCount: number }} input
 */
export function shouldAutoSync(input) {
  return input.autoSyncEnabled && !input.syncInFlight && input.syncableCount > 0;
}

/**
 * @param {Array<{ id: string, syncStatus: import('../types/accounting').SyncStatus, deletedAt?: string | null | undefined }>} transactions
 */
export function getSyncableTransactions(transactions) {
  return transactions.filter(
    (transaction) => transaction.syncStatus === 'pending' || transaction.syncStatus === 'failed'
  );
}

/**
 * @param {{ autoSyncEnabled: boolean, syncInFlight: boolean, syncableCount: number }} input
 */
export function shouldAutoSync(input) {
  return input.autoSyncEnabled && !input.syncInFlight && input.syncableCount > 0;
}

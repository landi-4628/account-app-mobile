function createTimestamp() {
  return new Date().toISOString();
}

/**
 * @param {{
 *   transactionRepository: {
 *     saveTransaction: (transaction: Record<string, unknown>) => Promise<Record<string, unknown>>,
 *     listSyncCandidates: (limit?: number) => Promise<Array<Record<string, unknown>>>,
 *     markTransactionsSynced: (ids: string[], syncedAt: string) => Promise<void>,
 *     markTransactionsFailed: (failures: Array<{ id: string, error: string }>, failedAt: string) => Promise<void>,
 *   },
 *   syncRepository: {
 *     getSyncPreferences: () => Promise<{ autoSyncEnabled: boolean }>,
 *     saveSyncState: (state: Record<string, unknown>) => Promise<unknown>,
 *   },
 *   syncClient: {
 *     pushTransactions: (payload: { transactions: Array<Record<string, unknown>> }) => Promise<{ synced: Array<{ id: string }>, failed: Array<{ id: string, error: string }>, syncedAt: string }>,
 *   },
 *   now?: () => string,
 *   batchSize?: number,
 * }} input
 */
export function createSyncEngine(input) {
  const now = input.now ?? createTimestamp;
  const batchSize = input.batchSize ?? 100;

  return {
    async saveTransaction(transaction) {
      const saved = await input.transactionRepository.saveTransaction({
        ...transaction,
        syncStatus: transaction.syncStatus ?? 'pending',
        updatedAt: transaction.updatedAt ?? now(),
      });
      const preferences = await input.syncRepository.getSyncPreferences();

      if (preferences.autoSyncEnabled) {
        await this.syncPendingTransactions();
      }

      return saved;
    },

    async syncPendingTransactions() {
      const candidates = await input.transactionRepository.listSyncCandidates(batchSize);
      if (candidates.length === 0) {
        const syncedAt = now();
        await input.syncRepository.saveSyncState({
          lastSyncAt: syncedAt,
          pendingCount: 0,
          failedCount: 0,
        });
        return {
          syncedIds: [],
          failedIds: [],
          syncedAt,
        };
      }

      const syncedAt = now();

      try {
        const result = await input.syncClient.pushTransactions({ transactions: candidates });
        const syncedIds = result.synced.map((item) => item.id);
        const failed = result.failed.map((item) => ({
          id: item.id,
          error: item.error,
        }));
        const effectiveSyncedAt = result.syncedAt ?? syncedAt;

        await input.transactionRepository.markTransactionsSynced(syncedIds, effectiveSyncedAt);
        await input.transactionRepository.markTransactionsFailed(failed, effectiveSyncedAt);
        await input.syncRepository.saveSyncState({
          lastSyncAt: effectiveSyncedAt,
          pendingCount: 0,
          failedCount: failed.length,
        });

        return {
          syncedIds,
          failedIds: failed.map((item) => item.id),
          syncedAt: effectiveSyncedAt,
        };
      } catch (error) {
        const failedAt = syncedAt;
        const message = error instanceof Error ? error.message : 'sync_failed';
        const failures = candidates.map((candidate) => ({
          id: String(candidate.id),
          error: message,
        }));

        await input.transactionRepository.markTransactionsFailed(failures, failedAt);
        await input.syncRepository.saveSyncState({
          lastSyncAt: failedAt,
          pendingCount: 0,
          failedCount: failures.length,
        });

        throw error;
      }
    },
  };
}

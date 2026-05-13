/**
 * @param {{ apiClient: { post: (path: string, body: unknown, options?: Record<string, unknown>) => Promise<Record<string, unknown>> }, transactionsPath?: string }} input
 */
export function createSyncClient(input) {
  const transactionsPath = input.transactionsPath ?? '/mobile/sync/transactions';

  return {
    async pushTransactions(payload) {
      const response = await input.apiClient.post(transactionsPath, payload);

      return {
        synced: Array.isArray(response.synced) ? response.synced : [],
        failed: Array.isArray(response.failed) ? response.failed : [],
        syncedAt:
          typeof response.syncedAt === 'string'
            ? response.syncedAt
            : new Date().toISOString(),
      };
    },
  };
}

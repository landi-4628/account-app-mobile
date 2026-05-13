function createUpdatedAt(value) {
  return value ?? new Date().toISOString();
}

/**
 * @param {Record<string, unknown>} row
 */
function mapTransactionRow(row) {
  return {
    id: String(row.id),
    type: String(row.type),
    amount: Number(row.amount),
    categoryId: String(row.category_id),
    accountId: String(row.account_id),
    note: String(row.note ?? ''),
    transactionAt: String(row.transaction_at),
    syncStatus: String(row.sync_status),
    syncError: row.sync_error == null ? null : String(row.sync_error),
    syncedAt: row.synced_at == null ? null : String(row.synced_at),
    updatedAt: String(row.updated_at),
    deletedAt: row.deleted_at == null ? null : String(row.deleted_at),
  };
}

/**
 * @param {{ runAsync: (sql: string, ...params: unknown[]) => Promise<unknown>, getAllAsync: (sql: string, ...params: unknown[]) => Promise<Record<string, unknown>[]> }} database
 */
export function createTransactionRepository(database) {
  return {
    async saveTransaction(transaction) {
      const record = {
        ...transaction,
        note: transaction.note ?? '',
        syncStatus: transaction.syncStatus ?? 'pending',
        syncError: transaction.syncError ?? null,
        syncedAt: transaction.syncedAt ?? null,
        updatedAt: createUpdatedAt(transaction.updatedAt),
        deletedAt: transaction.deletedAt ?? null,
      };

      await database.runAsync(
        `INSERT OR REPLACE INTO transactions (
          id,
          type,
          amount,
          category_id,
          account_id,
          note,
          transaction_at,
          sync_status,
          sync_error,
          synced_at,
          updated_at,
          deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        record.id,
        record.type,
        record.amount,
        record.categoryId,
        record.accountId,
        record.note,
        record.transactionAt,
        record.syncStatus,
        record.syncError,
        record.syncedAt,
        record.updatedAt,
        record.deletedAt
      );

      return record;
    },

    async saveTransactions(transactions) {
      /** @type {unknown[]} */
      const records = [];

      for (const transaction of transactions) {
        records.push(await this.saveTransaction(transaction));
      }

      return records;
    },

    async listTransactions() {
      const rows = await database.getAllAsync(
        `SELECT
          id,
          type,
          amount,
          category_id,
          account_id,
          note,
          transaction_at,
          sync_status,
          sync_error,
          synced_at,
          updated_at,
          deleted_at
        FROM transactions
        WHERE deleted_at IS NULL
        ORDER BY transaction_at DESC, updated_at DESC;`
      );

      return rows.map(mapTransactionRow);
    },

    async listSyncCandidates(limit = 50) {
      const rows = await database.getAllAsync(
        `SELECT
          id,
          type,
          amount,
          category_id,
          account_id,
          note,
          transaction_at,
          sync_status,
          sync_error,
          synced_at,
          updated_at,
          deleted_at
        FROM transactions
        WHERE deleted_at IS NULL
          AND sync_status IN ('pending', 'failed')
        ORDER BY updated_at ASC
        LIMIT ?;`,
        limit
      );

      return rows.map(mapTransactionRow);
    },

    async markTransactionsSynced(ids, syncedAt) {
      if (ids.length === 0) {
        return;
      }

      for (const id of ids) {
        await database.runAsync(
          `UPDATE transactions SET sync_status = 'synced', sync_error = NULL, synced_at = ?, updated_at = ? WHERE id = ?;`,
          syncedAt,
          syncedAt,
          id
        );
      }
    },

    async markTransactionsFailed(failures, failedAt) {
      if (failures.length === 0) {
        return;
      }

      for (const failure of failures) {
        await database.runAsync(
          `UPDATE transactions SET sync_status = 'failed', sync_error = ?, updated_at = ? WHERE id = ?;`,
          failure.error,
          failedAt,
          failure.id
        );
      }
    },
  };
}

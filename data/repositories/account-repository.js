function toBooleanFlag(value) {
  return value === true || value === 1;
}

/**
 * @param {Record<string, unknown>} row
 */
function mapAccountRow(row) {
  return {
    id: String(row.id),
    name: String(row.name),
    type: String(row.type),
    initialBalance: Number(row.initial_balance ?? 0),
    currentBalance: Number(row.current_balance ?? 0),
    isActive: toBooleanFlag(row.is_active),
    isCustom: toBooleanFlag(row.is_custom),
    updatedAt: String(row.updated_at),
    deletedAt: row.deleted_at == null ? null : String(row.deleted_at),
  };
}

/**
 * @param {{ runAsync: (sql: string, ...params: unknown[]) => Promise<unknown>, getAllAsync: (sql: string, ...params: unknown[]) => Promise<Record<string, unknown>[]> }} database
 */
export function createAccountRepository(database) {
  return {
    async listAccounts() {
      const rows = await database.getAllAsync(
        `SELECT
          id,
          name,
          type,
          initial_balance,
          current_balance,
          is_active,
          is_custom,
          updated_at,
          deleted_at
        FROM accounts
        WHERE deleted_at IS NULL
        ORDER BY name COLLATE NOCASE ASC;`
      );

      return rows.map(mapAccountRow);
    },

    async saveAccount(account) {
      await database.runAsync(
        `INSERT OR REPLACE INTO accounts (
          id,
          name,
          type,
          initial_balance,
          current_balance,
          is_active,
          is_custom,
          updated_at,
          deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        account.id,
        account.name,
        account.type,
        account.initialBalance ?? 0,
        account.currentBalance ?? account.initialBalance ?? 0,
        account.isActive === false ? 0 : 1,
        account.isCustom === true ? 1 : 0,
        account.updatedAt,
        account.deletedAt ?? null
      );

      return account;
    },

    async saveAccounts(accounts) {
      for (const account of accounts) {
        await this.saveAccount(account);
      }

      return accounts;
    },
  };
}

/**
 * @param {unknown} value
 */
function toBooleanFlag(value) {
  return value === true || value === 1;
}

/**
 * @param {Record<string, unknown>} row
 */
export function mapAccountRow(row) {
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
    remoteId: row.remote_id == null || row.remote_id === '' ? undefined : String(row.remote_id),
    ownerUserId: row.owner_user_id == null || row.owner_user_id === '' ? undefined : String(row.owner_user_id),
  };
}

/**
 * @param {{
 *   id: string,
 *   name: string,
 *   type: string,
 *   initialBalance?: number,
 *   currentBalance?: number,
 *   isActive?: boolean,
 *   isCustom?: boolean,
 *   updatedAt: string,
 *   deletedAt?: string | null,
 *   remoteId?: string | null,
 *   ownerUserId: string,
 * }} account
 */
export function toAccountInsertRow(account) {
  return {
    id: account.id,
    name: account.name,
    type: account.type,
    initialBalance: account.initialBalance ?? 0,
    currentBalance: account.currentBalance ?? account.initialBalance ?? 0,
    isActive: account.isActive !== false,
    isCustom: account.isCustom === true,
    updatedAt: account.updatedAt,
    deletedAt: account.deletedAt ?? null,
    remoteId: account.remoteId ?? null,
    ownerUserId: account.ownerUserId,
  };
}

/**
 * @param {{ runAsync: (sql: string, ...params: unknown[]) => Promise<unknown>, getAllAsync: (sql: string, ...params: unknown[]) => Promise<Record<string, unknown>[]> }} database
 */
export function createAccountRepository(database) {
  return {
    /**
     * @param {string} ownerUserId
     */
    async listAccounts(ownerUserId) {
      if (!ownerUserId) {
        return [];
      }

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
          deleted_at,
          remote_id,
          owner_user_id
        FROM accounts
        WHERE deleted_at IS NULL AND owner_user_id = ?
        ORDER BY name COLLATE NOCASE ASC;`,
        ownerUserId
      );

      return rows.map(mapAccountRow);
    },

    /**
     * @param {string} id
     * @param {string} ownerUserId
     */
    async getAccountById(id, ownerUserId) {
      if (!ownerUserId) {
        return null;
      }

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
          deleted_at,
          remote_id,
          owner_user_id
        FROM accounts
        WHERE id = ? AND owner_user_id = ?
        LIMIT 1;`,
        id,
        ownerUserId
      );

      const row = rows[0];
      if (!row) {
        return null;
      }

      return mapAccountRow(row);
    },

    /**
     * @param {ReturnType<typeof toAccountInsertRow>} account
     */
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
          deleted_at,
          remote_id,
          owner_user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        account.id,
        account.name,
        account.type,
        account.initialBalance ?? 0,
        account.currentBalance ?? account.initialBalance ?? 0,
        account.isActive === false ? 0 : 1,
        account.isCustom === true ? 1 : 0,
        account.updatedAt,
        account.deletedAt ?? null,
        account.remoteId ?? null,
        account.ownerUserId
      );

      return account;
    },

    /**
     * @param {any[]} accounts
     */
    async saveAccounts(accounts) {
      for (const account of accounts) {
        await this.saveAccount(/** @type {any} */ (account));
      }

      return accounts;
    },

    /**
     * @param {string} id
     * @param {string} deletedAtIso
     * @param {string} ownerUserId
     */
    async softDeleteAccount(id, deletedAtIso, ownerUserId) {
      if (!ownerUserId) {
        return;
      }

      await database.runAsync(
        `UPDATE accounts
        SET deleted_at = ?, updated_at = ?, is_active = 0
        WHERE id = ? AND owner_user_id = ?;`,
        deletedAtIso,
        deletedAtIso,
        id,
        ownerUserId
      );
    },
  };
}

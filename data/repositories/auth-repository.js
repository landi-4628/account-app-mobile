/**
 * @typedef {object} AuthSession
 * @property {string} userId
 * @property {string} accessToken
 * @property {string | null | undefined} [refreshToken]
 * @property {string} encryptionKey
 * @property {string} expiresAt
 * @property {string} updatedAt
 */

/**
 * @param {{ runAsync: (sql: string, ...params: unknown[]) => Promise<unknown>, getFirstAsync: (sql: string, ...params: unknown[]) => Promise<Record<string, unknown> | null> }} database
 */
export function createAuthRepository(database) {
  return {
    /**
     * @param {AuthSession} session
     */
    async saveSession(session) {
      await database.runAsync(
        `INSERT OR REPLACE INTO auth_session (
          id,
          user_id,
          access_token,
          refresh_token,
          encryption_key,
          expires_at,
          updated_at
        ) VALUES (1, ?, ?, ?, ?, ?, ?);`,
        session.userId,
        session.accessToken,
        session.refreshToken ?? null,
        session.encryptionKey,
        session.expiresAt,
        session.updatedAt
      );

      return session;
    },

    /** @returns {Promise<AuthSession | null>} */
    async getSession() {
      const row = await database.getFirstAsync(
        `SELECT
          user_id,
          access_token,
          refresh_token,
          encryption_key,
          expires_at,
          updated_at
        FROM auth_session
        WHERE id = 1
        LIMIT 1;`
      );

      if (!row) {
        return null;
      }

      return {
        userId: String(row.user_id),
        accessToken: String(row.access_token),
        refreshToken: row.refresh_token == null ? null : String(row.refresh_token),
        encryptionKey: String(row.encryption_key),
        expiresAt: String(row.expires_at),
        updatedAt: String(row.updated_at),
      };
    },

    async clearSession() {
      await database.runAsync('DELETE FROM auth_session WHERE id = 1;');
    },
  };
}

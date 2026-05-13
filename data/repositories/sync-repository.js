function createUpdatedAt(value) {
  return value ?? new Date().toISOString();
}

/**
 * @param {{ runAsync: (sql: string, ...params: unknown[]) => Promise<unknown>, getFirstAsync: (sql: string, ...params: unknown[]) => Promise<Record<string, unknown> | null> }} database
 */
export function createSyncRepository(database) {
  return {
    async getSyncPreferences() {
      const row = await database.getFirstAsync(
        `SELECT auto_sync_enabled FROM sync_state WHERE id = 'default' LIMIT 1;`
      );

      return {
        autoSyncEnabled: row?.auto_sync_enabled === 1 || row?.auto_sync_enabled === true,
      };
    },

    async saveSyncPreferences(preferences) {
      const updatedAt = createUpdatedAt(preferences.updatedAt);

      await database.runAsync(
        `INSERT INTO sync_state (
          id,
          auto_sync_enabled,
          last_sync_at,
          pending_count,
          failed_count,
          updated_at
        ) VALUES ('default', ?, NULL, 0, 0, ?)
        ON CONFLICT(id) DO UPDATE SET
          auto_sync_enabled = excluded.auto_sync_enabled,
          updated_at = excluded.updated_at;`,
        preferences.autoSyncEnabled === true ? 1 : 0,
        updatedAt
      );

      return {
        autoSyncEnabled: preferences.autoSyncEnabled === true,
        updatedAt,
      };
    },

    async getSyncState() {
      const row = await database.getFirstAsync(
        `SELECT auto_sync_enabled, last_sync_at, pending_count, failed_count, updated_at
        FROM sync_state
        WHERE id = 'default'
        LIMIT 1;`
      );

      return {
        autoSyncEnabled: row?.auto_sync_enabled === 1 || row?.auto_sync_enabled === true,
        lastSyncAt: row?.last_sync_at == null ? null : String(row.last_sync_at),
        pendingCount: Number(row?.pending_count ?? 0),
        failedCount: Number(row?.failed_count ?? 0),
        updatedAt: row?.updated_at == null ? null : String(row.updated_at),
      };
    },

    async saveSyncState(state) {
      const updatedAt = createUpdatedAt(state.updatedAt ?? state.lastSyncAt);

      await database.runAsync(
        `INSERT INTO sync_state (
          id,
          auto_sync_enabled,
          last_sync_at,
          pending_count,
          failed_count,
          updated_at
        ) VALUES ('default', ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          auto_sync_enabled = excluded.auto_sync_enabled,
          last_sync_at = excluded.last_sync_at,
          pending_count = excluded.pending_count,
          failed_count = excluded.failed_count,
          updated_at = excluded.updated_at;`,
        state.autoSyncEnabled === true ? 1 : 0,
        state.lastSyncAt ?? null,
        state.pendingCount ?? 0,
        state.failedCount ?? 0,
        updatedAt
      );

      return {
        autoSyncEnabled: state.autoSyncEnabled === true,
        lastSyncAt: state.lastSyncAt ?? null,
        pendingCount: state.pendingCount ?? 0,
        failedCount: state.failedCount ?? 0,
        updatedAt,
      };
    },
  };
}

import {
  SQLITE_SCHEMA_VERSION,
  SQLITE_TABLE_DEFINITIONS,
} from './schema.js';

export const SQLITE_MIGRATIONS = [
  {
    version: 1,
    statements: [
      ...SQLITE_TABLE_DEFINITIONS.map((definition) => definition.sql),
      `INSERT OR IGNORE INTO sync_state (
        id,
        auto_sync_enabled,
        last_sync_at,
        pending_count,
        failed_count,
        updated_at
      ) VALUES ('default', 0, NULL, 0, 0, '1970-01-01T00:00:00.000Z');`,
    ],
  },
  {
    version: 2,
    statements: [
      'ALTER TABLE accounts ADD COLUMN remote_id TEXT;',
      'ALTER TABLE categories ADD COLUMN remote_id TEXT;',
      'ALTER TABLE categories ADD COLUMN color TEXT;',
    ],
  },
  {
    version: 3,
    statements: [
      'ALTER TABLE accounts ADD COLUMN owner_user_id TEXT;',
      'ALTER TABLE categories ADD COLUMN owner_user_id TEXT;',
    ],
  },
];

/**
 * @param {{ getFirstAsync: (sql: string) => Promise<Record<string, unknown> | null>, execAsync: (sql: string) => Promise<unknown> }} database
 * @returns {Promise<number>}
 */
export async function applySqliteMigrations(database) {
  const versionRow = await database.getFirstAsync('PRAGMA user_version;');
  const currentVersion = Number(versionRow?.user_version ?? versionRow?.userVersion ?? 0);

  for (const migration of SQLITE_MIGRATIONS) {
    if (migration.version <= currentVersion) {
      continue;
    }

    for (const statement of migration.statements) {
      await database.execAsync(statement);
    }

    await database.execAsync(`PRAGMA user_version = ${migration.version};`);
  }

  return SQLITE_SCHEMA_VERSION;
}

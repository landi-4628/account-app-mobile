import { applySqliteMigrations } from './migrations.js';

export const APP_SQLITE_DATABASE_NAME = 'account-app-ledger.db';

/**
 * @param {{ getFirstAsync: (sql: string) => Promise<Record<string, unknown> | null>, execAsync: (sql: string) => Promise<unknown> }} database
 * @returns {Promise<void>}
 */
export async function initializeAppDatabase(database) {
  await applySqliteMigrations(database);
}

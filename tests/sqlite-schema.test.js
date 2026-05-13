import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SQLITE_SCHEMA_VERSION,
  SQLITE_TABLE_DEFINITIONS,
} from '../data/sqlite/schema.js';
import {
  SQLITE_MIGRATIONS,
  applySqliteMigrations,
} from '../data/sqlite/migrations.js';

test('defines the core SQLite tables for auth, ledger data, transactions, and sync state', () => {
  assert.equal(SQLITE_SCHEMA_VERSION, SQLITE_MIGRATIONS.length);
  assert.equal(SQLITE_SCHEMA_VERSION, 4);
  assert.deepEqual(
    SQLITE_TABLE_DEFINITIONS.map((definition) => definition.name),
    ['auth_session', 'categories', 'transactions', 'sync_state']
  );
  assert.match(
    SQLITE_TABLE_DEFINITIONS.find((definition) => definition.name === 'transactions')?.sql ?? '',
    /sync_status/i
  );
});

test('applies pending migrations in version order and updates user_version', async () => {
  /** @type {string[]} */
  const executed = [];
  const database = {
    async getFirstAsync(sql) {
      executed.push(sql);
      return { user_version: 0 };
    },
    async execAsync(sql) {
      executed.push(sql);
    },
  };

  const appliedVersion = await applySqliteMigrations(database);

  assert.equal(appliedVersion, SQLITE_SCHEMA_VERSION);
  assert.equal(executed[0], 'PRAGMA user_version;');
  assert.match(executed.at(-1) ?? '', new RegExp(`PRAGMA user_version = ${SQLITE_SCHEMA_VERSION}`));
  assert.ok(
    executed.some((sql) => sql.includes('CREATE TABLE IF NOT EXISTS transactions')),
    'expected transactions table migration to execute'
  );
  assert.ok(
    executed.some((sql) => sql.includes('DROP TABLE IF EXISTS accounts')),
    'expected migration to drop legacy accounts table when upgrading'
  );
});

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  APP_SQLITE_DATABASE_NAME,
  initializeAppDatabase,
} from '../data/sqlite/bootstrap.js';
import { SQLITE_SCHEMA_VERSION } from '../data/sqlite/schema.js';

test('uses a dedicated app database name for ledger tables', () => {
  assert.equal(APP_SQLITE_DATABASE_NAME, 'account-app-ledger.db');
});

test('initializes the app database by applying sqlite migrations', async () => {
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

  await initializeAppDatabase(database);
  assert.equal(executed[0], 'PRAGMA user_version;');
  assert.match(executed.at(-1) ?? '', new RegExp(`PRAGMA user_version = ${SQLITE_SCHEMA_VERSION}`));
});

export const SQLITE_TABLE_DEFINITIONS = [
  {
    name: 'auth_session',
    sql: `CREATE TABLE IF NOT EXISTS auth_session (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      user_id TEXT NOT NULL,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      encryption_key TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,
  },
  {
    name: 'categories',
    sql: `CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      is_custom INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );`,
  },
  {
    name: 'transactions',
    sql: `CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      category_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      transaction_at TEXT NOT NULL,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      sync_error TEXT,
      synced_at TEXT,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );`,
  },
  {
    name: 'sync_state',
    sql: `CREATE TABLE IF NOT EXISTS sync_state (
      id TEXT PRIMARY KEY NOT NULL,
      auto_sync_enabled INTEGER NOT NULL DEFAULT 0,
      last_sync_at TEXT,
      pending_count INTEGER NOT NULL DEFAULT 0,
      failed_count INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );`,
  },
];

export const SQLITE_SCHEMA_VERSION = 4;

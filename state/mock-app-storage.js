import {
  parsePersistedCustomDefinitions,
} from './mock-app-persistence-support.js';
import { parseMockAppSnapshot } from './mock-app-snapshot.js';

/**
 * @typedef {{
 *   getItem: (key: string) => Promise<string | null>,
 *   setItem: (key: string, value: string) => Promise<void>,
 *   removeItem?: ((key: string) => Promise<void>) | undefined,
 * }} StorageLike
 */

/**
 * @typedef {import('../data/repositories/auth-repository.js').AuthSession} AuthSession
 */

/**
 * @param {StorageLike} storage
 */
export function createMockAppStorageAdapter(storage) {
  return {
    /**
     * @param {string} key
     */
    async readCustomDefinitions(key) {
      try {
        const raw = await storage.getItem(key);
        return parsePersistedCustomDefinitions(raw);
      } catch {
        return { categories: [], accounts: [] };
      }
    },

    /**
     * @param {string} key
     * @param {{ categories: import('../types/accounting').LedgerCategory[], accounts: import('../types/accounting').LedgerAccount[] }} value
     */
    async writeCustomDefinitions(key, value) {
      try {
        await storage.setItem(key, JSON.stringify(value));
      } catch {
        // Storage is optional in the mock app runtime. Ignore unavailable native modules.
      }
    },

    /**
     * @param {string} key
     * @returns {Promise<{ autoSyncEnabled: boolean }>}
     */
    async readSyncPreferences(key) {
      try {
        const raw = await storage.getItem(key);
        if (!raw) {
          return { autoSyncEnabled: true };
        }

        const parsed = JSON.parse(raw);
        return {
          autoSyncEnabled: parsed?.autoSyncEnabled === true,
        };
      } catch {
        return { autoSyncEnabled: false };
      }
    },

    /**
     * @param {string} key
     * @param {{ autoSyncEnabled: boolean }} value
     */
    async writeSyncPreferences(key, value) {
      try {
        await storage.setItem(
          key,
          JSON.stringify({
            autoSyncEnabled: value.autoSyncEnabled === true,
          })
        );
      } catch {
        // Storage is optional in the mock app runtime. Ignore unavailable native modules.
      }
    },

    /**
     * @param {string} key
     * @returns {Promise<import('./mock-app-snapshot.js').MockAppSnapshot | null>}
     */
    async readAppSnapshot(key) {
      try {
        const raw = await storage.getItem(key);
        return parseMockAppSnapshot(raw);
      } catch {
        return null;
      }
    },

    /**
     * @param {string} key
     * @param {import('./mock-app-snapshot.js').MockAppSnapshot} value
     */
    async writeAppSnapshot(key, value) {
      try {
        await storage.setItem(key, JSON.stringify(value));
      } catch {
        // Storage is optional in the mock app runtime. Ignore unavailable native modules.
      }
    },

    /**
     * @param {string} key
     * @returns {Promise<AuthSession | null>}
     */
    async readAuthSession(key) {
      try {
        const raw = await storage.getItem(key);
        if (!raw) {
          return null;
        }

        const parsed = JSON.parse(raw);
        if (
          !parsed ||
          typeof parsed.userId !== 'string' ||
          typeof parsed.accessToken !== 'string' ||
          typeof parsed.encryptionKey !== 'string' ||
          typeof parsed.expiresAt !== 'string' ||
          typeof parsed.updatedAt !== 'string'
        ) {
          return null;
        }

        return {
          userId: parsed.userId,
          accessToken: parsed.accessToken,
          refreshToken: parsed.refreshToken == null ? null : String(parsed.refreshToken),
          encryptionKey: parsed.encryptionKey,
          expiresAt: parsed.expiresAt,
          updatedAt: parsed.updatedAt,
        };
      } catch {
        return null;
      }
    },

    /**
     * @param {string} key
     * @param {AuthSession} value
     */
    async writeAuthSession(key, value) {
      try {
        await storage.setItem(key, JSON.stringify(value));
      } catch {
        // Storage is optional in the mock app runtime. Ignore unavailable native modules.
      }
    },

    /**
     * @param {string} key
     */
    async clearAuthSession(key) {
      try {
        if (typeof storage.removeItem === 'function') {
          await storage.removeItem(key);
          return;
        }

        await storage.setItem(key, '');
      } catch {
        // Storage is optional in the mock app runtime. Ignore unavailable native modules.
      }
    },
  };
}

export function createNoopStorageAdapter() {
  return {
    async readCustomDefinitions() {
      return { categories: [], accounts: [] };
    },
    async writeCustomDefinitions() {},
    async readSyncPreferences() {
      return { autoSyncEnabled: false };
    },
    async writeSyncPreferences() {},
    async readAppSnapshot() {
      return null;
    },
    async writeAppSnapshot() {},
    async readAuthSession() {
      return null;
    },
    async writeAuthSession() {},
    async clearAuthSession() {},
  };
}

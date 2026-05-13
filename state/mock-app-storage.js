import {
  parsePersistedCustomDefinitions,
} from './mock-app-persistence-support.js';
import { parseMockAppSnapshot } from './mock-app-snapshot.js';

/**
 * @typedef {{
 *   getItem: (key: string) => Promise<string | null>,
 *   setItem: (key: string, value: string) => Promise<void>,
 * }} StorageLike
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
          return { autoSyncEnabled: false };
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
  };
}

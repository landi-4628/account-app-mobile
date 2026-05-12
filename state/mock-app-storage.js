import {
  parsePersistedCustomDefinitions,
} from './mock-app-persistence-support.js';

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
  };
}

export function createNoopStorageAdapter() {
  return {
    async readCustomDefinitions() {
      return { categories: [], accounts: [] };
    },
    async writeCustomDefinitions() {},
  };
}

import { SQLiteStorage } from 'expo-sqlite/kv-store';

import { createMockAppStorageAdapter } from './mock-app-storage.js';

export const mockAppRuntimeStorage = new SQLiteStorage('account-app-mobile.db');

export const mockAppRuntimeStorageAdapter = createMockAppStorageAdapter(mockAppRuntimeStorage);

import { SQLiteStorage } from 'expo-sqlite/kv-store';

import { createMockAppStorageAdapter } from './mock-app-storage.js';

export const MOCK_APP_RUNTIME_STORAGE_DATABASE_NAME = 'account-app-mobile-kv.db';

export const mockAppRuntimeStorage = new SQLiteStorage(MOCK_APP_RUNTIME_STORAGE_DATABASE_NAME);

export const mockAppRuntimeStorageAdapter = createMockAppStorageAdapter(mockAppRuntimeStorage);

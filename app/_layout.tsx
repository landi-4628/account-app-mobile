import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  APP_SQLITE_DATABASE_NAME,
  initializeAppDatabase,
} from '@/data/sqlite/bootstrap.js';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MockAppProvider } from '@/providers/mock-app-provider';

export const unstable_settings = {
  anchor: '(tabs)',
};

const stackTitles = {
  login: '\u767b\u5f55',
  register: '\u6ce8\u518c',
  profile: '\u4e2a\u4eba\u8d44\u6599',
  editProfile: '\u7f16\u8f91\u4e2a\u4eba\u4fe1\u606f',
  changePassword: '\u4fee\u6539\u5bc6\u7801',
  accounts: '\u8d26\u6237\u7ba1\u7406',
  categories: '\u5206\u7c7b\u7ba1\u7406',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SQLiteProvider databaseName={APP_SQLITE_DATABASE_NAME} onInit={initializeAppDatabase}>
      <MockAppProvider>
        <SafeAreaProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="auth/login" options={{ title: stackTitles.login }} />
              <Stack.Screen name="auth/register" options={{ title: stackTitles.register }} />
              <Stack.Screen name="profile" options={{ title: stackTitles.profile }} />
              <Stack.Screen name="profile/edit" options={{ title: stackTitles.editProfile }} />
              <Stack.Screen name="profile/change-password" options={{ title: stackTitles.changePassword }} />
              <Stack.Screen name="accounts" options={{ title: stackTitles.accounts }} />
              <Stack.Screen name="categories" options={{ title: stackTitles.categories }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </SafeAreaProvider>
      </MockAppProvider>
    </SQLiteProvider>
  );
}

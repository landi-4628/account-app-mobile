import React, { useMemo } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import {
  AccountingScreen,
  InfoBanner,
  ManagementRow,
  SectionHeader,
  SurfaceCard,
} from '@/components/accounting';
import {
  buildCapabilityNotice,
  getActionAvailability,
} from '@/components/accounting/management-screen-support';
import { useAccountingTheme } from '@/components/accounting/use-accounting-theme';
import { useMockApp } from '@/providers/mock-app-provider';

function QuickLinkSection({ title, rows }) {
  const { spacing } = useAccountingTheme();

  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={sectionTitleStyle(useAccountingTheme())}>{title}</Text>
      <View style={{ gap: spacing.sm }}>
        {rows.map((row) => (
          <ManagementRow key={row.title} {...row} />
        ))}
      </View>
    </View>
  );
}

function sectionTitleStyle(theme) {
  return {
    fontSize: theme.typography.bodyLarge,
    fontWeight: '700',
    color: theme.colors.text,
  };
}

export default function ProfileHubScreen() {
  const router = useRouter();
  const { user, accountSummaries, actions, syncSummary, autoSyncEnabled } = useMockApp();
  const theme = useAccountingTheme();
  const styles = createStyles(theme);
  const availability = useMemo(() => getActionAvailability(actions), [actions]);
  const activeAccountCount = accountSummaries.filter((account) => account.isActive).length;

  const settingsRows = [
    {
      title: 'Edit profile',
      subtitle: 'Name, email, ledger, timezone, and default account',
      meta: availability.canUpdateProfile ? 'Available' : 'Unavailable',
      badge: availability.canUpdateProfile ? null : { label: 'Later', tone: 'warning' },
      disabled: !availability.canUpdateProfile,
      onPress: () => router.push('/profile/edit'),
    },
    {
      title: 'Change password',
      subtitle: 'Update your sign-in password',
      meta: availability.canChangePassword ? 'Available' : 'Unavailable',
      badge: availability.canChangePassword ? null : { label: 'Later', tone: 'warning' },
      disabled: !availability.canChangePassword,
      onPress: () => router.push('/profile/change-password'),
    },
    {
      title: 'Accounts',
      subtitle: `${activeAccountCount} active accounts`,
      meta: 'Manage',
      onPress: () => router.push('/accounts'),
    },
    {
      title: 'Categories',
      subtitle: 'Review income and expense categories',
      meta: 'Manage',
      onPress: () => router.push('/categories'),
    },
  ];

  const authRows = [
    {
      title: 'Login',
      subtitle: 'Connect the sign-in flow when the provider exposes it',
      meta: availability.canLogin ? 'Ready' : 'Unavailable',
      badge: availability.canLogin ? null : { label: 'Later', tone: 'warning' },
      disabled: !availability.canLogin,
      onPress: () => router.push('/auth/login'),
    },
    {
      title: 'Register',
      subtitle: 'Create a new account when registration is wired',
      meta: availability.canRegister ? 'Ready' : 'Unavailable',
      badge: availability.canRegister ? null : { label: 'Later', tone: 'warning' },
      disabled: !availability.canRegister,
      onPress: () => router.push('/auth/register'),
    },
  ];

  const capabilityNotice =
    buildCapabilityNotice('profileEdit', availability)
    ?? buildCapabilityNotice('passwordChange', availability)
    ?? buildCapabilityNotice('login', availability);

  return (
    <>
      <Stack.Screen options={{ title: 'Profile' }} />
      <AccountingScreen>
        <SectionHeader
          title="Profile"
          subtitle="Workspace details, sign-in routes, and management screens"
        />
        <SurfaceCard style={styles.card}>
          <Text style={styles.name}>{user.name}</Text>
          <View style={styles.summaryList}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Email</Text>
              <Text style={styles.summaryValue}>{user.email}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Ledger</Text>
              <Text style={styles.summaryValue}>{user.ledgerName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Timezone</Text>
              <Text style={styles.summaryValue}>{user.timezone}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sync mode</Text>
              <Text style={styles.summaryValue}>
                {autoSyncEnabled ? 'Auto sync enabled' : 'Local-first, manual sync'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pending sync</Text>
              <Text style={styles.summaryValue}>{String(syncSummary.pendingCount)}</Text>
            </View>
          </View>
        </SurfaceCard>
        {capabilityNotice ? (
          <InfoBanner
            tone={capabilityNotice.tone}
            title="Some account features are not wired in this provider yet"
            description="The screens stay available for navigation, but actions that rely on missing provider methods remain disabled."
          />
        ) : null}
        <QuickLinkSection title="Workspace" rows={settingsRows} />
        <QuickLinkSection title="Authentication" rows={authRows} />
      </AccountingScreen>
    </>
  );
}

function createStyles({ colors, spacing, typography }) {
  return StyleSheet.create({
    card: {
      gap: spacing.md,
    },
    name: {
      fontSize: typography.title,
      fontWeight: '700',
      color: colors.text,
    },
    summaryList: {
      gap: spacing.sm,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    summaryLabel: {
      fontSize: typography.body,
      color: colors.textSecondary,
    },
    summaryValue: {
      flex: 1,
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'right',
    },
  });
}

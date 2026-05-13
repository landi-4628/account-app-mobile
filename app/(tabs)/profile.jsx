import React from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { accountingCopy } from '@/constants/accounting-copy';
import {
  AccountingScreen,
  InteractiveCard,
  SectionHeader,
  SyncSummaryRow,
} from '@/components/accounting';
import { buildProfileOverviewLinks } from '@/components/accounting/profile-screen-support';
import {
  getSyncSummaryDetail,
} from '@/components/accounting/statistics-profile-support';
import { useAccountingTheme } from '@/components/accounting/use-accounting-theme';
import { useMockApp } from '@/providers/mock-app-provider';

const copy = {
  title: '\u6211\u7684',
  subtitle: '\u4e2a\u4eba\u8d44\u6599\u3001\u540c\u6b65\u72b6\u6001\u548c\u5e38\u7528\u5165\u53e3',
  profileCardSubtitle: '\u67e5\u770b\u8d44\u6599\u3001\u8d26\u672c\u548c\u540c\u6b65\u8bbe\u7f6e',
  tools: '\u5e38\u7528\u529f\u80fd',
};

function ProfileEntryCard({ title, subtitle, rows, onPress }) {
  const { colors, spacing, radius, typography, shadow } = useAccountingTheme();
  const styles = createStyles(colors, spacing, radius, typography, shadow);

  return (
    <InteractiveCard
      accessibilityRole="button"
      onPress={onPress}
      style={styles.card}
      shadowStyle={shadow.card}>
      <View style={styles.profileEntryHeader}>
        <View style={styles.profileEntryCopy}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.profileEntrySubtitle}>{subtitle}</Text>
        </View>
        <Text style={styles.profileEntryArrow}>{'>'}</Text>
      </View>
      <View style={styles.infoList}>
        {rows.map((row) => (
          <View key={row.label} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{row.label}</Text>
            <Text style={styles.infoValue}>{row.value}</Text>
          </View>
        ))}
      </View>
    </InteractiveCard>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, syncSummary, autoSyncEnabled } = useMockApp();
  const { colors, spacing, radius, typography, shadow } = useAccountingTheme();
  const styles = createStyles(colors, spacing, radius, typography, shadow);

  const profileEntryRows = [
    { label: accountingCopy.profile.ledger, value: user.ledgerName },
    { label: accountingCopy.profile.email, value: user.email },
  ];
  const managementRows = buildProfileOverviewLinks();

  return (
    <AccountingScreen>
      <SectionHeader title={copy.title} subtitle={copy.subtitle} />
      <ProfileEntryCard
        title={user.name}
        subtitle={copy.profileCardSubtitle}
        rows={profileEntryRows}
        onPress={() => router.push('/profile')}
      />
      <SyncSummaryRow
        status={syncSummary.status}
        pendingCount={syncSummary.pendingCount}
        failedCount={syncSummary.failedCount}
        label={accountingCopy.profile.syncStatus}
        detail={getSyncSummaryDetail(syncSummary, user.timezone, { isAutoSyncEnabled: autoSyncEnabled })}
      />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{copy.tools}</Text>
        <View style={styles.sectionBody}>
          {managementRows.map((row) => (
            <ProfileEntryCard
              key={row.title}
              title={row.title}
              subtitle={row.subtitle}
              rows={[]}
              onPress={() => router.push(row.href)}
            />
          ))}
        </View>
      </View>
    </AccountingScreen>
  );
}

function createStyles(colors, spacing, radius, typography, shadow) {
  return StyleSheet.create({
    card: {
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.md,
      ...shadow.card,
    },
    cardTitle: {
      fontSize: typography.title,
      fontWeight: '700',
      color: colors.text,
    },
    profileEntryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    profileEntryCopy: {
      flex: 1,
      gap: 4,
    },
    profileEntrySubtitle: {
      fontSize: typography.body,
      color: colors.textSecondary,
    },
    profileEntryArrow: {
      fontSize: typography.title,
      fontWeight: '700',
      color: colors.textMuted,
    },
    infoList: {
      gap: spacing.sm,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    infoLabel: {
      fontSize: typography.body,
      color: colors.textSecondary,
    },
    infoValue: {
      flex: 1,
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'right',
    },
    section: {
      gap: spacing.md,
    },
    sectionTitle: {
      fontSize: typography.title,
      fontWeight: '700',
      color: colors.text,
    },
    sectionBody: {
      gap: spacing.sm,
    },
  });
}

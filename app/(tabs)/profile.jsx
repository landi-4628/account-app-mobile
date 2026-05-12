import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { accountingCopy } from '@/constants/accounting-copy';
import {
  AccountSummaryRow,
  AccountingScreen,
  InteractiveCard,
  SectionHeader,
  SyncSummaryRow,
} from '@/components/accounting';
import {
  getAccountTypeLabel,
  getSyncActionLabel,
  getSyncSummaryDetail,
} from '@/components/accounting/statistics-profile-support';
import { useAccountingTheme } from '@/components/accounting/use-accounting-theme';
import { useMockApp } from '@/providers/mock-app-provider';

function InfoCard({ title, rows }) {
  const { colors, spacing, radius, typography, shadow } = useAccountingTheme();
  const styles = createStyles(colors, spacing, radius, typography, shadow);

  return (
    <InteractiveCard style={styles.card} shadowStyle={shadow.card}>
      <Text style={styles.cardTitle}>{title}</Text>
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

function getSyncTargetTransaction(transactions) {
  return (
    transactions.find((transaction) => transaction.syncStatus === 'failed') ??
    transactions.find((transaction) => transaction.syncStatus === 'pending') ??
    null
  );
}

export default function ProfileScreen() {
  const { user, accountSummaries, syncSummary, transactions, actions } = useMockApp();
  const { colors, spacing, radius, typography, shadow } = useAccountingTheme();
  const styles = createStyles(colors, spacing, radius, typography, shadow);

  const syncActionLabel = getSyncActionLabel(syncSummary.status);
  const syncTarget = useMemo(() => getSyncTargetTransaction(transactions), [transactions]);
  const profileRows = [
    { label: accountingCopy.profile.ledger, value: user.ledgerName },
    { label: accountingCopy.profile.email, value: user.email },
    { label: accountingCopy.profile.currency, value: user.currency },
    { label: accountingCopy.profile.timeZone, value: user.timezone },
  ];
  const workspaceRows = [
    {
      label: accountingCopy.profile.defaultAccount,
      value:
        accountSummaries.find((account) => account.id === user.defaultAccountId)?.name ??
        user.defaultAccountId,
    },
    {
      label: accountingCopy.profile.activeAccounts,
      value: String(accountSummaries.filter((account) => account.isActive).length),
    },
    { label: accountingCopy.profile.mockMode, value: accountingCopy.profile.mockModeValue },
  ];

  const handleSyncAction = () => {
    if (!syncTarget) {
      return;
    }

    actions.updateTransactionSyncStatus(syncTarget.id, 'synced', new Date().toISOString());
  };

  return (
    <AccountingScreen>
      <SectionHeader
        title={accountingCopy.profile.title}
        subtitle={accountingCopy.profile.subtitle}
      />
      <InfoCard title={user.name} rows={profileRows} />
      <SyncSummaryRow
        status={syncSummary.status}
        pendingCount={syncSummary.pendingCount}
        failedCount={syncSummary.failedCount}
        label={accountingCopy.profile.syncStatus}
        detail={getSyncSummaryDetail(syncSummary, user.timezone)}
        actionLabel={syncActionLabel ?? undefined}
        onActionPress={syncActionLabel ? handleSyncAction : undefined}
      />
      <InfoCard title={accountingCopy.profile.workspace} rows={workspaceRows} />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{accountingCopy.profile.accounts}</Text>
        <View style={styles.sectionBody}>
          {accountSummaries.map((account) => (
            <AccountSummaryRow
              key={account.id}
              account={{
                ...account,
                type: getAccountTypeLabel(account.type),
              }}
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

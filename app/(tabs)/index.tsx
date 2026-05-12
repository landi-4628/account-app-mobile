import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { accountingCopy } from '@/constants/accounting-copy';
import { useMockApp } from '@/providers/mock-app-provider';
import {
  AccountingScreen,
  AccountSummaryRow,
  EmptyState,
  SectionHeader,
  SummaryCard,
  SyncSummaryRow,
  TransactionListItem,
} from '@/components/accounting';
import {
  createAccountNameMap,
  getAccountingMonthLabel,
  getCategoryLabel,
} from '@/components/accounting/home-details-utils.js';
import { formatTransactionDateTime } from '@/components/accounting/helpers.js';
import { useAccountingTheme } from '@/components/accounting/use-accounting-theme.js';

export default function HomeScreen() {
  const router = useRouter();
  const { colors, spacing, radius, typography } = useAccountingTheme();
  const styles = useMemo(
    () => createStyles(colors, spacing, radius, typography),
    [colors, spacing, radius, typography]
  );
  const { accountSummaries, currentMonth, currentMonthData, syncSummary, user } = useMockApp();
  const noop = React.useCallback(() => {}, []);
  const openDetails = React.useCallback(() => {
    router.push('/details' as never);
  }, [router]);
  const openNewTransaction = React.useCallback(() => {
    router.push('/transaction/new' as never);
  }, [router]);
  const recentTransactions = currentMonthData.transactions.slice(0, 4);
  const accountNameMap = useMemo(() => createAccountNameMap(accountSummaries), [accountSummaries]);
  const monthLabel = getAccountingMonthLabel(currentMonth);
  const syncDetail = `Updated ${formatTransactionDateTime(syncSummary.updatedAt, user.timezone)}`;

  return (
    <AccountingScreen contentContainerStyle={undefined} style={undefined}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>{accountingCopy.appName}</Text>
          <Text style={styles.title}>{monthLabel}</Text>
          <Text style={styles.subtitle}>{user.ledgerName}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={openNewTransaction}
          style={({ pressed }) => [styles.headerAction, pressed && styles.headerActionPressed]}>
          <Text style={styles.headerActionLabel}>{accountingCopy.actions.addEntry}</Text>
        </Pressable>
      </View>

      <SummaryCard
        month={currentMonthData.summary.month}
        balance={currentMonthData.summary.balance}
        income={currentMonthData.summary.income}
        expense={currentMonthData.summary.expense}
        syncStatus={currentMonthData.summary.syncStatus}
        pendingCount={currentMonthData.summary.pendingCount}
        failedCount={currentMonthData.summary.failedCount}
        balanceLabel={accountingCopy.home.balanceLabel}
      />

      <View style={styles.section}>
        <SectionHeader
          title={accountingCopy.actions.accounts}
          subtitle={`${accountSummaries.length} active balance views`}
          actionLabel={undefined}
          onActionPress={undefined}
        />
        <View style={styles.stack}>
          {accountSummaries.slice(0, 3).map((account) => (
            <AccountSummaryRow key={account.id} account={account} onPress={noop} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title={accountingCopy.home.recentTransactions}
          subtitle={`${currentMonthData.transactions.length} records this month`}
          actionLabel={accountingCopy.actions.addEntry}
          onActionPress={openNewTransaction}
        />
        {recentTransactions.length > 0 ? (
          <View style={styles.stack}>
            {recentTransactions.map((transaction) => (
              <TransactionListItem
                key={transaction.id}
                transaction={transaction}
                categoryLabel={getCategoryLabel(transaction.categoryId)}
                accountLabel={accountNameMap.get(transaction.accountId) ?? transaction.accountId}
                timeZone={user.timezone}
                onPress={noop}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            title={accountingCopy.home.emptyTitle}
            description={accountingCopy.home.emptyDescription}
            actionLabel={undefined}
            onActionPress={undefined}
          />
        )}
      </View>

      <SyncSummaryRow
        status={syncSummary.status}
        pendingCount={syncSummary.pendingCount}
        failedCount={syncSummary.failedCount}
        label={undefined}
        detail={syncDetail}
        actionLabel={accountingCopy.tabs.details}
        onActionPress={openDetails}
      />
    </AccountingScreen>
  );
}

/**
 * @param {any} colors
 * @param {any} spacing
 * @param {any} radius
 * @param {any} typography
 */
function createStyles(colors: any, spacing: any, radius: any, typography: any) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    headerCopy: {
      flex: 1,
      gap: 4,
    },
    eyebrow: {
      fontSize: typography.caption,
      fontWeight: '600',
      color: colors.brandContrast,
    },
    title: {
      fontSize: typography.headline,
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: {
      fontSize: typography.bodyLarge,
      color: colors.textSecondary,
    },
    headerAction: {
      minHeight: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.pill,
      backgroundColor: colors.brandSoft,
      paddingHorizontal: spacing.md,
    },
    headerActionPressed: {
      opacity: 0.85,
    },
    headerActionLabel: {
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.brandContrast,
    },
    section: {
      gap: spacing.sm,
    },
    stack: {
      gap: spacing.sm,
    },
  });
}

import React, { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { accountingCopy } from '@/constants/accounting-copy';
import { useMockApp } from '@/providers/mock-app-provider';
import {
  AccountingScreen,
  EmptyState,
  MonthSwitcher,
  SectionHeader,
  TransactionListItem,
  formatAccountingCurrency,
} from '@/components/accounting';
import {
  buildDetailsSummaryItems,
  createAccountNameMap,
  getAccountingMonthLabel,
  getCategoryLabel,
  groupTransactionsByDay,
} from '@/components/accounting/home-details-utils.js';
import { useAccountingTheme } from '@/components/accounting/use-accounting-theme.js';

export default function DetailsScreen() {
  const router = useRouter();
  const { colors, spacing, radius, typography } = useAccountingTheme();
  const styles = useMemo(
    () => createStyles(colors, spacing, radius, typography),
    [colors, spacing, radius, typography]
  );
  const { actions, accountSummaries, availableMonths, currentMonth, currentMonthData, user } =
    useMockApp();
  const summaryItems = buildDetailsSummaryItems(currentMonthData.summary);
  const accountNameMap = useMemo(
    () => createAccountNameMap(accountSummaries),
    [accountSummaries]
  );
  const groupedTransactions = useMemo(
    () => groupTransactionsByDay(currentMonthData.transactions, user.timezone),
    [currentMonthData.transactions, user.timezone]
  );
  const openNewTransaction = React.useCallback(() => {
    router.push('/transaction/new');
  }, [router]);
  const openEditTransaction = React.useCallback(
    (transactionId) => {
      router.push(`/transaction/${transactionId}`);
    },
    [router]
  );

  return (
    <AccountingScreen>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{accountingCopy.tabs.details}</Text>
          <Text style={styles.subtitle}>
            {`${getAccountingMonthLabel(currentMonth)} · ${currentMonthData.transactions.length} records`}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={openNewTransaction}
          style={({ pressed }) => [styles.headerAction, pressed && styles.headerActionPressed]}>
          <Text style={styles.headerActionLabel}>{accountingCopy.actions.addEntry}</Text>
        </Pressable>
      </View>

      <MonthSwitcher
        months={availableMonths}
        value={currentMonth}
        onChange={actions.setCurrentMonth}
      />

      <View style={styles.summaryStrip}>
        {summaryItems.map((item) => (
          <View key={item.key} style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{item.label}</Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              style={[
                styles.summaryValue,
                item.tone === 'income'
                  ? styles.summaryValueIncome
                  : item.tone === 'expense'
                    ? styles.summaryValueExpense
                    : null,
              ]}>
              {formatAccountingCurrency(item.value)}
            </Text>
          </View>
        ))}
      </View>

      {groupedTransactions.length > 0 ? (
        groupedTransactions.map((group) => (
          <View key={group.key} style={styles.groupSection}>
            <SectionHeader
              title={group.label}
              subtitle={buildGroupSubtitle(group.totalIncome, group.totalExpense)}
            />
            <View style={styles.groupList}>
              {group.transactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionRow}>
                  <View style={styles.transactionCard}>
                    <TransactionListItem
                      transaction={transaction}
                      categoryLabel={getCategoryLabel(transaction.categoryId)}
                      accountLabel={
                        accountNameMap.get(transaction.accountId) ?? transaction.accountId
                      }
                      timeZone={user.timezone}
                      onPress={() => openEditTransaction(transaction.id)}
                    />
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => openEditTransaction(transaction.id)}
                    style={({ pressed }) => [
                      styles.editButton,
                      pressed && styles.secondaryButtonPressed,
                    ]}>
                    <Text style={styles.editLabel}>{accountingCopy.actions.edit}</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => actions.deleteTransaction(transaction.id)}
                    style={({ pressed }) => [
                      styles.deleteButton,
                      pressed && styles.secondaryButtonPressed,
                    ]}>
                    <Text style={styles.deleteLabel}>{accountingCopy.actions.delete}</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        ))
      ) : (
        <EmptyState
          title="No records for this month"
          description="Switch months or add a new entry."
          actionLabel={accountingCopy.actions.addEntry}
          onActionPress={openNewTransaction}
        />
      )}
    </AccountingScreen>
  );
}

function buildGroupSubtitle(totalIncome, totalExpense) {
  if (totalIncome > 0 && totalExpense > 0) {
    return `+${formatAccountingCurrency(totalIncome)} / -${formatAccountingCurrency(totalExpense)}`;
  }

  if (totalIncome > 0) {
    return `+${formatAccountingCurrency(totalIncome)}`;
  }

  return `-${formatAccountingCurrency(totalExpense)}`;
}

function createStyles(colors, spacing, radius, typography) {
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
    title: {
      fontSize: typography.headline,
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: {
      fontSize: typography.body,
      color: colors.textSecondary,
    },
    summaryStrip: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    summaryCard: {
      flex: 1,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.sm,
      gap: 6,
    },
    summaryLabel: {
      fontSize: typography.caption,
      color: colors.textMuted,
    },
    summaryValue: {
      fontSize: typography.bodyLarge,
      fontWeight: '700',
      color: colors.text,
    },
    summaryValueIncome: {
      color: colors.income,
    },
    summaryValueExpense: {
      color: colors.expense,
    },
    groupSection: {
      gap: spacing.sm,
    },
    groupList: {
      gap: spacing.sm,
    },
    transactionRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: spacing.sm,
    },
    transactionCard: {
      flex: 1,
    },
    editButton: {
      width: 68,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.sm,
    },
    deleteButton: {
      width: 68,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.sm,
    },
    secondaryButtonPressed: {
      opacity: 0.8,
    },
    editLabel: {
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.brandContrast,
    },
    deleteLabel: {
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.danger,
    },
  });
}

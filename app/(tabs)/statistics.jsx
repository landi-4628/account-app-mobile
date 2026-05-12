import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { accountingCopy } from '@/constants/accounting-copy';
import { accountingTheme } from '@/constants/accounting-theme';
import {
  AccountingScreen,
  EmptyState,
  InteractiveCard,
  MonthSwitcher,
  SectionHeader,
  SummaryCard,
  formatAccountingCurrency,
} from '@/components/accounting';
import { getAccountingCategoryLabel } from '@/components/accounting/statistics-profile-support';
import {
  createCategoryNameMap,
  getAccountingMonthLabel,
} from '@/components/accounting/home-details-utils';
import { useAccountingTheme } from '@/components/accounting/use-accounting-theme';
import { useMockApp } from '@/providers/mock-app-provider';

function BreakdownCard({ title, items, totalAmount, emptyDescription, categoryNameMap }) {
  const { colors, spacing, radius, typography, shadow } = useAccountingTheme();
  const styles = createStyles(colors, spacing, radius, typography, shadow);

  return (
    <InteractiveCard style={styles.card} shadowStyle={shadow.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardMeta}>{formatAccountingCurrency(totalAmount)}</Text>
      </View>
      {items.length === 0 ? (
        <Text style={styles.emptyCopy}>{emptyDescription}</Text>
      ) : (
        <View style={styles.breakdownList}>
          {items.map((item) => {
            const colorRole = accountingTheme.categoryColorRoles[item.categoryId] ?? 'brand';
            const accentColor = colors[colorRole] ?? colors.brand;

            return (
              <View key={item.categoryId} style={styles.breakdownRow}>
                <View style={styles.breakdownLabelWrap}>
                  <View style={[styles.dot, { backgroundColor: accentColor }]} />
                  <View style={styles.breakdownCopy}>
                    <Text style={styles.breakdownLabel}>
                      {categoryNameMap.get(item.categoryId)
                        ?? getAccountingCategoryLabel(item.categoryId)}
                    </Text>
                    <Text style={styles.breakdownPercent}>
                      {item.percent}%{accountingCopy.statistics.percentSuffix}
                    </Text>
                  </View>
                </View>
                <Text style={styles.breakdownAmount}>{formatAccountingCurrency(item.amount)}</Text>
              </View>
            );
          })}
        </View>
      )}
    </InteractiveCard>
  );
}

export default function StatisticsScreen() {
  const { currentMonthData, actions, availableMonths, categories } = useMockApp();
  const { statistics, summary, month, transactions } = currentMonthData;
  const categoryNameMap = React.useMemo(() => createCategoryNameMap(categories), [categories]);
  const showEmptyState =
    transactions.length === 0 &&
    statistics.expenseBreakdown.length === 0 &&
    statistics.incomeBreakdown.length === 0;

  return (
    <AccountingScreen>
      <SectionHeader
        title={accountingCopy.statistics.title}
        subtitle={`${statistics.transactionCount} ${accountingCopy.statistics.subtitleSuffix} · ${getAccountingMonthLabel(month)}`}
      />
      <MonthSwitcher months={availableMonths} value={month} onChange={actions.setCurrentMonth} />
      <SummaryCard
        month={summary.month}
        balance={summary.balance}
        income={summary.income}
        expense={summary.expense}
        syncStatus={summary.syncStatus}
        pendingCount={summary.pendingCount}
        failedCount={summary.failedCount}
        balanceLabel={accountingCopy.statistics.balanceLabel}
      />
      {showEmptyState ? (
        <EmptyState
          title={accountingCopy.statistics.emptyTitle}
          description={accountingCopy.statistics.emptyDescription}
        />
      ) : null}
      <BreakdownCard
        title={accountingCopy.statistics.expenseSectionTitle}
        items={statistics.expenseBreakdown}
        totalAmount={summary.expense}
        emptyDescription={accountingCopy.statistics.expenseEmpty}
        categoryNameMap={categoryNameMap}
      />
      <BreakdownCard
        title={accountingCopy.statistics.incomeSectionTitle}
        items={statistics.incomeBreakdown}
        totalAmount={summary.income}
        emptyDescription={accountingCopy.statistics.incomeEmpty}
        categoryNameMap={categoryNameMap}
      />
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
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    cardTitle: {
      flex: 1,
      fontSize: typography.bodyLarge,
      fontWeight: '700',
      color: colors.text,
    },
    cardMeta: {
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    emptyCopy: {
      fontSize: typography.body,
      color: colors.textSecondary,
    },
    breakdownList: {
      gap: spacing.md,
    },
    breakdownRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    breakdownLabelWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: radius.pill,
    },
    breakdownCopy: {
      flex: 1,
      gap: 2,
    },
    breakdownLabel: {
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.text,
    },
    breakdownPercent: {
      fontSize: typography.caption,
      color: colors.textMuted,
    },
    breakdownAmount: {
      fontSize: typography.body,
      fontWeight: '700',
      color: colors.text,
    },
  });
}

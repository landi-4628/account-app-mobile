import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { accountingLightColors, accountingTheme } from '@/constants/accounting-theme';
import { formatAccountingCurrency, formatAccountingMonth } from './helpers.js';
import { SyncBadge } from './sync-badge.js';

function Metric({ label, value, tone }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, tone === 'income' ? styles.income : styles.expense]}>
        {formatAccountingCurrency(value)}
      </Text>
    </View>
  );
}

export function SummaryCard({
  month,
  balance,
  income,
  expense,
  syncStatus,
  pendingCount = 0,
  failedCount = 0,
  balanceLabel = 'Net balance',
}) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.month}>{formatAccountingMonth(month)}</Text>
          <Text style={styles.balanceLabel}>{balanceLabel}</Text>
        </View>
        <SyncBadge
          status={syncStatus}
          pendingCount={pendingCount}
          failedCount={failedCount}
        />
      </View>
      <Text style={styles.balanceValue}>{formatAccountingCurrency(balance)}</Text>
      <View style={styles.metrics}>
        <Metric label="Income" value={income} tone="income" />
        <Metric label="Expense" value={expense} tone="expense" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: accountingTheme.radius.lg,
    backgroundColor: accountingLightColors.surface,
    padding: accountingTheme.spacing.md,
    gap: accountingTheme.spacing.md,
    ...accountingTheme.shadow.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: accountingTheme.spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  month: {
    fontSize: accountingTheme.typography.body,
    fontWeight: '600',
    color: accountingLightColors.textSecondary,
  },
  balanceLabel: {
    fontSize: accountingTheme.typography.body,
    color: accountingLightColors.textMuted,
  },
  balanceValue: {
    fontSize: accountingTheme.typography.headline,
    fontWeight: '700',
    color: accountingLightColors.text,
  },
  metrics: {
    flexDirection: 'row',
    gap: accountingTheme.spacing.md,
  },
  metric: {
    flex: 1,
    borderRadius: accountingTheme.radius.md,
    backgroundColor: accountingLightColors.surfaceAlt,
    padding: accountingTheme.spacing.sm,
    gap: 6,
  },
  metricLabel: {
    fontSize: accountingTheme.typography.caption,
    color: accountingLightColors.textMuted,
  },
  metricValue: {
    fontSize: accountingTheme.typography.bodyLarge,
    fontWeight: '700',
  },
  income: {
    color: accountingLightColors.income,
  },
  expense: {
    color: accountingLightColors.expense,
  },
});

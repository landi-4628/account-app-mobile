import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { accountingCopy } from '../../constants/accounting-copy.js';
import { formatAccountingCurrency, formatAccountingMonth } from './helpers.js';
import { InteractiveCard } from './interactive-card.js';
import { SyncBadge } from './sync-badge.js';
import { useAccountingTheme } from './use-accounting-theme.js';

/** @typedef {import('@/types/accounting').SummaryCardData} SummaryCardData */
/** @typedef {import('./use-accounting-theme.js').AccountingThemeColors} AccountingThemeColors */
/** @typedef {import('./use-accounting-theme.js').AccountingThemeSpacing} AccountingThemeSpacing */
/** @typedef {import('./use-accounting-theme.js').AccountingThemeRadius} AccountingThemeRadius */
/** @typedef {import('./use-accounting-theme.js').AccountingThemeTypography} AccountingThemeTypography */
/** @typedef {import('./use-accounting-theme.js').AccountingThemeShadow} AccountingThemeShadow */

/**
 * @param {{
 *   label: string,
 *   value: number,
 *   tone: 'income' | 'expense',
 *   styles: ReturnType<typeof createStyles>,
 * }} props
 */
function Metric({ label, value, tone, styles }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, tone === 'income' ? styles.income : styles.expense]}>
        {formatAccountingCurrency(value)}
      </Text>
    </View>
  );
}

/**
 * @param {SummaryCardData & {
 *   balanceLabel?: string | undefined,
 * }} props
 */
export function SummaryCard({
  month,
  balance,
  income,
  expense,
  syncStatus,
  pendingCount = 0,
  failedCount = 0,
  balanceLabel = accountingCopy.home.balanceLabel,
}) {
  const { colors, spacing, radius, typography, shadow } = useAccountingTheme();
  const styles = createStyles(colors, spacing, radius, typography, shadow);

  return (
    <InteractiveCard style={styles.card} shadowStyle={shadow.card}>
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
        <Metric label={accountingCopy.entryType.income} value={income} tone="income" styles={styles} />
        <Metric label={accountingCopy.entryType.expense} value={expense} tone="expense" styles={styles} />
      </View>
    </InteractiveCard>
  );
}

/**
 * @param {AccountingThemeColors} colors
 * @param {AccountingThemeSpacing} spacing
 * @param {AccountingThemeRadius} radius
 * @param {AccountingThemeTypography} typography
 * @param {AccountingThemeShadow} shadow
 */
function createStyles(colors, spacing, radius, typography, shadow) {
  return StyleSheet.create({
    card: {
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.md,
      ...shadow.card,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    headerCopy: {
      flex: 1,
      gap: 4,
    },
    month: {
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    balanceLabel: {
      fontSize: typography.body,
      color: colors.textMuted,
    },
    balanceValue: {
      fontSize: typography.headline,
      fontWeight: '700',
      color: colors.text,
    },
    metrics: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    metric: {
      flex: 1,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceAlt,
      padding: spacing.sm,
      gap: 6,
    },
    metricLabel: {
      fontSize: typography.caption,
      color: colors.textMuted,
    },
    metricValue: {
      fontSize: typography.bodyLarge,
      fontWeight: '700',
    },
    income: {
      color: colors.income,
    },
    expense: {
      color: colors.expense,
    },
  });
}

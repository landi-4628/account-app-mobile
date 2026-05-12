import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { accountingLightColors, accountingTheme } from '@/constants/accounting-theme';
import { formatAccountingCurrency, formatTransactionDateTime } from './helpers.js';
import { SyncBadge } from './sync-badge.js';

export function TransactionListItem({
  transaction,
  categoryLabel,
  accountLabel,
  onPress,
}) {
  const amountStyle = transaction.type === 'income' ? styles.income : styles.expense;
  const amountPrefix = transaction.type === 'income' ? '+' : '-';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress?.(transaction)}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
      <View style={[styles.marker, transaction.type === 'income' ? styles.markerIncome : styles.markerExpense]} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.copy}>
            <Text numberOfLines={1} style={styles.title}>
              {categoryLabel}
            </Text>
            <Text numberOfLines={1} style={styles.subtitle}>
              {[accountLabel, formatTransactionDateTime(transaction.transactionAt)].filter(Boolean).join('  ')}
            </Text>
          </View>
          <Text style={[styles.amount, amountStyle]}>
            {amountPrefix}
            {formatAccountingCurrency(transaction.amount).replace('-', '')}
          </Text>
        </View>
        <View style={styles.bottomRow}>
          {transaction.note ? (
            <Text numberOfLines={1} style={styles.note}>
              {transaction.note}
            </Text>
          ) : (
            <View />
          )}
          <SyncBadge status={transaction.syncStatus} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: accountingTheme.spacing.sm,
    borderRadius: accountingTheme.radius.md,
    backgroundColor: accountingLightColors.surface,
    padding: accountingTheme.spacing.md,
    borderWidth: 1,
    borderColor: accountingLightColors.border,
  },
  pressed: {
    opacity: 0.85,
  },
  marker: {
    width: 10,
    height: 10,
    marginTop: 7,
    borderRadius: accountingTheme.radius.pill,
  },
  markerIncome: {
    backgroundColor: accountingLightColors.income,
  },
  markerExpense: {
    backgroundColor: accountingLightColors.expense,
  },
  content: {
    flex: 1,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    gap: accountingTheme.spacing.sm,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: accountingTheme.typography.bodyLarge,
    fontWeight: '600',
    color: accountingLightColors.text,
  },
  subtitle: {
    fontSize: accountingTheme.typography.caption,
    color: accountingLightColors.textSecondary,
  },
  amount: {
    flexShrink: 0,
    fontSize: accountingTheme.typography.bodyLarge,
    fontWeight: '700',
  },
  income: {
    color: accountingLightColors.income,
  },
  expense: {
    color: accountingLightColors.expense,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: accountingTheme.spacing.sm,
  },
  note: {
    flex: 1,
    fontSize: accountingTheme.typography.body,
    color: accountingLightColors.textMuted,
  },
});

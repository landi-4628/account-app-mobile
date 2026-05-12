import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatAccountingCurrency, formatTransactionDateTime } from './helpers.js';
import { SyncBadge } from './sync-badge.js';
import { useAccountingTheme } from './use-accounting-theme.js';

export function TransactionListItem({
  transaction,
  categoryLabel,
  accountLabel,
  timeZone = 'UTC',
  onPress,
}) {
  const { colors, spacing, radius, typography } = useAccountingTheme();
  const styles = createStyles(colors, spacing, radius, typography);
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
              {[accountLabel, formatTransactionDateTime(transaction.transactionAt, timeZone)].filter(Boolean).join('  ')}
            </Text>
          </View>
          <Text style={[styles.amount, amountStyle]}>
            {amountPrefix}
            {formatAccountingCurrency(transaction.amount)}
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

function createStyles(colors, spacing, radius, typography) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pressed: {
      opacity: 0.85,
    },
    marker: {
      width: 10,
      height: 10,
      marginTop: 7,
      borderRadius: radius.pill,
    },
    markerIncome: {
      backgroundColor: colors.income,
    },
    markerExpense: {
      backgroundColor: colors.expense,
    },
    content: {
      flex: 1,
      gap: 10,
    },
    topRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    copy: {
      flex: 1,
      gap: 4,
    },
    title: {
      fontSize: typography.bodyLarge,
      fontWeight: '600',
      color: colors.text,
    },
    subtitle: {
      fontSize: typography.caption,
      color: colors.textSecondary,
    },
    amount: {
      flexShrink: 0,
      fontSize: typography.bodyLarge,
      fontWeight: '700',
    },
    income: {
      color: colors.income,
    },
    expense: {
      color: colors.expense,
    },
    bottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    note: {
      flex: 1,
      fontSize: typography.body,
      color: colors.textMuted,
    },
  });
}

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { accountingLightColors, accountingTheme } from '@/constants/accounting-theme';
import { formatAccountingCurrency } from './helpers.js';

export function AccountSummaryRow({ account, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress?.(account)}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.name}>
          {account.name}
        </Text>
        <Text style={styles.meta}>
          {account.type}
          {account.isActive ? '' : '  Inactive'}
        </Text>
      </View>
      <Text style={styles.amount}>{formatAccountingCurrency(account.currentBalance)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: accountingTheme.spacing.md,
    borderRadius: accountingTheme.radius.md,
    borderWidth: 1,
    borderColor: accountingLightColors.border,
    backgroundColor: accountingLightColors.surface,
    padding: accountingTheme.spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: accountingTheme.typography.bodyLarge,
    fontWeight: '600',
    color: accountingLightColors.text,
  },
  meta: {
    fontSize: accountingTheme.typography.caption,
    color: accountingLightColors.textSecondary,
    textTransform: 'capitalize',
  },
  amount: {
    fontSize: accountingTheme.typography.bodyLarge,
    fontWeight: '700',
    color: accountingLightColors.text,
  },
});

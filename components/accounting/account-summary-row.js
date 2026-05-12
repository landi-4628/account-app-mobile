import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatAccountingCurrency } from './helpers.js';
import { useAccountingTheme } from './use-accounting-theme.js';

export function AccountSummaryRow({ account, onPress }) {
  const { colors, spacing, radius, typography } = useAccountingTheme();
  const styles = createStyles(colors, spacing, radius, typography);

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

function createStyles(colors, spacing, radius, typography) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: spacing.md,
    },
    pressed: {
      opacity: 0.85,
    },
    copy: {
      flex: 1,
      gap: 4,
    },
    name: {
      fontSize: typography.bodyLarge,
      fontWeight: '600',
      color: colors.text,
    },
    meta: {
      fontSize: typography.caption,
      color: colors.textSecondary,
      textTransform: 'capitalize',
    },
    amount: {
      fontSize: typography.bodyLarge,
      fontWeight: '700',
      color: colors.text,
    },
  });
}

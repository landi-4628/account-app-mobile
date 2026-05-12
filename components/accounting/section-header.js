import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { accountingLightColors, accountingTheme } from '@/constants/accounting-theme';

export function SectionHeader({ title, subtitle, actionLabel, onActionPress }) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel ? (
        <Pressable
          accessibilityRole="button"
          onPress={onActionPress}
          style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}>
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: accountingTheme.spacing.md,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: accountingTheme.typography.title,
    fontWeight: '700',
    color: accountingLightColors.text,
  },
  subtitle: {
    fontSize: accountingTheme.typography.body,
    color: accountingLightColors.textSecondary,
  },
  action: {
    minHeight: 32,
    justifyContent: 'center',
    borderRadius: accountingTheme.radius.pill,
    paddingHorizontal: accountingTheme.spacing.sm,
    backgroundColor: accountingLightColors.brandSoft,
  },
  actionPressed: {
    opacity: 0.8,
  },
  actionLabel: {
    fontSize: accountingTheme.typography.body,
    fontWeight: '600',
    color: accountingLightColors.brandContrast,
  },
});

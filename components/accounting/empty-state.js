import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { accountingLightColors, accountingTheme } from '@/constants/accounting-theme';

export function EmptyState({ title, description, actionLabel, onActionPress }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <View style={styles.icon} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
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
  container: {
    alignItems: 'center',
    borderRadius: accountingTheme.radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: accountingLightColors.borderStrong,
    backgroundColor: accountingLightColors.surface,
    padding: accountingTheme.spacing.xl,
    gap: accountingTheme.spacing.md,
  },
  iconWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: accountingTheme.radius.pill,
    backgroundColor: accountingLightColors.brandSoft,
  },
  icon: {
    width: 16,
    height: 16,
    borderRadius: accountingTheme.radius.pill,
    backgroundColor: accountingLightColors.brand,
  },
  copy: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: accountingTheme.typography.bodyLarge,
    fontWeight: '700',
    color: accountingLightColors.text,
    textAlign: 'center',
  },
  description: {
    fontSize: accountingTheme.typography.body,
    color: accountingLightColors.textSecondary,
    textAlign: 'center',
  },
  action: {
    minWidth: 120,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: accountingTheme.radius.pill,
    backgroundColor: accountingLightColors.brand,
    paddingHorizontal: accountingTheme.spacing.md,
  },
  actionPressed: {
    opacity: 0.85,
  },
  actionLabel: {
    fontSize: accountingTheme.typography.body,
    fontWeight: '600',
    color: accountingLightColors.textInverse,
  },
});

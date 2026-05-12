import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { accountingLightColors, accountingTheme } from '@/constants/accounting-theme';
import { SyncBadge } from './sync-badge.js';

export function SyncSummaryRow({
  status,
  pendingCount = 0,
  failedCount = 0,
  label,
  detail,
  actionLabel,
  onActionPress,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        <SyncBadge
          status={status}
          pendingCount={pendingCount}
          failedCount={failedCount}
          label={label}
        />
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
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
  copy: {
    flex: 1,
    gap: 8,
  },
  detail: {
    fontSize: accountingTheme.typography.body,
    color: accountingLightColors.textSecondary,
  },
  action: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: accountingTheme.spacing.sm,
  },
  actionPressed: {
    opacity: 0.8,
  },
  actionLabel: {
    fontSize: accountingTheme.typography.body,
    fontWeight: '600',
    color: accountingLightColors.brand,
  },
});

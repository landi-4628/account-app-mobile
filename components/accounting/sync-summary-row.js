import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SyncBadge } from './sync-badge.js';
import { useAccountingTheme } from './use-accounting-theme.js';

export function SyncSummaryRow({
  status,
  pendingCount = 0,
  failedCount = 0,
  label,
  detail,
  actionLabel,
  onActionPress,
}) {
  const { colors, spacing, radius, typography } = useAccountingTheme();
  const styles = createStyles(colors, spacing, radius, typography);

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
    copy: {
      flex: 1,
      gap: 8,
    },
    detail: {
      fontSize: typography.body,
      color: colors.textSecondary,
    },
    action: {
      minHeight: 32,
      justifyContent: 'center',
      paddingHorizontal: spacing.sm,
    },
    actionPressed: {
      opacity: 0.8,
    },
    actionLabel: {
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.brand,
    },
  });
}

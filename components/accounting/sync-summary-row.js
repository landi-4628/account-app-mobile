import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SyncBadge } from './sync-badge.js';
import { useAccountingTheme } from './use-accounting-theme.js';

/** @typedef {import('@/types/accounting').SyncStatus} SyncStatus */
/** @typedef {import('./use-accounting-theme.js').AccountingThemeColors} AccountingThemeColors */
/** @typedef {import('./use-accounting-theme.js').AccountingThemeSpacing} AccountingThemeSpacing */
/** @typedef {import('./use-accounting-theme.js').AccountingThemeRadius} AccountingThemeRadius */
/** @typedef {import('./use-accounting-theme.js').AccountingThemeTypography} AccountingThemeTypography */

/**
 * @param {{
 *   status: SyncStatus,
 *   pendingCount?: number | undefined,
 *   failedCount?: number | undefined,
 *   label?: string | undefined,
 *   detail?: string | undefined,
 *   actionLabel?: string | undefined,
 *   actionDisabled?: boolean | undefined,
 *   onActionPress?: (() => void) | undefined,
 * }} props
 */
export function SyncSummaryRow({
  status,
  pendingCount = 0,
  failedCount = 0,
  label,
  detail,
  actionLabel,
  actionDisabled = false,
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
          accessibilityState={{ disabled: actionDisabled }}
          disabled={actionDisabled}
          onPress={onActionPress}
          style={({ pressed }) => [
            styles.action,
            actionDisabled && styles.actionDisabled,
            pressed && !actionDisabled && styles.actionPressed,
          ]}>
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * @param {AccountingThemeColors} colors
 * @param {AccountingThemeSpacing} spacing
 * @param {AccountingThemeRadius} radius
 * @param {AccountingThemeTypography} typography
 */
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
    actionDisabled: {
      opacity: 0.45,
    },
    actionLabel: {
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.brand,
    },
  });
}

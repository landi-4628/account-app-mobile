import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAccountingTheme } from './use-accounting-theme.js';

/** @typedef {import('./use-accounting-theme.js').AccountingThemeColors} AccountingThemeColors */
/** @typedef {import('./use-accounting-theme.js').AccountingThemeSpacing} AccountingThemeSpacing */
/** @typedef {import('./use-accounting-theme.js').AccountingThemeRadius} AccountingThemeRadius */
/** @typedef {import('./use-accounting-theme.js').AccountingThemeTypography} AccountingThemeTypography */

/**
 * @param {{
 *   title: string,
 *   description?: string | undefined,
 *   actionLabel?: string | undefined,
 *   onActionPress?: (() => void) | undefined,
 * }} props
 */
export function EmptyState({ title, description, actionLabel, onActionPress }) {
  const { colors, spacing, radius, typography } = useAccountingTheme();
  const styles = createStyles(colors, spacing, radius, typography);

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

/**
 * @param {AccountingThemeColors} colors
 * @param {AccountingThemeSpacing} spacing
 * @param {AccountingThemeRadius} radius
 * @param {AccountingThemeTypography} typography
 */
function createStyles(colors, spacing, radius, typography) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      borderRadius: radius.lg,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.borderStrong,
      backgroundColor: colors.surface,
      padding: spacing.xl,
      gap: spacing.md,
    },
    iconWrap: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.pill,
      backgroundColor: colors.brandSoft,
    },
    icon: {
      width: 16,
      height: 16,
      borderRadius: radius.pill,
      backgroundColor: colors.brand,
    },
    copy: {
      alignItems: 'center',
      gap: 6,
    },
    title: {
      fontSize: typography.bodyLarge,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    description: {
      fontSize: typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    action: {
      minWidth: 120,
      minHeight: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.pill,
      backgroundColor: colors.brand,
      paddingHorizontal: spacing.md,
    },
    actionPressed: {
      opacity: 0.85,
    },
    actionLabel: {
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.textInverse,
    },
  });
}

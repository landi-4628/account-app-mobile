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
 *   subtitle?: string | undefined,
 *   actionLabel?: string | undefined,
 *   onActionPress?: (() => void) | undefined,
 * }} props
 */
export function SectionHeader({ title, subtitle, actionLabel, onActionPress }) {
  const { colors, spacing, radius, typography } = useAccountingTheme();
  const styles = createStyles(colors, spacing, radius, typography);

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

/**
 * @param {AccountingThemeColors} colors
 * @param {AccountingThemeSpacing} spacing
 * @param {AccountingThemeRadius} radius
 * @param {AccountingThemeTypography} typography
 */
function createStyles(colors, spacing, radius, typography) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    copy: {
      flex: 1,
      gap: 4,
    },
    title: {
      fontSize: typography.title,
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: {
      fontSize: typography.body,
      color: colors.textSecondary,
    },
    action: {
      minHeight: 32,
      justifyContent: 'center',
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm,
      backgroundColor: colors.brandSoft,
    },
    actionPressed: {
      opacity: 0.8,
    },
    actionLabel: {
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.brandContrast,
    },
  });
}

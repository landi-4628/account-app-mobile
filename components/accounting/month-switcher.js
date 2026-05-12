import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { formatAccountingMonth } from './helpers.js';
import { useAccountingTheme } from './use-accounting-theme.js';

/** @typedef {import('./use-accounting-theme.js').AccountingThemeColors} AccountingThemeColors */
/** @typedef {import('./use-accounting-theme.js').AccountingThemeSpacing} AccountingThemeSpacing */
/** @typedef {import('./use-accounting-theme.js').AccountingThemeRadius} AccountingThemeRadius */
/** @typedef {import('./use-accounting-theme.js').AccountingThemeTypography} AccountingThemeTypography */

/**
 * @param {{
 *   months: string[],
 *   value: string,
 *   onChange: (month: string) => void,
 * }} props
 */
export function MonthSwitcher({ months, value, onChange }) {
  const { colors, spacing, radius, typography } = useAccountingTheme();
  const styles = createStyles(colors, spacing, radius, typography);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}>
      {months.map((month) => {
        const active = month === value;

        return (
          <Pressable
            key={month}
            accessibilityRole="button"
            onPress={() => onChange(month)}
            style={({ pressed }) => [
              styles.chip,
              active && styles.chipActive,
              pressed && styles.chipPressed,
            ]}>
            <Text style={[styles.label, active && styles.labelActive]}>
              {formatAccountingMonth(month)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
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
      gap: spacing.sm,
    },
    chip: {
      minWidth: 108,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
    },
    chipActive: {
      borderColor: colors.brand,
      backgroundColor: colors.brandSoft,
    },
    chipPressed: {
      opacity: 0.8,
    },
    label: {
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    labelActive: {
      color: colors.brandContrast,
    },
  });
}

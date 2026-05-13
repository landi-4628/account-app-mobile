import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useAccountingTheme } from './use-accounting-theme.js';

/** @typedef {import('react').ReactNode} ReactNode */
/** @typedef {import('react-native').StyleProp<import('react-native').ViewStyle>} ViewStyleProp */
/** @typedef {import('./use-accounting-theme.js').AccountingThemeColors} AccountingThemeColors */
/** @typedef {import('./use-accounting-theme.js').AccountingThemeSpacing} AccountingThemeSpacing */
/** @typedef {import('./use-accounting-theme.js').AccountingThemeRadius} AccountingThemeRadius */
/** @typedef {import('./use-accounting-theme.js').AccountingThemeShadow} AccountingThemeShadow */

/**
 * @param {{
 *   children?: ReactNode,
 *   style?: ViewStyleProp,
 * }} props
 */
export function SurfaceCard({ children, style }) {
  const { colors, spacing, radius, shadow } = useAccountingTheme();

  return <View style={[styles.card, createStyleValues(colors, spacing, radius, shadow).card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
});

/**
 * @param {AccountingThemeColors} colors
 * @param {AccountingThemeSpacing} spacing
 * @param {AccountingThemeRadius} radius
 * @param {AccountingThemeShadow} shadow
 */
function createStyleValues(colors, spacing, radius, shadow) {
  return StyleSheet.create({
    card: {
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: spacing.md,
      ...shadow.card,
    },
  });
}

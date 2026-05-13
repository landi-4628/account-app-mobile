import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAccountingTheme } from './use-accounting-theme.js';

/** @typedef {import('./use-accounting-theme.js').AccountingThemeColors} AccountingThemeColors */
/** @typedef {import('./use-accounting-theme.js').AccountingThemeSpacing} AccountingThemeSpacing */
/** @typedef {import('./use-accounting-theme.js').AccountingThemeRadius} AccountingThemeRadius */
/** @typedef {import('./use-accounting-theme.js').AccountingThemeTypography} AccountingThemeTypography */

/**
 * @param {{
 *   tone?: 'default' | 'warning' | undefined,
 *   title: string,
 *   description?: string | null | undefined,
 * }} props
 */
export function InfoBanner({ tone = 'default', title, description }) {
  const { colors, spacing, radius, typography } = useAccountingTheme();
  const styles = createBaseStyles(colors, spacing, radius, typography);
  const toneStyles = createToneStyles(colors);
  const toneStyle = tone === 'warning' ? toneStyles.warning : toneStyles.defaultTone;

  return (
    <View style={[styles.container, toneStyle.container]}>
      <Text style={[styles.title, toneStyle.title]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, toneStyle.description]}>{description}</Text>
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
function createBaseStyles(colors, spacing, radius, typography) {
  return StyleSheet.create({
    container: {
      borderRadius: radius.md,
      padding: spacing.md,
      gap: 6,
    },
    title: {
      fontSize: typography.body,
      fontWeight: '600',
    },
    description: {
      fontSize: typography.caption,
    },
  });
}

/**
 * @param {AccountingThemeColors} colors
 */
function createToneStyles(colors) {
  return {
    defaultTone: {
      container: {
        backgroundColor: colors.brandSoft,
      },
      title: {
        color: colors.brandContrast,
      },
      description: {
        color: colors.brandContrast,
      },
    },
    warning: {
      container: {
        backgroundColor: colors.surfaceAlt,
        borderWidth: 1,
        borderColor: colors.borderStrong,
      },
      title: {
        color: colors.warning,
      },
      description: {
        color: colors.textSecondary,
      },
    },
  };
}

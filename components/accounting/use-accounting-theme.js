import { useMemo } from 'react';

import { accountingTheme } from '@/constants/accounting-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/** @typedef {typeof accountingTheme.colorSchemes.unspecified} AccountingThemeColors */
/** @typedef {typeof accountingTheme.spacing} AccountingThemeSpacing */
/** @typedef {typeof accountingTheme.radius} AccountingThemeRadius */
/** @typedef {typeof accountingTheme.typography} AccountingThemeTypography */
/** @typedef {typeof accountingTheme.shadow} AccountingThemeShadow */
/**
 * @typedef {{
 *   colorScheme: 'light' | 'dark' | 'unspecified',
 *   colors: AccountingThemeColors,
 *   spacing: AccountingThemeSpacing,
 *   radius: AccountingThemeRadius,
 *   typography: AccountingThemeTypography,
 *   shadow: AccountingThemeShadow,
 * }} AccountingThemeTokens
 */
/**
 * @typedef {{
 *   success: { container: import('react-native').ViewStyle, text: import('react-native').TextStyle },
 *   warning: { container: import('react-native').ViewStyle, text: import('react-native').TextStyle },
 *   danger: { container: import('react-native').ViewStyle, text: import('react-native').TextStyle },
 * }} SyncToneStyles
 */

/**
 * @param {string} hex
 * @param {number} alpha
 * @returns {string}
 */
function hexToRgba(hex, alpha) {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized
        .split('')
        .map((part) => `${part}${part}`)
        .join('')
    : normalized;
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

/**
 * @returns {AccountingThemeTokens}
 */
export function useAccountingTheme() {
  const colorScheme = useColorScheme() ?? 'unspecified';
  const colors = accountingTheme.colorSchemes[colorScheme] ?? accountingTheme.colorSchemes.unspecified;

  return useMemo(
    () => ({
      colorScheme,
      colors,
      spacing: accountingTheme.spacing,
      radius: accountingTheme.radius,
      typography: accountingTheme.typography,
      shadow: accountingTheme.shadow,
    }),
    [colorScheme, colors]
  );
}

/**
 * @param {AccountingThemeColors} colors
 * @returns {SyncToneStyles}
 */
export function getSyncToneStyles(colors) {
  return {
    success: {
      container: {
        backgroundColor: hexToRgba(colors.brand, 0.14),
      },
      text: {
        color: colors.brandContrast,
      },
    },
    warning: {
      container: {
        backgroundColor: hexToRgba(colors.warning, 0.16),
      },
      text: {
        color: colors.warning,
      },
    },
    danger: {
      container: {
        backgroundColor: hexToRgba(colors.danger, 0.16),
      },
      text: {
        color: colors.danger,
      },
    },
  };
}

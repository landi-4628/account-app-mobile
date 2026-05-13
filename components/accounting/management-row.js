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
 *   subtitle?: string | null | undefined,
 *   meta?: string | null | undefined,
 *   badge?: { label: string, tone?: 'neutral' | 'warning' } | null | undefined,
 *   onPress?: (() => void) | undefined,
 *   onLongPress?: (() => void) | undefined,
 *   disabled?: boolean | undefined,
 * }} props
 */
export function ManagementRow({ title, subtitle, meta, badge, onPress, onLongPress, disabled = false }) {
  const { colors, spacing, radius, typography } = useAccountingTheme();
  const styles = createStyles(colors, spacing, radius, typography);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.row, pressed && !disabled ? styles.pressed : null, disabled ? styles.disabled : null]}>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
          {badge ? (
            <View style={[styles.badge, badge.tone === 'warning' ? styles.badgeWarning : styles.badgeNeutral]}>
              <Text style={[styles.badgeText, badge.tone === 'warning' ? styles.badgeTextWarning : styles.badgeTextNeutral]}>
                {badge.label}
              </Text>
            </View>
          ) : null}
        </View>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
    </Pressable>
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
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: spacing.md,
    },
    pressed: {
      opacity: 0.86,
    },
    disabled: {
      opacity: 0.7,
    },
    copy: {
      flex: 1,
      gap: 4,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    title: {
      flex: 1,
      fontSize: typography.bodyLarge,
      fontWeight: '600',
      color: colors.text,
    },
    subtitle: {
      fontSize: typography.body,
      color: colors.textSecondary,
    },
    meta: {
      fontSize: typography.caption,
      color: colors.textMuted,
    },
    badge: {
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    badgeNeutral: {
      backgroundColor: colors.brandSoft,
    },
    badgeWarning: {
      backgroundColor: colors.surfaceAlt,
    },
    badgeText: {
      fontSize: typography.caption,
      fontWeight: '600',
    },
    badgeTextNeutral: {
      color: colors.brandContrast,
    },
    badgeTextWarning: {
      color: colors.warning,
    },
  });
}

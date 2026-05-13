import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useAccountingTheme } from './use-accounting-theme.js';

/** @typedef {import('react-native').KeyboardTypeOptions} KeyboardTypeOptions */
/** @typedef {'none' | 'sentences' | 'words' | 'characters'} AutoCapitalize */
/** @typedef {import('./use-accounting-theme.js').AccountingThemeColors} AccountingThemeColors */
/** @typedef {import('./use-accounting-theme.js').AccountingThemeSpacing} AccountingThemeSpacing */
/** @typedef {import('./use-accounting-theme.js').AccountingThemeRadius} AccountingThemeRadius */
/** @typedef {import('./use-accounting-theme.js').AccountingThemeTypography} AccountingThemeTypography */

/**
 * @param {{
 *   label: string,
 *   value: string,
 *   onChangeText: (value: string) => void,
 *   placeholder?: string | undefined,
 *   error?: string | null | undefined,
 *   secureTextEntry?: boolean | undefined,
 *   multiline?: boolean | undefined,
 *   autoCapitalize?: AutoCapitalize | undefined,
 *   keyboardType?: KeyboardTypeOptions | undefined,
 *   editable?: boolean | undefined,
 * }} props
 */
export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry,
  multiline,
  autoCapitalize = 'none',
  keyboardType = 'default',
  editable = true,
}) {
  const { colors, spacing, radius, typography } = useAccountingTheme();
  const themedStyles = createStyles(colors, spacing, radius, typography);

  return (
    <View style={themedStyles.container}>
      <Text style={themedStyles.label}>{label}</Text>
      <TextInput
        autoCapitalize={autoCapitalize}
        editable={editable}
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry}
        style={[
          themedStyles.input,
          multiline ? themedStyles.multiline : null,
          error ? themedStyles.inputError : null,
          !editable ? themedStyles.inputDisabled : null,
        ]}
        value={value}
      />
      {error ? <Text style={themedStyles.error}>{error}</Text> : null}
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
      gap: spacing.xs,
    },
    label: {
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.text,
    },
    input: {
      minHeight: 48,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: typography.bodyLarge,
      color: colors.text,
    },
    multiline: {
      minHeight: 96,
      textAlignVertical: 'top',
    },
    inputError: {
      borderColor: colors.danger,
    },
    inputDisabled: {
      backgroundColor: colors.surfaceAlt,
      color: colors.textSecondary,
    },
    error: {
      fontSize: typography.caption,
      color: colors.danger,
    },
  });
}

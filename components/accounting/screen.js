import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { useAccountingTheme } from './use-accounting-theme.js';

/** @typedef {import('react').ReactNode} ReactNode */
/** @typedef {import('react-native').StyleProp<import('react-native').ViewStyle>} ViewStyleProp */
/** @typedef {import('./use-accounting-theme.js').AccountingThemeColors} AccountingThemeColors */
/** @typedef {import('./use-accounting-theme.js').AccountingThemeSpacing} AccountingThemeSpacing */

/**
 * @param {{
 *   children?: ReactNode,
 *   scrollable?: boolean | undefined,
 *   contentContainerStyle?: ViewStyleProp,
 *   style?: ViewStyleProp,
 * }} props
 */
export function AccountingScreen({
  children,
  scrollable = true,
  contentContainerStyle,
  style,
}) {
  const { colors, spacing } = useAccountingTheme();
  const styles = createStyles(colors, spacing);
  const content = (
    <View style={[styles.content, contentContainerStyle]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      {scrollable ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

/**
 * @param {AccountingThemeColors} colors
 * @param {AccountingThemeSpacing} spacing
 */
function createStyles(colors, spacing) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.xl,
      gap: spacing.lg,
    },
  });
}

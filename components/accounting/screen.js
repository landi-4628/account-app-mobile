import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { useAccountingTheme } from './use-accounting-theme.js';

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

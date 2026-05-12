import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { accountingTheme, accountingLightColors } from '@/constants/accounting-theme';

export function AccountingScreen({
  children,
  scrollable = true,
  contentContainerStyle,
  style,
}) {
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: accountingLightColors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: accountingTheme.spacing.md,
    paddingTop: accountingTheme.spacing.md,
    paddingBottom: accountingTheme.spacing.xl,
    gap: accountingTheme.spacing.lg,
  },
});

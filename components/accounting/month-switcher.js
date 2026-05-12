import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { accountingLightColors, accountingTheme } from '@/constants/accounting-theme';
import { formatAccountingMonth } from './helpers.js';

export function MonthSwitcher({ months, value, onChange }) {
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

const styles = StyleSheet.create({
  container: {
    gap: accountingTheme.spacing.sm,
  },
  chip: {
    minWidth: 108,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: accountingTheme.radius.pill,
    borderWidth: 1,
    borderColor: accountingLightColors.border,
    backgroundColor: accountingLightColors.surface,
    paddingHorizontal: accountingTheme.spacing.md,
  },
  chipActive: {
    borderColor: accountingLightColors.brand,
    backgroundColor: accountingLightColors.brandSoft,
  },
  chipPressed: {
    opacity: 0.8,
  },
  label: {
    fontSize: accountingTheme.typography.body,
    fontWeight: '600',
    color: accountingLightColors.textSecondary,
  },
  labelActive: {
    color: accountingLightColors.brandContrast,
  },
});

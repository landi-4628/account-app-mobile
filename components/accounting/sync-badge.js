import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { accountingLightColors, accountingTheme } from '@/constants/accounting-theme';
import { getSyncBadgeState } from './helpers.js';

const toneStyles = {
  success: {
    container: {
      backgroundColor: accountingLightColors.brandSoft,
    },
    text: {
      color: accountingLightColors.brandContrast,
    },
  },
  warning: {
    container: {
      backgroundColor: '#FCEFD8',
    },
    text: {
      color: accountingLightColors.warning,
    },
  },
  danger: {
    container: {
      backgroundColor: '#F9E0DA',
    },
    text: {
      color: accountingLightColors.danger,
    },
  },
};

export function SyncBadge({ status, pendingCount = 0, failedCount = 0, label }) {
  const state = getSyncBadgeState(status, { pendingCount, failedCount });
  const tone = toneStyles[state.tone];

  return (
    <View style={[styles.badge, tone.container]}>
      <Text style={[styles.text, tone.text]}>{label ?? state.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: accountingTheme.radius.pill,
    paddingHorizontal: accountingTheme.spacing.sm,
    paddingVertical: 6,
  },
  text: {
    fontSize: accountingTheme.typography.caption,
    fontWeight: '700',
  },
});

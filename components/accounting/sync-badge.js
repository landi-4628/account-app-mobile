import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getSyncBadgeState } from './helpers.js';
import { getSyncToneStyles, useAccountingTheme } from './use-accounting-theme.js';

export function SyncBadge({ status, pendingCount = 0, failedCount = 0, label }) {
  const { colors, spacing, radius, typography } = useAccountingTheme();
  const styles = createStyles(spacing, radius, typography);
  const toneStyles = getSyncToneStyles(colors);
  const state = getSyncBadgeState(status, { pendingCount, failedCount });
  const tone = toneStyles[state.tone];

  return (
    <View style={[styles.badge, tone.container]}>
      <Text style={[styles.text, tone.text]}>{label ?? state.label}</Text>
    </View>
  );
}

function createStyles(spacing, radius, typography) {
  return StyleSheet.create({
    badge: {
      alignSelf: 'flex-start',
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
    },
    text: {
      fontSize: typography.caption,
      fontWeight: '700',
    },
  });
}

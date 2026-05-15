import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useAccountingTheme } from './use-accounting-theme.js';

/**
 * @param {{
 *   iconName?: string | undefined,
 *   size?: number | undefined,
 *   active?: boolean | undefined,
 *   color?: string | undefined,
 *   backgroundColor?: string | undefined,
 * }} props
 */
export function CategoryIcon({
  iconName = 'apps-outline',
  size = 28,
  active = false,
  color = '#5E615C',
  backgroundColor,
}) {
  const { colors } = useAccountingTheme();

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size + 26,
          height: size + 26,
          borderRadius: (size + 26) / 2,
          backgroundColor: backgroundColor ?? (active ? colors.brandSoft : colors.surfaceAlt),
        },
      ]}>
      <Ionicons color={color} name={/** @type {any} */ (iconName)} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

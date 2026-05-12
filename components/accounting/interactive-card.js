import React from 'react';
import { Pressable } from 'react-native';

import { getCardPressStyle } from './interactive-card-support.js';

const NOOP = () => {};

/**
 * @param {{
 *   children: React.ReactNode,
 *   style?: import('react-native').StyleProp<import('react-native').ViewStyle>,
 *   onPress?: (() => void) | undefined,
 *   shadowStyle?: import('react-native').ViewStyle | undefined,
 *   accessibilityRole?: 'button' | undefined,
 * }} props
 */
export function InteractiveCard({
  children,
  style,
  onPress,
  shadowStyle,
  accessibilityRole,
}) {
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      onPress={onPress ?? NOOP}
      style={({ pressed }) => [style, getCardPressStyle(shadowStyle, pressed)]}>
      {children}
    </Pressable>
  );
}

/**
 * @typedef {import('react-native').ViewStyle} ViewStyle
 */

/**
 * @param {ViewStyle | undefined} cardShadow
 * @param {boolean} pressed
 * @returns {ViewStyle}
 */
export function getCardPressStyle(cardShadow, pressed) {
  const shadowOpacity = typeof cardShadow?.shadowOpacity === 'number' ? cardShadow.shadowOpacity : 0;
  const shadowRadius = typeof cardShadow?.shadowRadius === 'number' ? cardShadow.shadowRadius : 0;
  const shadowOffsetHeight =
    typeof cardShadow?.shadowOffset?.height === 'number' ? cardShadow.shadowOffset.height : 0;
  const elevation = typeof cardShadow?.elevation === 'number' ? cardShadow.elevation : 0;

  if (!pressed) {
    return {
      transform: [{ scale: 1 }],
      ...cardShadow,
    };
  }

  return {
    transform: [{ scale: 0.985 }],
    ...cardShadow,
    shadowOpacity: Number((shadowOpacity * 0.5).toFixed(3)),
    shadowRadius: Math.max(0, shadowRadius - 4),
    shadowOffset: {
      width: 0,
      height: Math.max(0, shadowOffsetHeight - 2),
    },
    elevation: Math.max(0, elevation - 1),
  };
}

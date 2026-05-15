/**
 * @param {{ md: number, lg: number, xl: number }} spacing
 */
export function getAccountingScreenContentStyle(spacing) {
  return {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  };
}

/**
 * @param {{ md: number, xl: number }} _spacing
 */
export function getAccountingScreenHeaderlessContentStyle(_spacing) {
  return {
    paddingTop: 0,
  };
}

/**
 * @param {boolean} fillAvailableHeight
 * @returns {{ flex: 1 } | null}
 */
export function getAccountingScreenFillStyle(fillAvailableHeight) {
  if (!fillAvailableHeight) {
    return null;
  }

  return {
    flex: 1,
  };
}

export function getAccountingScreenSafeAreaEdges() {
  return /** @type {const} */ (['top', 'left', 'right']);
}

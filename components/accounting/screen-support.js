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

export function getAccountingScreenSafeAreaEdges() {
  return /** @type {const} */ (['top', 'left', 'right']);
}

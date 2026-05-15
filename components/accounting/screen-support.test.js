import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getAccountingScreenContentStyle,
  getAccountingScreenFillStyle,
  getAccountingScreenHeaderlessContentStyle,
  getAccountingScreenSafeAreaEdges,
} from './screen-support.js';

test('keeps accounting screen content top-aligned inside the scroll container', () => {
  const spacing = {
    md: 16,
    lg: 20,
    xl: 24,
  };

  assert.deepEqual(getAccountingScreenContentStyle(spacing), {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 20,
  });
});

test('expands non-scroll accounting screen content to full height for overlay layouts', () => {
  assert.deepEqual(getAccountingScreenFillStyle(true), {
    flex: 1,
  });
  assert.deepEqual(getAccountingScreenFillStyle(false), null);
});

test('provides a tighter content style for stack-header screens', () => {
  const spacing = {
    md: 16,
    xl: 24,
  };

  assert.deepEqual(getAccountingScreenHeaderlessContentStyle(spacing), {
    paddingTop: 0,
  });
});

test('applies top safe-area edges for the accounting screens', () => {
  assert.deepEqual(getAccountingScreenSafeAreaEdges(), ['top', 'left', 'right']);
});

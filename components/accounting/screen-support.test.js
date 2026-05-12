import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getAccountingScreenContentStyle,
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

test('applies top safe-area edges for the accounting screens', () => {
  assert.deepEqual(getAccountingScreenSafeAreaEdges(), ['top', 'left', 'right']);
});

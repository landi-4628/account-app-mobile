import test from 'node:test';
import assert from 'node:assert/strict';

import { getMonthSwitcherScrollStyle } from './month-switcher-support.js';

test('keeps the month switcher from stretching vertically inside scroll layouts', () => {
  assert.deepEqual(getMonthSwitcherScrollStyle(), {
    flexGrow: 0,
  });
});

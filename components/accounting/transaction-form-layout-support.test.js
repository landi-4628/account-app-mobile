import test from 'node:test';
import assert from 'node:assert/strict';

import { getTransactionFormContainerStyle } from './transaction-form-layout-support.js';

test('returns a flat transaction form container without card chrome', () => {
  const spacing = {
    sm: 12,
    lg: 20,
  };

  assert.deepEqual(getTransactionFormContainerStyle(spacing), {
    gap: 12,
  });
});

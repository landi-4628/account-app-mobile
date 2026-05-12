import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatAccountingCurrency,
  formatAccountingMonth,
  formatTransactionDateTime,
  getSyncBadgeState,
} from './helpers.js';

test('formats accounting currency in CNY with sign support', () => {
  assert.equal(formatAccountingCurrency(1440520), '¥14,405.20');
  assert.equal(formatAccountingCurrency(-3200), '-¥32.00');
});

test('formats ISO month keys into a compact label', () => {
  assert.equal(formatAccountingMonth('2026-05'), 'May 2026');
});

test('formats transaction timestamps into a readable local label', () => {
  assert.equal(formatTransactionDateTime('2026-05-11T12:30:00+08:00'), 'May 11, 12:30');
});

test('maps sync states to reusable visual metadata', () => {
  assert.deepEqual(getSyncBadgeState('pending', { pendingCount: 2 }), {
    tone: 'warning',
    label: '2 pending',
  });
  assert.deepEqual(getSyncBadgeState('failed', { failedCount: 1 }), {
    tone: 'danger',
    label: '1 failed',
  });
  assert.deepEqual(getSyncBadgeState('synced'), {
    tone: 'success',
    label: 'Synced',
  });
});

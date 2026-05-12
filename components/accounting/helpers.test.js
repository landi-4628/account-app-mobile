import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatAccountingCurrency,
  formatAccountingMonth,
  formatTransactionDateTime,
  getSyncBadgeState,
} from './helpers.js';

test('formats accounting currency in CNY with sign support', () => {
  assert.equal(formatAccountingCurrency(1440520), '\u00A514,405.20');
  assert.equal(formatAccountingCurrency(-3200), '-\u00A532.00');
});

test('formats ISO month keys into a compact label', () => {
  assert.equal(formatAccountingMonth('2026-05'), '2026年5月');
});

test('formats transaction timestamps in the supplied ledger timezone', () => {
  const value = '2026-05-11T12:30:00+08:00';

  assert.equal(formatTransactionDateTime(value, 'Asia/Shanghai'), '5月11日 12:30');
  assert.equal(formatTransactionDateTime(value, 'UTC'), '5月11日 04:30');
});

test('maps sync states to reusable visual metadata', () => {
  assert.deepEqual(getSyncBadgeState('pending', { pendingCount: 2 }), {
    tone: 'warning',
    label: '待同步 2 条',
  });
  assert.deepEqual(getSyncBadgeState('failed', { failedCount: 1 }), {
    tone: 'danger',
    label: '失败 1 条',
  });
  assert.deepEqual(getSyncBadgeState('synced'), {
    tone: 'success',
    label: '已同步',
  });
});

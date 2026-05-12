import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getAccountingCategoryLabel,
  getAccountTypeLabel,
  getSyncActionLabel,
  getSyncSummaryDetail,
} from './statistics-profile-support.js';

test('maps accounting category ids to display labels', () => {
  assert.equal(getAccountingCategoryLabel('cat-groceries'), '日用采购');
  assert.equal(getAccountingCategoryLabel('cat-freelance'), '副业');
});

test('maps account types to readable labels', () => {
  assert.equal(getAccountTypeLabel('cash'), 'Cash');
  assert.equal(getAccountTypeLabel('wechat'), 'WeChat wallet');
});

test('builds sync detail copy from updated time and pending or failed counts', () => {
  assert.equal(
    getSyncSummaryDetail(
      {
        status: 'failed',
        pendingCount: 1,
        failedCount: 1,
        updatedAt: '2026-05-11T12:40:00+08:00',
      },
      'Asia/Shanghai'
    ),
    'Last update May 11, 12:40 | 1 failed, 1 pending'
  );

  assert.equal(
    getSyncSummaryDetail(
      {
        status: 'synced',
        pendingCount: 0,
        failedCount: 0,
        updatedAt: '2026-05-11T12:40:00+08:00',
      },
      'Asia/Shanghai'
    ),
    'Last update May 11, 12:40 | All changes synced'
  );
});

test('maps sync states to the expected profile action labels', () => {
  assert.equal(getSyncActionLabel('failed'), 'Retry sync');
  assert.equal(getSyncActionLabel('pending'), 'Sync now');
  assert.equal(getSyncActionLabel('synced'), null);
});

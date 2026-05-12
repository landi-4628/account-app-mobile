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
  assert.equal(getAccountTypeLabel('cash'), '现金');
  assert.equal(getAccountTypeLabel('wechat'), '微信');
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
    '最近更新 5月11日 12:40 | 失败 1 条，待同步 1 条'
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
    '最近更新 5月11日 12:40 | 全部变更已同步'
  );
});

test('maps sync states to the expected profile action labels', () => {
  assert.equal(getSyncActionLabel('failed'), '重试同步');
  assert.equal(getSyncActionLabel('pending'), '立即同步');
  assert.equal(getSyncActionLabel('synced'), null);
});

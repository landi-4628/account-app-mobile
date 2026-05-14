import assert from 'node:assert/strict';
import test from 'node:test';

import { accountingCopy } from '../../constants/accounting-copy.js';
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

test('builds auto-sync detail copy for pending local changes', () => {
  assert.equal(
    getSyncSummaryDetail(
      {
        status: 'pending',
        pendingCount: 2,
        failedCount: 0,
        updatedAt: '2026-05-11T12:40:00+08:00',
      },
      'Asia/Shanghai',
      {
        isAutoSyncEnabled: true,
      }
    ),
    '最近更新 5月11日 12:40 | 已保存到本地，有网时自动同步，待同步 2 条'
  );
});

test('builds local-only detail copy when auto sync is disabled', () => {
  assert.equal(
    getSyncSummaryDetail(
      {
        status: 'synced',
        pendingCount: 3,
        failedCount: 0,
        updatedAt: '2026-05-11T12:40:00+08:00',
      },
      'Asia/Shanghai',
      {
        isAutoSyncEnabled: false,
      }
    ),
    '最近更新 5月11日 12:40 | 仅保存在本地，可稍后手动同步，待同步 3 条'
  );
});

test('maps sync states to the expected profile action labels', () => {
  assert.equal(getSyncActionLabel('failed'), '重试同步');
  assert.equal(getSyncActionLabel('pending'), '立即同步');
  assert.equal(getSyncActionLabel('synced'), null);
});

test('builds sync action labels for auto-sync and local-only modes', () => {
  assert.equal(
    getSyncActionLabel('pending', {
      isAutoSyncEnabled: true,
    }),
    '立即同步'
  );
  assert.equal(
    getSyncActionLabel('failed', {
      isAutoSyncEnabled: true,
    }),
    '重试同步'
  );
  assert.equal(
    getSyncActionLabel('pending', {
      isAutoSyncEnabled: false,
      hasPendingChanges: true,
    }),
    '手动同步'
  );
  assert.equal(
    getSyncActionLabel('failed', {
      isAutoSyncEnabled: false,
      hasPendingChanges: true,
    }),
    accountingCopy.actions.retrySync
  );
  assert.equal(
    getSyncActionLabel('synced', {
      isAutoSyncEnabled: false,
      hasPendingChanges: false,
    }),
    null
  );
});

test('marks manual sync as in progress while a sync request is running', () => {
  assert.equal(
    getSyncActionLabel('pending', {
      isAutoSyncEnabled: false,
      hasPendingChanges: true,
      isSyncInFlight: true,
    }),
    '同步中...'
  );
});

test('shows unavailable manual sync copy when remote sync is not available', () => {
  assert.equal(
    getSyncActionLabel('pending', {
      isAutoSyncEnabled: false,
      hasPendingChanges: true,
      canSyncRemotely: false,
    }),
    '暂不可同步'
  );
  assert.equal(
    getSyncSummaryDetail(
      {
        status: 'pending',
        pendingCount: 2,
        failedCount: 0,
        updatedAt: '2026-05-11T12:40:00+08:00',
      },
      'Asia/Shanghai',
      {
        isAutoSyncEnabled: false,
        canSyncRemotely: false,
      }
    ),
    '最近更新 5月11日 12:40 | 仅保存在本地，当前不可远端同步，请稍后再试，待同步 2 条'
  );
});

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildProfileHubSections,
  buildProfileOverviewLinks,
  buildProfileCapabilityNotice,
  getProfileSyncModeCopy,
} from './profile-screen-support.js';

test('builds chinese app sections for the profile hub', () => {
  const sections = buildProfileHubSections({
    availability: {
      canChangePassword: false,
      canLogin: true,
      canRegister: false,
      canUpdateProfile: true,
    },
  });

  assert.deepEqual(
    sections.map((section) => ({
      title: section.title,
      rows: section.rows.map((row) => ({
        title: row.title,
        meta: row.meta,
        badge: row.badge?.label ?? null,
        disabled: row.disabled ?? false,
      })),
    })),
    [
      {
        title: '个人资料',
        rows: [
          {
            title: '编辑个人信息',
            meta: '可用',
            badge: null,
            disabled: false,
          },
        ],
      },
      {
        title: '账户与安全',
        rows: [
          {
            title: '修改密码',
            meta: '暂不可用',
            badge: '稍后开放',
            disabled: true,
          },
          {
            title: '登录',
            meta: '可用',
            badge: null,
            disabled: false,
          },
          {
            title: '注册',
            meta: '暂不可用',
            badge: '稍后开放',
            disabled: true,
          },
        ],
      },
      {
        title: '账本与分类',
        rows: [
          {
            title: '账本管理',
            meta: '进入',
            badge: null,
            disabled: false,
          },
          {
            title: '分类管理',
            meta: '进入',
            badge: null,
            disabled: false,
          },
        ],
      },
    ]
  );
});

test('profile hub rows expose stable unique keys for rendering', () => {
  const sections = buildProfileHubSections({
    availability: {
      canChangePassword: false,
      canLogin: true,
      canRegister: true,
      canUpdateProfile: false,
    },
  });

  const keys = sections.flatMap((section) => section.rows.map((row) => row.key));

  assert.equal(keys.every((key) => typeof key === 'string' && key.length > 0), true);
  assert.equal(new Set(keys).size, keys.length);
});

test('builds chinese overview links for the my page', () => {
  assert.deepEqual(buildProfileOverviewLinks(), [
    {
      title: '个人资料与安全',
      subtitle: '查看资料、修改密码、登录和注册',
      href: '/profile',
    },
    {
      title: '分类管理',
      subtitle: '查看收入和支出分类',
      href: '/categories',
    },
  ]);
});

test('builds chinese capability notice copy', () => {
  assert.deepEqual(buildProfileCapabilityNotice(), {
    tone: 'warning',
    title: '部分功能暂未接入',
    description: '页面可以进入，但相关操作暂时不可用。',
  });
});

test('describes sync mode in chinese app copy', () => {
  assert.equal(getProfileSyncModeCopy(true), '自动同步');
  assert.equal(getProfileSyncModeCopy(false), '本地优先，手动同步');
});

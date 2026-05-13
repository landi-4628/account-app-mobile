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
    activeAccountCount: 3,
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
            title: '账户管理',
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

test('builds chinese overview links for the my page', () => {
  assert.deepEqual(buildProfileOverviewLinks(), [
    {
      title: '个人资料与安全',
      subtitle: '查看资料、修改密码、登录和注册',
      href: '/profile',
    },
    {
      title: '账户与分类',
      subtitle: '管理账户，查看收入和支出分类',
      href: '/accounts',
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

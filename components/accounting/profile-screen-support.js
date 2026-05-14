function buildStatusMeta(isAvailable) {
  return isAvailable ? '\u53ef\u7528' : '\u6682\u4e0d\u53ef\u7528';
}

function buildStatusBadge(isAvailable) {
  return isAvailable ? null : { label: '\u7a0d\u540e\u5f00\u653e', tone: 'warning' };
}

export function buildProfileHubSections({ availability }) {
  return [
    {
      title: '\u4e2a\u4eba\u8d44\u6599',
      rows: [
        {
          key: 'profile-edit',
          title: '\u7f16\u8f91\u4e2a\u4eba\u4fe1\u606f',
          subtitle: '\u59d3\u540d\u3001\u90ae\u7bb1\u3001\u8d26\u672c\u548c\u65f6\u533a',
          meta: buildStatusMeta(availability.canUpdateProfile),
          badge: buildStatusBadge(availability.canUpdateProfile),
          disabled: !availability.canUpdateProfile,
          href: '/profile/edit',
        },
      ],
    },
    {
      title: '\u8d26\u6237\u4e0e\u5b89\u5168',
      rows: [
        {
          key: 'password-change',
          title: '\u4fee\u6539\u5bc6\u7801',
          subtitle: '\u66f4\u65b0\u767b\u5f55\u5bc6\u7801',
          meta: buildStatusMeta(availability.canChangePassword),
          badge: buildStatusBadge(availability.canChangePassword),
          disabled: !availability.canChangePassword,
          href: '/profile/change-password',
        },
        {
          key: 'login',
          title: '\u767b\u5f55',
          subtitle: '\u8fde\u63a5\u5df2\u6709\u8d26\u53f7',
          meta: buildStatusMeta(availability.canLogin),
          badge: buildStatusBadge(availability.canLogin),
          disabled: !availability.canLogin,
          href: '/auth/login',
        },
        {
          key: 'register',
          title: '\u6ce8\u518c',
          subtitle: '\u521b\u5efa\u65b0\u8d26\u53f7',
          meta: buildStatusMeta(availability.canRegister),
          badge: buildStatusBadge(availability.canRegister),
          disabled: !availability.canRegister,
          href: '/auth/register',
        },
      ],
    },
    {
      title: '\u8d26\u672c\u4e0e\u5206\u7c7b',
      rows: [
        {
          key: 'ledger-management',
          title: '\u8d26\u672c\u7ba1\u7406',
          subtitle: '\u67e5\u770b\u5f53\u524d\u8d26\u672c\u3001\u521b\u5efa\u8d26\u672c\u5e76\u5207\u6362',
          meta: '\u8fdb\u5165',
          badge: null,
          disabled: false,
          href: '/profile/ledger',
        },
        {
          key: 'category-management',
          title: '\u5206\u7c7b\u7ba1\u7406',
          subtitle: '\u67e5\u770b\u6536\u5165\u548c\u652f\u51fa\u5206\u7c7b',
          meta: '\u8fdb\u5165',
          badge: null,
          disabled: false,
          href: '/categories',
        },
      ],
    },
  ];
}

export function buildProfileOverviewLinks() {
  return [
    {
      title: '\u4e2a\u4eba\u8d44\u6599\u4e0e\u5b89\u5168',
      subtitle: '\u67e5\u770b\u8d44\u6599\u3001\u4fee\u6539\u5bc6\u7801\u3001\u767b\u5f55\u548c\u6ce8\u518c',
      href: '/profile',
    },
    {
      title: '\u5206\u7c7b\u7ba1\u7406',
      subtitle: '\u67e5\u770b\u6536\u5165\u548c\u652f\u51fa\u5206\u7c7b',
      href: '/categories',
    },
  ];
}

export function buildProfileCapabilityNotice() {
  return {
    tone: 'warning',
    title: '\u90e8\u5206\u529f\u80fd\u6682\u672a\u63a5\u5165',
    description: '\u9875\u9762\u53ef\u4ee5\u8fdb\u5165\uff0c\u4f46\u76f8\u5173\u64cd\u4f5c\u6682\u65f6\u4e0d\u53ef\u7528\u3002',
  };
}

export function getProfileSyncModeCopy(autoSyncEnabled) {
  return autoSyncEnabled ? '\u81ea\u52a8\u540c\u6b65' : '\u672c\u5730\u4f18\u5148\uff0c\u624b\u52a8\u540c\u6b65';
}

export function buildProfileSyncModeRows({ autoSyncEnabled, setAutoSyncEnabled }) {
  return [
    {
      key: 'sync-auto',
      title: '\u81ea\u52a8\u540c\u6b65',
      subtitle: '\u6709\u53ef\u540c\u6b65\u6570\u636e\u65f6\u81ea\u52a8\u53d1\u8d77\u540c\u6b65',
      meta: autoSyncEnabled ? '\u5f53\u524d' : '\u5207\u6362',
      badge: autoSyncEnabled ? { label: '\u5df2\u542f\u7528', tone: 'neutral' } : null,
      disabled: autoSyncEnabled,
      onPress: () => setAutoSyncEnabled(true),
    },
    {
      key: 'sync-manual',
      title: '\u672c\u5730\u4f18\u5148\uff0c\u624b\u52a8\u540c\u6b65',
      subtitle: '\u4ec5\u5728\u4f60\u4e3b\u52a8\u64cd\u4f5c\u65f6\u540c\u6b65\u5f85\u5904\u7406\u6570\u636e',
      meta: autoSyncEnabled ? '\u5207\u6362' : '\u5f53\u524d',
      badge: autoSyncEnabled ? null : { label: '\u5df2\u542f\u7528', tone: 'neutral' },
      disabled: !autoSyncEnabled,
      onPress: () => setAutoSyncEnabled(false),
    },
  ];
}

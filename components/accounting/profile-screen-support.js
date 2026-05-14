function buildStatusMeta(isAvailable) {
  return isAvailable ? '可用' : '暂不可用';
}

function buildStatusBadge(isAvailable) {
  return isAvailable ? null : { label: '稍后开放', tone: 'warning' };
}

export function buildProfileHubSections({ availability }) {
  return [
    {
      title: '个人资料',
      rows: [
        {
          title: '编辑个人信息',
          subtitle: '姓名、邮箱、账本和时区',
          meta: buildStatusMeta(availability.canUpdateProfile),
          badge: buildStatusBadge(availability.canUpdateProfile),
          disabled: !availability.canUpdateProfile,
          href: '/profile/edit',
        },
      ],
    },
    {
      title: '账户与安全',
      rows: [
        {
          title: '修改密码',
          subtitle: '更新登录密码',
          meta: buildStatusMeta(availability.canChangePassword),
          badge: buildStatusBadge(availability.canChangePassword),
          disabled: !availability.canChangePassword,
          href: '/profile/change-password',
        },
        {
          title: '登录',
          subtitle: '连接已有账号',
          meta: buildStatusMeta(availability.canLogin),
          badge: buildStatusBadge(availability.canLogin),
          disabled: !availability.canLogin,
          href: '/auth/login',
        },
        {
          title: '注册',
          subtitle: '创建新账号',
          meta: buildStatusMeta(availability.canRegister),
          badge: buildStatusBadge(availability.canRegister),
          disabled: !availability.canRegister,
          href: '/auth/register',
        },
      ],
    },
    {
      title: '账本与分类',
      rows: [
        {
          title: '账本管理',
          subtitle: '查看当前账本、创建账本并切换',
          meta: '进入',
          badge: null,
          disabled: false,
          href: '/profile/ledger',
        },
        {
          title: '分类管理',
          subtitle: '查看收入和支出分类',
          meta: '进入',
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
      title: '个人资料与安全',
      subtitle: '查看资料、修改密码、登录和注册',
      href: '/profile',
    },
    {
      title: '分类管理',
      subtitle: '查看收入和支出分类',
      href: '/categories',
    },
  ];
}

export function buildProfileCapabilityNotice() {
  return {
    tone: 'warning',
    title: '部分功能暂未接入',
    description: '页面可以进入，但相关操作暂时不可用。',
  };
}

export function getProfileSyncModeCopy(autoSyncEnabled) {
  return autoSyncEnabled ? '自动同步' : '本地优先，手动同步';
}

export function buildProfileSyncModeRows({ autoSyncEnabled, setAutoSyncEnabled }) {
  return [
    {
      title: '自动同步',
      subtitle: '有可同步数据时自动发起同步',
      meta: autoSyncEnabled ? '当前' : '切换',
      badge: autoSyncEnabled ? { label: '已启用', tone: 'neutral' } : null,
      disabled: autoSyncEnabled,
      onPress: () => setAutoSyncEnabled(true),
    },
    {
      title: '本地优先，手动同步',
      subtitle: '仅在你主动操作时同步待处理数据',
      meta: autoSyncEnabled ? '切换' : '当前',
      badge: autoSyncEnabled ? null : { label: '已启用', tone: 'neutral' },
      disabled: !autoSyncEnabled,
      onPress: () => setAutoSyncEnabled(false),
    },
  ];
}

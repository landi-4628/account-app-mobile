/** @typedef {import('@/types/accounting').CategoryId} CategoryId */

export const accountingCopy = {
  appName: '清简记账',
  monthLabel: '2026年5月',
  tabs: {
    home: '首页',
    details: '明细',
    statistics: '统计',
    profile: '我的',
  },
  actions: {
    addEntry: '记一笔',
    accounts: '账户管理',
    categories: '分类管理',
    syncNow: '立即同步',
    expand: '展开更多',
    collapse: '收起',
    save: '保存',
    edit: '编辑',
    delete: '删除',
    create: '新增',
  },
  entryType: {
    expense: '支出',
    income: '收入',
  },
  home: {
    title: '五月账本',
    subtitle: '今天也记清楚一点',
    balanceLabel: '本月结余',
    recentTransactions: '最近记录',
    emptyTitle: '还没有记录',
    emptyDescription: '先记第一笔，账本就开始有意义了',
  },
  statistics: {
    expenseSectionTitle: '支出分类',
    incomeSectionTitle: '收入分类',
  },
  profile: {
    ledgerLabel: '默认账本',
    syncPendingSuffix: '条记录待同步',
    syncFailedSuffix: '条记录同步失败',
  },
  transactionNotes: {
    lunch: '午饭',
    salary: '五月工资',
    subway: '通勤地铁',
    groceries: '周末采购',
    coffee: '咖啡',
    freelance: '项目尾款',
  },
};

/** @type {Record<CategoryId, string>} */
export const accountingCategoryLabels = {
  'cat-food': '餐饮',
  'cat-commute': '通勤',
  'cat-groceries': '日用采购',
  'cat-coffee': '咖啡茶饮',
  'cat-salary': '工资',
  'cat-freelance': '副业',
};

/** @type {Record<string, string>} */
export const accountingMonthLabels = {
  '2026-05': '2026年5月',
  '2026-04': '2026年4月',
};

/** @type {import('@/types/accounting').LedgerAccount[]} */
export const mockAccounts = [
  {
    id: 'acc-cash',
    name: '现金',
    type: 'cash',
    initialBalance: 75620,
    currentBalance: 75620,
    isActive: true,
  },
  {
    id: 'acc-bank',
    name: '招商银行卡',
    type: 'bank',
    initialBalance: 96000,
    currentBalance: 1543120,
    isActive: true,
  },
  {
    id: 'acc-alipay',
    name: '支付宝',
    type: 'alipay',
    initialBalance: 118900,
    currentBalance: 118300,
    isActive: true,
  },
  {
    id: 'acc-wechat',
    name: '微信钱包',
    type: 'wechat',
    initialBalance: 96300,
    currentBalance: 90300,
    isActive: true,
  },
];

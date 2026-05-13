import { accountingCategoryLabels, accountingCopy, accountingMonthLabels } from '../../constants/accounting-copy.js';

import { formatAccountingMonth } from './helpers.js';

/**
 * @typedef {import('@/types/accounting').LedgerCategory} LedgerCategory
 * @typedef {import('@/types/accounting').TransactionRecord} TransactionRecord
 */

const dayLabelFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: 'numeric',
  day: 'numeric',
  timeZone: 'UTC',
});

/**
 * @param {string} month
 * @returns {string}
 */
export function getAccountingMonthLabel(month) {
  return accountingMonthLabels[month] ?? formatAccountingMonth(month);
}

/**
 * @param {LedgerCategory[]} categories
 * @returns {Map<string, string>}
 */
export function createCategoryNameMap(categories) {
  return new Map(
    categories.map((category) => [
      category.id,
      category.name ?? accountingCategoryLabels[category.id] ?? category.id,
    ])
  );
}

/**
 * @param {TransactionRecord[]} transactions
 * @param {string} timeZone
 * @param {string | Date=} now
 * @returns {Array<{
 *   key: string,
 *   label: string,
 *   totalIncome: number,
 *   totalExpense: number,
 *   transactions: TransactionRecord[],
 * }>}
 */
export function groupTransactionsByDay(transactions, timeZone, now = new Date()) {
  const nowDate = typeof now === 'string' ? new Date(now) : now;
  const todayKey = getDateKey(nowDate, timeZone);
  const yesterdayDate = new Date(nowDate);
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
  const yesterdayKey = getDateKey(yesterdayDate, timeZone);

  /** @type {Map<string, { key: string, label: string, totalIncome: number, totalExpense: number, transactions: TransactionRecord[] }>} */
  const groups = new Map();

  transactions.forEach((transaction) => {
    const key = getDateKey(new Date(transaction.transactionAt), timeZone);
    const group =
      groups.get(key) ??
      {
        key,
        label: getRelativeDateLabel(key, todayKey, yesterdayKey),
        totalIncome: 0,
        totalExpense: 0,
        transactions: [],
      };

    if (transaction.type === 'income') {
      group.totalIncome += transaction.amount;
    } else {
      group.totalExpense += transaction.amount;
    }

    group.transactions.push(transaction);
    groups.set(key, group);
  });

  return [...groups.values()].sort((left, right) => right.key.localeCompare(left.key));
}

/**
 * @param {{ income: number, expense: number, balance: number }} summary
 */
export function buildDetailsSummaryItems(summary) {
  return [
    { key: 'income', label: accountingCopy.entryType.income, value: summary.income, tone: 'income' },
    { key: 'expense', label: accountingCopy.entryType.expense, value: summary.expense, tone: 'expense' },
    { key: 'balance', label: '结余', value: summary.balance, tone: 'default' },
  ];
}

/**
 * @param {Date} value
 * @param {string} timeZone
 * @returns {string}
 */
function getDateKey(value, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(value);
}

/**
 * @param {string} value
 * @param {string} todayKey
 * @param {string} yesterdayKey
 * @returns {string}
 */
function getRelativeDateLabel(value, todayKey, yesterdayKey) {
  if (value === todayKey) {
    return '今天';
  }

  if (value === yesterdayKey) {
    return '昨天';
  }

  const [year, month, day] = value.split('-');

  return dayLabelFormatter
    .format(new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))))
    .replace('/', '月')
    .replace(/$/, '日');
}

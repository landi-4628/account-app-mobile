import { accountingCopy } from '../../constants/accounting-copy.js';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const monthFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

/**
 * @param {number} amount
 * @returns {string}
 */
export function formatAccountingCurrency(amount) {
  const sign = amount < 0 ? '-' : '';

  return `${sign}\u00A5${currencyFormatter.format(Math.abs(amount) / 100)}`;
}

/**
 * @param {string} month
 * @returns {string}
 */
export function formatAccountingMonth(month) {
  const [year, monthNumber] = month.split('-');
  const date = new Date(Date.UTC(Number(year), Number(monthNumber) - 1, 1));

  return monthFormatter.format(date).replace('/', '年').replace(/$/, '月');
}

/**
 * @param {string} value
 * @param {string=} timeZone
 * @returns {string}
 */
export function formatTransactionDateTime(value, timeZone = 'UTC') {
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  });
  const parts = formatter.formatToParts(new Date(value));
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  const day = parts.find((part) => part.type === 'day')?.value ?? '';
  const hour = parts.find((part) => part.type === 'hour')?.value ?? '';
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '';

  return `${month}月${day}日 ${hour}:${minute}`;
}

/**
 * @param {'synced' | 'pending' | 'failed'} status
 * @param {{ pendingCount?: number, failedCount?: number }=} counts
 * @returns {{ tone: 'success' | 'warning' | 'danger', label: string }}
 */
export function getSyncBadgeState(status, counts = {}) {
  if (status === 'failed') {
    return {
      tone: 'danger',
      label: `失败 ${counts.failedCount ?? 0} 条`,
    };
  }

  if (status === 'pending') {
    return {
      tone: 'warning',
      label: `${accountingCopy.syncStatus.pending} ${counts.pendingCount ?? 0} 条`,
    };
  }

  return {
    tone: 'success',
    label: accountingCopy.syncStatus.synced,
  };
}

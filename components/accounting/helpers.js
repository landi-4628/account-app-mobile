const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'CNY',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const transactionFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/**
 * @param {number} amount
 * @returns {string}
 */
export function formatAccountingCurrency(amount) {
  return currencyFormatter.format(amount / 100).replace('CN¥', '¥');
}

/**
 * @param {string} month
 * @returns {string}
 */
export function formatAccountingMonth(month) {
  const [year, monthNumber] = month.split('-');
  const date = new Date(Date.UTC(Number(year), Number(monthNumber) - 1, 1));

  return monthFormatter.format(date);
}

/**
 * @param {string} value
 * @returns {string}
 */
export function formatTransactionDateTime(value) {
  const parts = transactionFormatter.formatToParts(new Date(value));
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  const day = parts.find((part) => part.type === 'day')?.value ?? '';
  const hour = parts.find((part) => part.type === 'hour')?.value ?? '';
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '';

  return `${month} ${day}, ${hour}:${minute}`;
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
      label: `${counts.failedCount ?? 0} failed`,
    };
  }

  if (status === 'pending') {
    return {
      tone: 'warning',
      label: `${counts.pendingCount ?? 0} pending`,
    };
  }

  return {
    tone: 'success',
    label: 'Synced',
  };
}

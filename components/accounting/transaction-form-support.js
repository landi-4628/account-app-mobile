/** @typedef {import('@/types/accounting').EntryType} EntryType */
/** @typedef {import('@/types/accounting').SyncStatus} SyncStatus */

import { accountingCopy } from '../../constants/accounting-copy.js';

/**
 * @typedef {{
 *   value: string,
 *   label: string,
 *   type?: EntryType | undefined,
 *   isActive?: boolean | undefined,
 *   color?: string | undefined,
 *   iconName?: string | undefined,
 *   isSystem?: boolean | undefined,
 *   sortOrder?: number | undefined,
 * }} TransactionFormOption
 */

/**
 * @typedef {{
 *   type?: EntryType | undefined,
 *   amount?: number | undefined,
 *   categoryId?: string | undefined,
 *   accountId?: string | undefined,
 *   transactionAt?: string | undefined,
 *   note?: string | undefined,
 * }} TransactionFormInitialValues
 */

/**
 * @typedef {{
 *   type: EntryType,
 *   amountInput: string,
 *   categoryId: string,
 *   accountId: string,
 *   dateInput: string,
 *   timeInput: string,
 *   note: string,
 * }} TransactionFormDraft
 */

/**
 * @typedef {{
 *   amountInput?: string | undefined,
 *   categoryId?: string | undefined,
 *   accountId?: string | undefined,
 *   dateInput?: string | undefined,
 * }} TransactionFormErrors
 */

const DEFAULT_TIME_ZONE_OFFSET = '+00:00';
const DEFAULT_SYNC_STATUS = 'pending';
const DEFAULT_ENTRY_TYPE = 'expense';
const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_INPUT_PATTERN = /^\d{2}:\d{2}$/;

/**
 * @param {TransactionFormOption[]} categoryOptions
 * @param {EntryType} type
 * @returns {TransactionFormOption[]}
 */
export function getTransactionFormCategoryOptions(categoryOptions, type) {
  return categoryOptions
    .filter((option) => (option.isActive ?? true) && option.type === type)
    .sort((left, right) => {
      const leftSortOrder = Number.isFinite(left.sortOrder)
        ? Number(left.sortOrder)
        : Number.MAX_SAFE_INTEGER;
      const rightSortOrder = Number.isFinite(right.sortOrder)
        ? Number(right.sortOrder)
        : Number.MAX_SAFE_INTEGER;

      if (leftSortOrder !== rightSortOrder) {
        return leftSortOrder - rightSortOrder;
      }

      return String(left.label ?? '').localeCompare(String(right.label ?? ''), 'zh-Hans-CN');
    });
}

/**
 * @param {TransactionFormOption[]} accountOptions
 * @returns {TransactionFormOption[]}
 */
export function getTransactionFormAccountOptions(accountOptions) {
  return accountOptions.filter((option) => option.isActive ?? true);
}

/**
 * @param {{
 *   mode?: 'create' | 'edit' | undefined,
 *   initialValues?: TransactionFormInitialValues | undefined,
 *   categoryOptions: TransactionFormOption[],
 *   implicitAccountId: string,
 *   defaultType?: EntryType | undefined,
 *   defaultSyncStatus?: SyncStatus | undefined,
 *   now?: string | Date | undefined,
 *   timeZoneOffset?: string | undefined,
 * }} options
 * @returns {TransactionFormDraft}
 */
export function createTransactionFormDraft({
  mode = 'create',
  initialValues,
  categoryOptions,
  implicitAccountId,
  defaultType = DEFAULT_ENTRY_TYPE,
  now,
  timeZoneOffset = DEFAULT_TIME_ZONE_OFFSET,
}) {
  const type = initialValues?.type ?? defaultType;
  const filteredCategories = getTransactionFormCategoryOptions(categoryOptions, type);
  const accountId = initialValues?.accountId ?? implicitAccountId ?? '';
  const categoryId =
    mode === 'edit'
      ? selectCategoryValue(initialValues?.categoryId, filteredCategories)
      : selectCategoryValue(initialValues?.categoryId, filteredCategories, { allowEmpty: true });
  const transactionAt = initialValues?.transactionAt ?? now ?? new Date().toISOString();

  return {
    type,
    amountInput:
      typeof initialValues?.amount === 'number' ? formatAmountInput(initialValues.amount) : '',
    categoryId,
    accountId,
    dateInput: formatDateInput(transactionAt, timeZoneOffset),
    timeInput: formatTimeInput(transactionAt, timeZoneOffset),
    note: initialValues?.note ?? '',
  };
}

/**
 * @param {TransactionFormDraft} draft
 * @param {{ timeZoneOffset?: string | undefined, defaultSyncStatus?: SyncStatus | undefined }} [options]
 * @returns {{ values: ({
 *   type: EntryType,
 *   amount: number,
 *   categoryId: string,
 *   accountId: string,
 *   transactionAt: string,
 *   note: string,
 *   syncStatus: SyncStatus,
 * }) | null, errors: TransactionFormErrors }}
 */
export function buildTransactionFormSubmitPayload(
  draft,
  {
    timeZoneOffset = DEFAULT_TIME_ZONE_OFFSET,
    defaultSyncStatus = DEFAULT_SYNC_STATUS,
  } = {}
) {
  /** @type {TransactionFormErrors} */
  const errors = {};
  const amount = parseAmountInput(draft.amountInput);

  if (!amount || amount <= 0) {
    errors.amountInput = accountingCopy.form.errors.amount;
  }

  if (!draft.categoryId) {
    errors.categoryId = accountingCopy.form.errors.category;
  }

  if (!draft.accountId) {
    errors.accountId = accountingCopy.form.errors.account;
  }

  if (!DATE_INPUT_PATTERN.test(draft.dateInput)) {
    errors.dateInput = '\u8bf7\u9009\u62e9\u65e5\u671f';
  }

  if (!TIME_INPUT_PATTERN.test(draft.timeInput)) {
    errors.dateInput = '\u8bf7\u9009\u62e9\u65e5\u671f';
  }

  if (Object.keys(errors).length > 0) {
    return { values: null, errors };
  }

  return {
    values: {
      type: draft.type,
      amount: /** @type {number} */ (amount),
      categoryId: draft.categoryId,
      accountId: draft.accountId,
      transactionAt: normalizeDateTimeInput(
        buildDateTimeInput(draft.dateInput, draft.timeInput),
        timeZoneOffset
      ),
      note: draft.note.trim(),
      syncStatus: defaultSyncStatus,
    },
    errors,
  };
}

/**
 * @param {string | undefined} currentValue
 * @param {TransactionFormOption[]} options
 * @returns {string}
 */
function selectCategoryValue(currentValue, options, { allowEmpty = false } = {}) {
  if (currentValue && options.some((option) => option.value === currentValue)) {
    return currentValue;
  }

  if (allowEmpty) {
    return '';
  }

  return options[0]?.value ?? '';
}

/**
 * @param {number} amount
 * @returns {string}
 */
function formatAmountInput(amount) {
  return (amount / 100).toFixed(2);
}

/**
 * @param {string} input
 * @returns {number | null}
 */
function parseAmountInput(input) {
  const normalized = Number(input.trim());

  if (!Number.isFinite(normalized)) {
    return null;
  }

  return Math.round(normalized * 100);
}

/**
 * @param {string | Date} value
 * @param {string} timeZoneOffset
 * @returns {string}
 */
export function formatDateInput(value, timeZoneOffset = DEFAULT_TIME_ZONE_OFFSET) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offsetMinutes = parseTimeZoneOffset(timeZoneOffset);
  const localDate = new Date(date.getTime() + offsetMinutes * 60 * 1000);

  return [
    localDate.getUTCFullYear(),
    `${localDate.getUTCMonth() + 1}`.padStart(2, '0'),
    `${localDate.getUTCDate()}`.padStart(2, '0'),
  ].join('-');
}

/**
 * @param {string | Date} value
 * @param {string} timeZoneOffset
 * @returns {string}
 */
export function formatTimeInput(value, timeZoneOffset = DEFAULT_TIME_ZONE_OFFSET) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '12:00';
  }

  const offsetMinutes = parseTimeZoneOffset(timeZoneOffset);
  const localDate = new Date(date.getTime() + offsetMinutes * 60 * 1000);

  return `${`${localDate.getUTCHours()}`.padStart(2, '0')}:${`${localDate.getUTCMinutes()}`.padStart(2, '0')}`;
}

/**
 * @param {string} dateInput
 * @param {string} timeInput
 * @returns {string}
 */
export function buildDateTimeInput(dateInput, timeInput) {
  return `${dateInput}T${timeInput}`;
}

/**
 * @param {string} input
 * @param {string} timeZoneOffset
 * @returns {string}
 */
export function normalizeDateTimeInput(input, timeZoneOffset = DEFAULT_TIME_ZONE_OFFSET) {
  if (/[+-]\d{2}:\d{2}$|Z$/u.test(input)) {
    return input.length === 16 ? `${input}:00` : input;
  }

  return `${input}:00${timeZoneOffset}`;
}

/**
 * @param {string} offset
 * @returns {number}
 */
function parseTimeZoneOffset(offset) {
  const match = /^([+-])(\d{2}):(\d{2})$/u.exec(offset);

  if (!match) {
    return 0;
  }

  const [, sign, hours, minutes] = match;
  const absoluteMinutes = Number(hours) * 60 + Number(minutes);

  return sign === '-' ? -absoluteMinutes : absoluteMinutes;
}

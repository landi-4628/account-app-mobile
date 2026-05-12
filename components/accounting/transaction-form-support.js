/** @typedef {import('@/types/accounting').EntryType} EntryType */
/** @typedef {import('@/types/accounting').SyncStatus} SyncStatus */

import { accountingCopy } from '../../constants/accounting-copy.js';

/**
 * @typedef {{
 *   value: string,
 *   label: string,
 *   type?: EntryType | undefined,
 *   isActive?: boolean | undefined,
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
 *   syncStatus?: SyncStatus | undefined,
 * }} TransactionFormInitialValues
 */

/**
 * @typedef {{
 *   type: EntryType,
 *   amountInput: string,
 *   categoryId: string,
 *   accountId: string,
 *   dateTimeInput: string,
 *   note: string,
 *   syncStatus: SyncStatus,
 * }} TransactionFormDraft
 */

/**
 * @typedef {{
 *   amountInput?: string | undefined,
 *   categoryId?: string | undefined,
 *   accountId?: string | undefined,
 *   dateTimeInput?: string | undefined,
 * }} TransactionFormErrors
 */

const DEFAULT_TIME_ZONE_OFFSET = '+00:00';
const DEFAULT_SYNC_STATUS = 'pending';
const DEFAULT_ENTRY_TYPE = 'expense';
const DATE_TIME_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/**
 * @param {TransactionFormOption[]} categoryOptions
 * @param {EntryType} type
 * @returns {TransactionFormOption[]}
 */
export function getTransactionFormCategoryOptions(categoryOptions, type) {
  return categoryOptions.filter((option) => (option.isActive ?? true) && option.type === type);
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
 *   accountOptions: TransactionFormOption[],
 *   defaultType?: EntryType | undefined,
 *   defaultAccountId?: string | undefined,
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
  accountOptions,
  defaultType = DEFAULT_ENTRY_TYPE,
  defaultAccountId,
  defaultSyncStatus = DEFAULT_SYNC_STATUS,
  now,
  timeZoneOffset = DEFAULT_TIME_ZONE_OFFSET,
}) {
  const type = initialValues?.type ?? defaultType;
  const filteredCategories = getTransactionFormCategoryOptions(categoryOptions, type);
  const filteredAccounts = getTransactionFormAccountOptions(accountOptions);
  const accountId = selectAccountValue(
    initialValues?.accountId,
    filteredAccounts,
    defaultAccountId
  );
  const categoryId = selectCategoryValue(initialValues?.categoryId, filteredCategories);
  const transactionAt = initialValues?.transactionAt ?? now ?? new Date().toISOString();

  return {
    type,
    amountInput:
      typeof initialValues?.amount === 'number' ? formatAmountInput(initialValues.amount) : '',
    categoryId,
    accountId,
    dateTimeInput: formatDateTimeInput(transactionAt, timeZoneOffset),
    note: initialValues?.note ?? '',
    syncStatus: initialValues?.syncStatus ?? defaultSyncStatus,
  };
}

/**
 * @param {TransactionFormDraft} draft
 * @param {{ timeZoneOffset?: string | undefined }} [options]
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
  { timeZoneOffset = DEFAULT_TIME_ZONE_OFFSET } = {}
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

  if (!DATE_TIME_INPUT_PATTERN.test(draft.dateTimeInput)) {
    errors.dateTimeInput = accountingCopy.form.errors.dateTime;
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
      transactionAt: normalizeDateTimeInput(draft.dateTimeInput, timeZoneOffset),
      note: draft.note.trim(),
      syncStatus: draft.syncStatus,
    },
    errors,
  };
}

/**
 * @param {string | undefined} currentValue
 * @param {TransactionFormOption[]} options
 * @param {string | undefined} preferredValue
 * @returns {string}
 */
function selectAccountValue(currentValue, options, preferredValue) {
  const values = new Set(options.map((option) => option.value));

  if (currentValue && values.has(currentValue)) {
    return currentValue;
  }

  if (preferredValue && values.has(preferredValue)) {
    return preferredValue;
  }

  return options[0]?.value ?? '';
}

/**
 * @param {string | undefined} currentValue
 * @param {TransactionFormOption[]} options
 * @returns {string}
 */
function selectCategoryValue(currentValue, options) {
  if (currentValue && options.some((option) => option.value === currentValue)) {
    return currentValue;
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
export function formatDateTimeInput(value, timeZoneOffset = DEFAULT_TIME_ZONE_OFFSET) {
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
  ].join('-')
    + `T${`${localDate.getUTCHours()}`.padStart(2, '0')}:${`${localDate.getUTCMinutes()}`.padStart(2, '0')}`;
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

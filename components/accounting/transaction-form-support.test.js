import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildDateTimeInput,
  buildTransactionFormSubmitPayload,
  createTransactionFormDraft,
  formatDateInput,
  getTransactionFormCategoryOptions,
} from './transaction-form-support.js';

const categoryOptions = [
  { value: 'cat-food', label: 'Food', type: 'expense', isActive: true },
  { value: 'cat-commute', label: 'Commute', type: 'expense', isActive: true },
  { value: 'cat-salary', label: 'Salary', type: 'income', isActive: true },
  { value: 'cat-freelance', label: 'Freelance', type: 'income', isActive: false },
];

test('filters transaction form category options to active entries for the selected type', () => {
  assert.deepEqual(getTransactionFormCategoryOptions(categoryOptions, 'expense'), [
    { value: 'cat-food', label: 'Food', type: 'expense', isActive: true },
    { value: 'cat-commute', label: 'Commute', type: 'expense', isActive: true },
  ]);
  assert.deepEqual(getTransactionFormCategoryOptions(categoryOptions, 'income'), [
    { value: 'cat-salary', label: 'Salary', type: 'income', isActive: true },
  ]);
});

test('creates a create-mode draft with filtered defaults and formatted inputs', () => {
  assert.deepEqual(
    createTransactionFormDraft({
      mode: 'create',
      categoryOptions,
      implicitAccountId: 'acc-wechat',
      defaultType: 'income',
      now: '2026-05-12T09:45:00Z',
      timeZoneOffset: '+08:00',
    }),
    {
      type: 'income',
      amountInput: '',
      categoryId: 'cat-salary',
      accountId: 'acc-wechat',
      dateInput: '2026-05-12',
      timeInput: '17:45',
      note: '',
    }
  );
});

test('creates an edit-mode draft from an existing transaction payload', () => {
  assert.deepEqual(
    createTransactionFormDraft({
      mode: 'edit',
      categoryOptions,
      implicitAccountId: 'acc-wechat',
      initialValues: {
        type: 'expense',
        amount: 2530,
        categoryId: 'cat-food',
        accountId: 'acc-cash',
        transactionAt: '2026-05-11T12:30:00+08:00',
        note: 'Lunch',
        syncStatus: 'failed',
      },
      timeZoneOffset: '+08:00',
    }),
    {
      type: 'expense',
      amountInput: '25.30',
      categoryId: 'cat-food',
      accountId: 'acc-cash',
      dateInput: '2026-05-11',
      timeInput: '12:30',
      note: 'Lunch',
    }
  );
});

test('builds a submit payload with parsed amount, normalized note, and timezone offset', () => {
  assert.deepEqual(
    buildTransactionFormSubmitPayload(
      {
        type: 'expense',
        amountInput: '25.30',
        categoryId: 'cat-food',
        accountId: 'acc-cash',
        dateInput: '2026-05-11',
        timeInput: '12:30',
        note: '  Lunch  ',
      },
      { timeZoneOffset: '+08:00', defaultSyncStatus: 'pending' }
    ),
    {
      values: {
        type: 'expense',
        amount: 2530,
        categoryId: 'cat-food',
        accountId: 'acc-cash',
        transactionAt: '2026-05-11T12:30:00+08:00',
        note: 'Lunch',
        syncStatus: 'pending',
      },
      errors: {},
    }
  );
});

test('returns field errors when submit payload input is incomplete or invalid', () => {
  const result = buildTransactionFormSubmitPayload(
    {
      type: 'expense',
      amountInput: '0',
      categoryId: '',
      accountId: '',
      dateInput: '2026-05-11',
      timeInput: 'bad',
      note: '   ',
    },
    { timeZoneOffset: '+08:00' }
  );

  assert.equal(result.values, null);
  assert.deepEqual(Object.keys(result.errors).sort(), [
    'accountId',
    'amountInput',
    'categoryId',
    'dateInput',
  ]);
});

test('formats date-only display input and can rebuild a datetime payload input', () => {
  assert.equal(formatDateInput('2026-05-11T12:30:00+08:00', '+08:00'), '2026-05-11');
  assert.equal(buildDateTimeInput('2026-05-11', '12:30'), '2026-05-11T12:30');
});

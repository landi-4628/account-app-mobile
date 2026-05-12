import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildTransactionFormSubmitPayload,
  createTransactionFormDraft,
  getTransactionFormCategoryOptions,
} from './transaction-form-support.js';

const accountOptions = [
  { value: 'acc-cash', label: 'Cash', isActive: true },
  { value: 'acc-bank', label: 'Bank', isActive: false },
  { value: 'acc-wechat', label: 'WeChat', isActive: true },
];

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
      accountOptions,
      categoryOptions,
      defaultType: 'income',
      defaultAccountId: 'acc-wechat',
      now: '2026-05-12T09:45:00Z',
      timeZoneOffset: '+08:00',
    }),
    {
      type: 'income',
      amountInput: '',
      categoryId: 'cat-salary',
      accountId: 'acc-wechat',
      dateTimeInput: '2026-05-12T17:45',
      note: '',
      syncStatus: 'pending',
    }
  );
});

test('creates an edit-mode draft from an existing transaction payload', () => {
  assert.deepEqual(
    createTransactionFormDraft({
      mode: 'edit',
      accountOptions,
      categoryOptions,
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
      dateTimeInput: '2026-05-11T12:30',
      note: 'Lunch',
      syncStatus: 'failed',
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
        dateTimeInput: '2026-05-11T12:30',
        note: '  Lunch  ',
        syncStatus: 'failed',
      },
      { timeZoneOffset: '+08:00' }
    ),
    {
      values: {
        type: 'expense',
        amount: 2530,
        categoryId: 'cat-food',
        accountId: 'acc-cash',
        transactionAt: '2026-05-11T12:30:00+08:00',
        note: 'Lunch',
        syncStatus: 'failed',
      },
      errors: {},
    }
  );
});

test('returns field errors when submit payload input is incomplete or invalid', () => {
  assert.deepEqual(
    buildTransactionFormSubmitPayload(
      {
        type: 'expense',
        amountInput: '0',
        categoryId: '',
        accountId: '',
        dateTimeInput: '2026-05-11',
        note: '   ',
        syncStatus: 'pending',
      },
      { timeZoneOffset: '+08:00' }
    ),
    {
      values: null,
      errors: {
        amountInput: '请输入大于 0 的金额',
        categoryId: '请选择分类',
        accountId: '请选择账户',
        dateTimeInput: '请输入正确的时间，格式为 YYYY-MM-DDTHH:mm',
      },
    }
  );
});

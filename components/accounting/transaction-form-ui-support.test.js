import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyTransactionFormAmountAction,
  createTransactionFormAmountState,
  createTransactionFormUiState,
  resolveTransactionDraftAmountInput,
  selectTransactionFormDraftCategory,
  selectTransactionFormCategory,
} from './transaction-form-ui-support.js';

test('keeps the transaction form panel hidden until a category is selected', () => {
  assert.deepEqual(createTransactionFormUiState(), {
    categoryId: '',
    panelVisible: false,
  });
});

test('shows the transaction form panel after selecting a category', () => {
  assert.deepEqual(selectTransactionFormCategory(createTransactionFormUiState(), 'cat-food'), {
    categoryId: 'cat-food',
    panelVisible: true,
  });
});

test('keeps the transaction form panel visible when switching categories', () => {
  const selectedFood = selectTransactionFormCategory(createTransactionFormUiState(), 'cat-food');
  const selectedCommute = selectTransactionFormCategory(selectedFood, 'cat-commute');

  assert.deepEqual(selectedCommute, {
    categoryId: 'cat-commute',
    panelVisible: true,
  });
});

test('switching category only updates the draft category and preserves other fields', () => {
  assert.deepEqual(
    selectTransactionFormDraftCategory(
      {
        type: 'expense',
        amountInput: '',
        categoryId: 'cat-food',
        accountId: 'acc-cash',
        dateInput: '2026-05-15',
        timeInput: '09:39',
        note: 'Lunch',
      },
      'cat-commute'
    ),
    {
      type: 'expense',
      amountInput: '',
      categoryId: 'cat-commute',
      accountId: 'acc-cash',
      dateInput: '2026-05-15',
      timeInput: '09:39',
      note: 'Lunch',
    }
  );
});

test('clearing an invalid category after a type switch still preserves entered fields', () => {
  assert.deepEqual(
    selectTransactionFormDraftCategory(
      {
        type: 'income',
        amountInput: '',
        categoryId: 'cat-salary',
        accountId: 'acc-cash',
        dateInput: '2026-05-15',
        timeInput: '09:39',
        note: 'Monthly adjustment',
      },
      ''
    ),
    {
      type: 'income',
      amountInput: '',
      categoryId: '',
      accountId: 'acc-cash',
      dateInput: '2026-05-15',
      timeInput: '09:39',
      note: 'Monthly adjustment',
    }
  );
});

test('keeps expression amounts non-submittable until settled, then allows submission', () => {
  let amountState = createTransactionFormAmountState();

  amountState = applyTransactionFormAmountAction(amountState, { type: 'append-key', key: '1' });
  amountState = applyTransactionFormAmountAction(amountState, { type: 'append-key', key: '2' });
  amountState = applyTransactionFormAmountAction(amountState, { type: 'append-key', key: '+' });
  amountState = applyTransactionFormAmountAction(amountState, { type: 'append-key', key: '3' });

  assert.deepEqual(amountState, {
    expression: '12+3',
    amount: '15',
    canSubmit: false,
  });

  amountState = applyTransactionFormAmountAction(amountState, { type: 'settle' });

  assert.deepEqual(amountState, {
    expression: '15',
    amount: '15',
    canSubmit: true,
  });
});

test('only settled pure amounts sync back into the transaction draft', () => {
  let amountState = createTransactionFormAmountState();

  amountState = applyTransactionFormAmountAction(amountState, { type: 'append-key', key: '1' });
  amountState = applyTransactionFormAmountAction(amountState, { type: 'append-key', key: '2' });
  amountState = applyTransactionFormAmountAction(amountState, { type: 'append-key', key: '+' });
  amountState = applyTransactionFormAmountAction(amountState, { type: 'append-key', key: '3' });

  assert.equal(resolveTransactionDraftAmountInput(amountState), '');

  amountState = applyTransactionFormAmountAction(amountState, { type: 'settle' });

  assert.equal(resolveTransactionDraftAmountInput(amountState), '15');
});

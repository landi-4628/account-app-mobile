import assert from 'node:assert/strict';
import test from 'node:test';

import {
  appendAmountExpressionKey,
  backspaceAmountExpression,
  clearAmountExpression,
  createAmountExpressionState,
  settleAmountExpression,
} from './transaction-amount-expression-support.js';

test('creates an empty amount expression state', () => {
  assert.deepEqual(createAmountExpressionState(), {
    expression: '',
    amount: '',
    canSubmit: false,
  });
});

test('returns a fresh empty state object for each empty-state transition', () => {
  const initialState = createAmountExpressionState();
  const nextInitialState = createAmountExpressionState();
  const clearedState = clearAmountExpression({
    expression: '12+',
    amount: '',
    canSubmit: false,
  });
  const settledInvalidState = settleAmountExpression({
    expression: '12+',
    amount: '',
    canSubmit: false,
  });

  assert.notEqual(initialState, nextInitialState);
  assert.notEqual(initialState, clearedState);
  assert.notEqual(clearedState, settledInvalidState);
});

test('appends digits and operators while keeping a live computed amount for complete expressions', () => {
  let state = createAmountExpressionState();

  state = appendAmountExpressionKey(state, '1');
  state = appendAmountExpressionKey(state, '2');
  state = appendAmountExpressionKey(state, '+');
  state = appendAmountExpressionKey(state, '3');
  state = appendAmountExpressionKey(state, '-');
  state = appendAmountExpressionKey(state, '1');

  assert.deepEqual(state, {
    expression: '12+3-1',
    amount: '14',
    canSubmit: false,
  });
});

test('supports decimal input and trims insignificant trailing zeroes in computed amounts', () => {
  let state = createAmountExpressionState();

  for (const key of ['0', '.', '5', '+', '1', '.', '2', '5']) {
    state = appendAmountExpressionKey(state, key);
  }

  assert.deepEqual(state, {
    expression: '0.5+1.25',
    amount: '1.75',
    canSubmit: false,
  });
});

test('keeps incomplete expressions non-submittable until settled', () => {
  let state = createAmountExpressionState();

  state = appendAmountExpressionKey(state, '1');
  state = appendAmountExpressionKey(state, '2');
  state = appendAmountExpressionKey(state, '+');

  assert.deepEqual(state, {
    expression: '12+',
    amount: '',
    canSubmit: false,
  });
});

test('rejects invalid decimal expressions from producing a live amount', () => {
  let state = createAmountExpressionState();

  for (const key of ['1', '2', '.', '.', '3']) {
    state = appendAmountExpressionKey(state, key);
  }

  assert.deepEqual(state, {
    expression: '12..3',
    amount: '',
    canSubmit: false,
  });
});

test('settles a complete expression into a pure positive amount that can submit', () => {
  let state = createAmountExpressionState();

  for (const key of ['1', '2', '+', '3', '-', '1']) {
    state = appendAmountExpressionKey(state, key);
  }

  assert.deepEqual(settleAmountExpression(state), {
    expression: '14',
    amount: '14',
    canSubmit: true,
  });
});

test('clears incomplete expressions when settled', () => {
  let state = createAmountExpressionState();

  state = appendAmountExpressionKey(state, '1');
  state = appendAmountExpressionKey(state, '2');
  state = appendAmountExpressionKey(state, '+');

  assert.deepEqual(settleAmountExpression(state), {
    expression: '',
    amount: '',
    canSubmit: false,
  });
});

test('does not allow submission for zero or negative pure results after settling', () => {
  let zeroState = createAmountExpressionState();
  zeroState = appendAmountExpressionKey(zeroState, '0');

  let negativeState = createAmountExpressionState();
  for (const key of ['1', '-', '2']) {
    negativeState = appendAmountExpressionKey(negativeState, key);
  }

  assert.deepEqual(settleAmountExpression(zeroState), {
    expression: '0',
    amount: '0',
    canSubmit: false,
  });
  assert.deepEqual(settleAmountExpression(negativeState), {
    expression: '-1',
    amount: '-1',
    canSubmit: false,
  });
});

test('supports backspace across settled and unsettled states', () => {
  let state = createAmountExpressionState();

  for (const key of ['1', '2', '+', '3']) {
    state = appendAmountExpressionKey(state, key);
  }
  state = settleAmountExpression(state);
  state = backspaceAmountExpression(state);

  assert.deepEqual(state, {
    expression: '1',
    amount: '1',
    canSubmit: true,
  });
});

test('clears the expression state explicitly', () => {
  let state = createAmountExpressionState();

  for (const key of ['9', '.', '0']) {
    state = appendAmountExpressionKey(state, key);
  }

  assert.deepEqual(clearAmountExpression(state), {
    expression: '',
    amount: '',
    canSubmit: false,
  });
});

test('treats non-string expression values as empty or invalid without throwing', () => {
  assert.deepEqual(
    appendAmountExpressionKey({ expression: 12 }, '3'),
    {
      expression: '3',
      amount: '3',
      canSubmit: true,
    }
  );

  assert.deepEqual(
    backspaceAmountExpression({ expression: {} }),
    {
      expression: '',
      amount: '',
      canSubmit: false,
    }
  );

  assert.deepEqual(
    settleAmountExpression({ expression: {} }),
    {
      expression: '',
      amount: '',
      canSubmit: false,
    }
  );
});

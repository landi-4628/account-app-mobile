import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const transactionFormPath = path.resolve('components/accounting/transaction-form.jsx');
const transactionFormSource = fs.readFileSync(transactionFormPath, 'utf8');

test('transaction form gates the bottom panel behind category selection', () => {
  assert.match(
    transactionFormSource,
    /const shouldShowBottomPanel = Boolean\(draft\.categoryId\);/
  );
  assert.match(
    transactionFormSource,
    /\{shouldShowBottomPanel \? \(\s*<View style=\{styles\.bottomPanel\}>/s
  );
});

test('transaction form integrates the amount expression support module', () => {
  assert.match(transactionFormSource, /from '\.\/transaction-amount-expression-support\.js'/);
});

test('transaction form keeps using the local DatePickerModal', () => {
  assert.match(transactionFormSource, /<DatePickerModal\b/);
});

test('transaction form exposes settle and submit actions in the bottom panel', () => {
  assert.match(transactionFormSource, /['"]settle['"]/);
  assert.match(transactionFormSource, /return '=';/);
  assert.match(
    transactionFormSource,
    /const completeButtonLabel = submitLabel \?\? inlineCopy\.complete;/
  );
  assert.match(transactionFormSource, /inlineCopy\.complete/);
});

test('transaction form category active state no longer relies on optionChipActive', () => {
  assert.doesNotMatch(
    transactionFormSource,
    /active \? \(variant === 'type' \? styles\.typeChipActive : styles\.optionChipActive\) : null/
  );
});

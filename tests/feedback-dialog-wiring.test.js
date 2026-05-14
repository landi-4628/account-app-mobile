import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const loginScreenPath = path.resolve(process.cwd(), 'app/auth/login.jsx');
const registerScreenPath = path.resolve(process.cwd(), 'app/auth/register.jsx');
const editProfileScreenPath = path.resolve(process.cwd(), 'app/profile/edit.jsx');
const changePasswordScreenPath = path.resolve(process.cwd(), 'app/profile/change-password.jsx');
const categoriesScreenPath = path.resolve(process.cwd(), 'app/categories/index.jsx');
const ledgerScreenPath = path.resolve(process.cwd(), 'app/profile/ledger.jsx');
const accountingIndexPath = path.resolve(process.cwd(), 'components/accounting/index.js');
const newTransactionScreenPath = path.resolve(process.cwd(), 'app/transaction/new.jsx');
const editTransactionScreenPath = path.resolve(process.cwd(), 'app/transaction/[id].jsx');
const transactionFormPath = path.resolve(process.cwd(), 'components/accounting/transaction-form.jsx');

test('feedback dialog is exported for screen-level prompt handling', () => {
  const source = readFileSync(accountingIndexPath, 'utf8');

  assert.match(source, /FeedbackDialog/);
});

test('auth and profile management screens use feedback dialogs instead of inline info banners', () => {
  const loginSource = readFileSync(loginScreenPath, 'utf8');
  const registerSource = readFileSync(registerScreenPath, 'utf8');
  const editSource = readFileSync(editProfileScreenPath, 'utf8');
  const passwordSource = readFileSync(changePasswordScreenPath, 'utf8');
  const categoriesSource = readFileSync(categoriesScreenPath, 'utf8');
  const ledgerSource = readFileSync(ledgerScreenPath, 'utf8');

  for (const source of [
    loginSource,
    registerSource,
    editSource,
    passwordSource,
    categoriesSource,
    ledgerSource,
  ]) {
    assert.match(source, /FeedbackDialog/);
  }

  assert.doesNotMatch(loginSource, /<InfoBanner/);
  assert.doesNotMatch(registerSource, /<InfoBanner/);
  assert.doesNotMatch(editSource, /<InfoBanner/);
  assert.doesNotMatch(passwordSource, /<InfoBanner/);
  assert.doesNotMatch(categoriesSource, /<InfoBanner/);
  assert.doesNotMatch(ledgerSource, /<InfoBanner/);
});

test('transaction screens route create-category auth failures into feedback dialogs', () => {
  const newSource = readFileSync(newTransactionScreenPath, 'utf8');
  const editSource = readFileSync(editTransactionScreenPath, 'utf8');
  const formSource = readFileSync(transactionFormPath, 'utf8');

  assert.match(newSource, /onCreateCategoryError=\{handleCreateCategoryError\}/);
  assert.match(editSource, /onCreateCategoryError=\{handleCreateCategoryError\}/);
  assert.match(formSource, /const saveNewCategory = React\.useCallback\(async \(\) => \{/);
  assert.match(formSource, /await Promise\.resolve\(/);
  assert.match(formSource, /onCreateCategoryError\?\.\(error\)/);
});

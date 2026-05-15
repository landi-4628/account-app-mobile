import test from 'node:test';
import assert from 'node:assert/strict';

import { MOCK_DEFAULT_LEDGER_ACCOUNT_ID } from '../data/mock/mock-accounts.js';
import { resolveImplicitAccountId } from '../lib/resolve-implicit-account-id.js';

test('falls back to the built-in local ledger account when no account is hydrated yet', () => {
  assert.equal(resolveImplicitAccountId('', ''), MOCK_DEFAULT_LEDGER_ACCOUNT_ID);
  assert.equal(resolveImplicitAccountId(undefined, undefined), MOCK_DEFAULT_LEDGER_ACCOUNT_ID);
});

test('prefers hydrated and user default account ids over the local fallback', () => {
  assert.equal(resolveImplicitAccountId('acc-runtime', 'acc-profile'), 'acc-runtime');
  assert.equal(resolveImplicitAccountId('', 'acc-profile'), 'acc-profile');
});

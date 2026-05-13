import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildAccountManagementViewModel,
  buildCapabilityNotice,
  buildAuthFormDraft,
  buildCategoryManagementViewModel,
  buildProfileFormDraft,
  getActionAvailability,
  validateAuthFormDraft,
  validatePasswordChangeDraft,
  validateProfileFormDraft,
} from './management-screen-support.js';

test('detects currently available and future provider actions', () => {
  assert.deepEqual(getActionAvailability({}), {
    canCreateAccounts: false,
    canCreateCategories: false,
    canChangePassword: false,
    canEditAccounts: false,
    canEditCategories: false,
    canDeleteAccounts: false,
    canDeleteCategories: false,
    canLogin: false,
    canRegister: false,
    canToggleAccounts: false,
    canToggleCategories: false,
    canUpdateProfile: false,
  });

  assert.deepEqual(
    getActionAvailability({
      addAccount() {},
      addCategory() {},
      changePassword() {},
      login() {},
      register() {},
      toggleAccountActive() {},
      toggleCategoryActive() {},
      updateAccount() {},
      updateCategory() {},
      deleteAccount() {},
      deleteCategory() {},
      updateProfile() {},
    }),
    {
      canCreateAccounts: true,
      canCreateCategories: true,
      canChangePassword: true,
      canEditAccounts: true,
      canEditCategories: true,
      canDeleteAccounts: true,
      canDeleteCategories: true,
      canLogin: true,
      canRegister: true,
      canToggleAccounts: true,
      canToggleCategories: true,
      canUpdateProfile: true,
    }
  );
});

test('builds defensive capability notices for unavailable actions', () => {
  assert.deepEqual(
    buildCapabilityNotice('login', getActionAvailability({})),
    {
      tone: 'warning',
      title: 'loginUnavailable',
      description: 'loginUnavailableDescription',
    }
  );

  assert.deepEqual(
    buildCapabilityNotice(
      'accountsCreate',
      getActionAvailability({
        updateAccount() {},
      })
    ),
    {
      tone: 'warning',
      title: 'accountsCreateUnavailable',
      description: 'accountsCreateUnavailableDescription',
    }
  );

  assert.equal(
    buildCapabilityNotice(
      'profileEdit',
      getActionAvailability({
        updateProfile() {},
      })
    ),
    null
  );

  assert.equal(
    buildCapabilityNotice(
      'accountsManage',
      getActionAvailability({
        toggleAccountActive() {},
      })
    ),
    null
  );
});

test('builds account rows with active accounts first and stable names', () => {
  const viewModel = buildAccountManagementViewModel(
    [
      { id: 'acc-3', name: 'wallet', type: 'cash', isActive: false },
      { id: 'acc-1', name: 'Bank', type: 'bank', isActive: true },
      { id: 'acc-2', name: 'Alipay', type: 'alipay', isActive: true },
    ],
    {}
  );

  assert.equal(viewModel.canCreate, true);
  assert.equal(viewModel.canManageExisting, false);
  assert.deepEqual(
    viewModel.rows.map((row) => ({
      id: row.id,
      isActive: row.isActive,
      manageMode: row.manageMode,
    })),
    [
      { id: 'acc-2', isActive: true, manageMode: 'read-only' },
      { id: 'acc-1', isActive: true, manageMode: 'read-only' },
      { id: 'acc-3', isActive: false, manageMode: 'read-only' },
    ]
  );
});

test('builds category rows filtered by entry type', () => {
  const viewModel = buildCategoryManagementViewModel(
    [
      { id: 'cat-1', name: 'Food', type: 'expense', isActive: true },
      { id: 'cat-2', name: 'Salary', type: 'income', isActive: true },
      { id: 'cat-3', name: 'Coffee', type: 'expense', isActive: false },
    ],
    'expense',
    {
      updateCategory() {},
    }
  );

  assert.equal(viewModel.entryType, 'expense');
  assert.equal(viewModel.canManageExisting, true);
  assert.deepEqual(
    viewModel.rows.map((row) => ({
      id: row.id,
      isActive: row.isActive,
      manageMode: row.manageMode,
    })),
    [
      { id: 'cat-3', isActive: false, manageMode: 'editable' },
      { id: 'cat-1', isActive: true, manageMode: 'editable' },
    ]
  );
});

test('creates auth drafts and validates login vs register requirements', () => {
  assert.deepEqual(buildAuthFormDraft('login'), {
    confirmPassword: '',
    email: '',
    name: '',
    password: '',
  });

  assert.deepEqual(
    validateAuthFormDraft('login', {
      email: 'demo',
      password: '',
    }),
    {
      email: 'email',
      password: 'password',
    }
  );

  assert.deepEqual(
    validateAuthFormDraft('register', {
      name: ' ',
      email: 'demo@example.com',
      password: '123',
      confirmPassword: '456',
    }),
    {
      confirmPassword: 'confirmPassword',
      name: 'name',
      password: 'passwordLength',
    }
  );
});

test('builds profile drafts from provider user data and validates edits', () => {
  assert.deepEqual(
    buildProfileFormDraft({
      name: 'Demo',
      email: 'demo@example.com',
      ledgerName: 'Household',
      timezone: 'Asia/Shanghai',
      defaultAccountId: 'acc-1',
    }),
    {
      defaultAccountId: 'acc-1',
      email: 'demo@example.com',
      ledgerName: 'Household',
      name: 'Demo',
      timezone: 'Asia/Shanghai',
    }
  );

  assert.deepEqual(
    validateProfileFormDraft({
      name: ' ',
      email: 'demo',
      ledgerName: ' ',
      timezone: '',
      defaultAccountId: '',
    }),
    {
      defaultAccountId: 'defaultAccountId',
      email: 'email',
      ledgerName: 'ledgerName',
      name: 'name',
      timezone: 'timezone',
    }
  );
});

test('validates password change drafts without provider coupling', () => {
  assert.deepEqual(
    validatePasswordChangeDraft({
      currentPassword: '',
      nextPassword: '123',
      confirmPassword: '456',
    }),
    {
      confirmPassword: 'confirmPassword',
      currentPassword: 'currentPassword',
      nextPassword: 'nextPasswordLength',
    }
  );
});

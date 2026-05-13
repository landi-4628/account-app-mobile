import assert from 'node:assert/strict';
import test from 'node:test';

import {
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
    canCreateCategories: false,
    canChangePassword: false,
    canEditCategories: false,
    canDeleteCategories: false,
    canLogin: false,
    canRegister: false,
    canToggleCategories: false,
    canUpdateProfile: false,
  });

  assert.deepEqual(
    getActionAvailability({
      addCategory() {},
      changePassword() {},
      login() {},
      register() {},
      toggleCategoryActive() {},
      updateCategory() {},
      deleteCategory() {},
      updateProfile() {},
    }),
    {
      canCreateCategories: true,
      canChangePassword: true,
      canEditCategories: true,
      canDeleteCategories: true,
      canLogin: true,
      canRegister: true,
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
      'categoriesCreate',
      getActionAvailability({
        updateCategory() {},
      })
    ),
    {
      tone: 'warning',
      title: 'categoriesCreateUnavailable',
      description: 'categoriesCreateUnavailableDescription',
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
      'categoriesManage',
      getActionAvailability({
        toggleCategoryActive() {},
      })
    ),
    null
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
    }),
    {
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

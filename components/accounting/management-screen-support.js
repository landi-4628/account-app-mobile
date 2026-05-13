function hasFunction(candidate) {
  return typeof candidate === 'function';
}

export function getActionAvailability(actions) {
  return {
    canCreateAccounts: hasFunction(actions?.addAccount),
    canCreateCategories: hasFunction(actions?.addCategory),
    canChangePassword: hasFunction(actions?.changePassword),
    canEditAccounts: hasFunction(actions?.updateAccount) || hasFunction(actions?.saveAccount),
    canEditCategories: hasFunction(actions?.updateCategory) || hasFunction(actions?.saveCategory),
    canLogin: hasFunction(actions?.login),
    canRegister: hasFunction(actions?.register),
    canToggleAccounts: hasFunction(actions?.toggleAccountActive),
    canToggleCategories: hasFunction(actions?.toggleCategoryActive),
    canUpdateProfile: hasFunction(actions?.updateProfile) || hasFunction(actions?.saveProfile),
  };
}

const capabilityMap = {
  login: 'canLogin',
  register: 'canRegister',
  profileEdit: 'canUpdateProfile',
  passwordChange: 'canChangePassword',
  accountsCreate: 'canCreateAccounts',
  categoriesCreate: 'canCreateCategories',
  accountsManage: 'canManageAccounts',
  categoriesManage: 'canManageCategories',
};

export function buildCapabilityNotice(feature, availability) {
  const capabilityKey = capabilityMap[feature];
  const effectiveAvailability = {
    ...availability,
    canManageAccounts: Boolean(availability?.canEditAccounts || availability?.canToggleAccounts),
    canManageCategories: Boolean(availability?.canEditCategories || availability?.canToggleCategories),
  };

  if (!capabilityKey || effectiveAvailability[capabilityKey]) {
    return null;
  }

  return {
    tone: 'warning',
    title: `${feature}Unavailable`,
    description: `${feature}UnavailableDescription`,
  };
}

function compareNames(left, right) {
  return String(left?.name ?? '').localeCompare(String(right?.name ?? ''), 'en', {
    sensitivity: 'base',
  });
}

export function buildAccountManagementViewModel(accounts, actions) {
  const availability = getActionAvailability(actions);
  const canManageExisting = availability.canEditAccounts || availability.canToggleAccounts;
  const rows = [...accounts]
    .sort((left, right) => {
      if (left.isActive !== right.isActive) {
        return left.isActive ? -1 : 1;
      }

      return compareNames(left, right);
    })
    .map((account) => ({
      id: account.id,
      isActive: Boolean(account.isActive),
      item: account,
      manageMode: canManageExisting ? 'editable' : 'read-only',
    }));

  return {
    canCreate: true,
    canManageExisting,
    rows,
  };
}

export function buildCategoryManagementViewModel(categories, entryType, actions) {
  const availability = getActionAvailability(actions);
  const canManageExisting = availability.canEditCategories || availability.canToggleCategories;
  const rows = [...categories]
    .filter((category) => category.type === entryType)
    .sort(compareNames)
    .map((category) => ({
      id: category.id,
      isActive: Boolean(category.isActive),
      item: category,
      manageMode: canManageExisting ? 'editable' : 'read-only',
    }));

  return {
    canCreate: true,
    canManageExisting,
    entryType,
    rows,
  };
}

export function buildAuthFormDraft(mode) {
  return {
    confirmPassword: '',
    email: '',
    name: '',
    password: '',
  };
}

function isBlank(value) {
  return !String(value ?? '').trim();
}

function hasValidEmail(value) {
  const text = String(value ?? '').trim();
  return text.includes('@') && text.includes('.');
}

export function validateAuthFormDraft(mode, draft) {
  const errors = {};

  if (mode === 'register' && isBlank(draft?.name)) {
    errors.name = 'name';
  }

  if (!hasValidEmail(draft?.email)) {
    errors.email = 'email';
  }

  if (String(draft?.password ?? '').length < 6) {
    errors.password = mode === 'login' ? 'password' : 'passwordLength';
  }

  if (mode === 'register' && draft?.confirmPassword !== draft?.password) {
    errors.confirmPassword = 'confirmPassword';
  }

  return errors;
}

export function buildProfileFormDraft(user) {
  return {
    defaultAccountId: user?.defaultAccountId ?? '',
    email: user?.email ?? '',
    ledgerName: user?.ledgerName ?? '',
    name: user?.name ?? '',
    timezone: user?.timezone ?? '',
  };
}

export function validateProfileFormDraft(draft) {
  const errors = {};

  if (isBlank(draft?.name)) {
    errors.name = 'name';
  }

  if (!hasValidEmail(draft?.email)) {
    errors.email = 'email';
  }

  if (isBlank(draft?.ledgerName)) {
    errors.ledgerName = 'ledgerName';
  }

  if (isBlank(draft?.timezone)) {
    errors.timezone = 'timezone';
  }

  if (isBlank(draft?.defaultAccountId)) {
    errors.defaultAccountId = 'defaultAccountId';
  }

  return errors;
}

export function validatePasswordChangeDraft(draft) {
  const errors = {};

  if (isBlank(draft?.currentPassword)) {
    errors.currentPassword = 'currentPassword';
  }

  if (String(draft?.nextPassword ?? '').length < 6) {
    errors.nextPassword = 'nextPasswordLength';
  }

  if (draft?.confirmPassword !== draft?.nextPassword) {
    errors.confirmPassword = 'confirmPassword';
  }

  return errors;
}

export const MOCK_APP_CUSTOM_DEFINITIONS_STORAGE_KEY =
  '@accounting/mock-app/custom-definitions/v1';

/**
 * @param {import('./mock-app-state.js').MockAppState} state
 */
export function selectPersistedCustomDefinitions(state) {
  return {
    categories: state.categories.filter((category) => category.isCustom),
    accounts: [],
  };
}

/**
 * @param {import('./mock-app-state.js').MockAppState} state
 * @param {{
 *   categories?: import('../types/accounting').LedgerCategory[] | undefined,
 *   accounts?: import('../types/accounting').LedgerAccount[] | undefined,
 * }} persisted
 */
export function mergePersistedCustomDefinitions(state, persisted) {
  return {
    ...state,
    categories: mergeUniqueById(state.categories, persisted.categories ?? []),
  };
}

/**
 * @param {string | null | undefined} raw
 * @returns {{
 *   categories: import('../types/accounting').LedgerCategory[],
 *   accounts: import('../types/accounting').LedgerAccount[],
 * }}
 */
export function parsePersistedCustomDefinitions(raw) {
  if (!raw) {
    return { categories: [], accounts: [] };
  }

  try {
    const parsed = JSON.parse(raw);

    return {
      categories: Array.isArray(parsed?.categories)
        ? parsed.categories.filter(isPersistedCategory)
        : [],
      accounts: Array.isArray(parsed?.accounts)
        ? parsed.accounts.filter(isPersistedAccount)
        : [],
    };
  } catch {
    return { categories: [], accounts: [] };
  }
}

/**
 * @template {{ id: string }} T
 * @param {T[]} baseItems
 * @param {T[]} customItems
 * @returns {T[]}
 */
function mergeUniqueById(baseItems, customItems) {
  const seenIds = new Set(baseItems.map((item) => item.id));

  return [
    ...baseItems,
    ...customItems.filter((item) => {
      if (!item?.id || seenIds.has(item.id)) {
        return false;
      }

      seenIds.add(item.id);
      return true;
    }),
  ];
}

/**
 * @param {unknown} value
 * @returns {value is import('../types/accounting').LedgerCategory}
 */
function isPersistedCategory(value) {
  return Boolean(
    value
      && typeof value === 'object'
      && 'id' in value
      && 'name' in value
      && 'type' in value
      && 'isActive' in value
      && 'isCustom' in value
      && typeof value.id === 'string'
      && typeof value.name === 'string'
      && typeof value.type === 'string'
      && typeof value.isActive === 'boolean'
      && value.isCustom === true
  );
}

/**
 * @param {unknown} value
 * @returns {value is import('../types/accounting').LedgerAccount}
 */
function isPersistedAccount(value) {
  return Boolean(
    value
      && typeof value === 'object'
      && 'id' in value
      && 'name' in value
      && 'type' in value
      && 'initialBalance' in value
      && 'currentBalance' in value
      && 'isActive' in value
      && 'isCustom' in value
      && typeof value.id === 'string'
      && typeof value.name === 'string'
      && typeof value.type === 'string'
      && typeof value.initialBalance === 'number'
      && typeof value.currentBalance === 'number'
      && typeof value.isActive === 'boolean'
      && value.isCustom === true
  );
}

import {
  appendAmountExpressionKey,
  backspaceAmountExpression,
  clearAmountExpression,
  createAmountExpressionState,
  settleAmountExpression,
} from './transaction-amount-expression-support.js';

/**
 * @param {{ categoryId?: string | undefined }} [options]
 * @returns {{ categoryId: string, panelVisible: boolean }}
 */
export function createTransactionFormUiState({ categoryId = '' } = {}) {
  return {
    categoryId,
    panelVisible: Boolean(categoryId),
  };
}

/**
 * @param {{ categoryId: string, panelVisible: boolean }} state
 * @param {string} categoryId
 * @returns {{ categoryId: string, panelVisible: boolean }}
 */
export function selectTransactionFormCategory(state, categoryId) {
  return {
    ...state,
    categoryId,
    panelVisible: Boolean(categoryId),
  };
}

/**
 * @param {{
 *   type: 'expense' | 'income',
 *   amountInput: string,
 *   categoryId: string,
 *   accountId: string,
 *   dateInput: string,
 *   timeInput: string,
 *   note: string,
 * }} draft
 * @param {string} categoryId
 * @returns {{
 *   type: 'expense' | 'income',
 *   amountInput: string,
 *   categoryId: string,
 *   accountId: string,
 *   dateInput: string,
 *   timeInput: string,
 *   note: string,
 * }}
 */
export function selectTransactionFormDraftCategory(draft, categoryId) {
  return {
    ...draft,
    categoryId,
  };
}

/**
 * @param {string | undefined} amountInput
 * @returns {{ expression: string, amount: string, canSubmit: boolean }}
 */
export function createTransactionFormAmountState(amountInput = '') {
  const normalizedAmountInput = typeof amountInput === 'string' ? amountInput.trim() : '';

  if (!normalizedAmountInput) {
    return createAmountExpressionState();
  }

  return settleAmountExpression({ expression: normalizedAmountInput });
}

/**
 * @param {{ expression: string, amount: string, canSubmit: boolean }} state
 * @returns {string}
 */
export function resolveTransactionDraftAmountInput(state) {
  return state.canSubmit && state.expression === state.amount ? state.amount : '';
}

/**
 * @param {{ expression: string, amount: string, canSubmit: boolean }} state
 * @param {{
 *   type: 'append-key' | 'backspace' | 'clear' | 'settle',
 *   key?: string | undefined,
 * }} action
 * @returns {{ expression: string, amount: string, canSubmit: boolean }}
 */
export function applyTransactionFormAmountAction(state, action) {
  switch (action.type) {
    case 'append-key':
      return appendAmountExpressionKey(state, action.key ?? '');
    case 'backspace':
      return backspaceAmountExpression(state);
    case 'clear':
      return clearAmountExpression();
    case 'settle':
      return settleAmountExpression(state);
    default:
      return state;
  }
}

const COMPLETE_EXPRESSION_PATTERN = /^\d+(?:\.\d+)?(?:[+-]\d+(?:\.\d+)?)*$/;
const PURE_AMOUNT_PATTERN = /^-?\d+(?:\.\d+)?$/;

/**
 * @returns {{ expression: string, amount: string, canSubmit: boolean }}
 */
export function createAmountExpressionState() {
  return createEmptyAmountExpressionState();
}

/**
 * @param {{ expression: string }} state
 * @param {string} key
 * @returns {{ expression: string, amount: string, canSubmit: boolean }}
 */
export function appendAmountExpressionKey(state, key) {
  const expression = getExpressionInput(state);

  if (!/^[0-9.+-]$/.test(key)) {
    return deriveAmountExpressionState(expression);
  }

  return deriveAmountExpressionState(`${expression}${key}`);
}

/**
 * @param {{ expression: string }} state
 * @returns {{ expression: string, amount: string, canSubmit: boolean }}
 */
export function backspaceAmountExpression(state) {
  const expression = getExpressionInput(state);
  return deriveAmountExpressionState(expression.slice(0, -1));
}

/**
 * @returns {{ expression: string, amount: string, canSubmit: boolean }}
 */
export function clearAmountExpression() {
  return createEmptyAmountExpressionState();
}

/**
 * @param {{ expression: string }} state
 * @returns {{ expression: string, amount: string, canSubmit: boolean }}
 */
export function settleAmountExpression(state) {
  const expression = getExpressionInput(state);
  const amount = evaluateAmountExpression(expression);

  if (amount === null) {
    return createEmptyAmountExpressionState();
  }

  return {
    expression: amount,
    amount,
    canSubmit: isPositiveAmount(amount),
  };
}

/**
 * @param {string} expression
 * @returns {{ expression: string, amount: string, canSubmit: boolean }}
 */
function deriveAmountExpressionState(expression) {
  if (!expression) {
    return createEmptyAmountExpressionState();
  }

  if (PURE_AMOUNT_PATTERN.test(expression)) {
    return {
      expression,
      amount: normalizeAmountString(expression),
      canSubmit: isPositiveAmount(expression),
    };
  }

  const amount = evaluateAmountExpression(expression);

  return {
    expression,
    amount: amount ?? '',
    canSubmit: false,
  };
}

/**
 * @returns {{ expression: string, amount: string, canSubmit: boolean }}
 */
function createEmptyAmountExpressionState() {
  return {
    expression: '',
    amount: '',
    canSubmit: false,
  };
}

/**
 * @param {unknown} state
 * @returns {string}
 */
function getExpressionInput(state) {
  return typeof state?.expression === 'string' ? state.expression : '';
}

/**
 * @param {string} expression
 * @returns {string | null}
 */
function evaluateAmountExpression(expression) {
  if (!COMPLETE_EXPRESSION_PATTERN.test(expression)) {
    return null;
  }

  const tokens = expression.match(/\d+(?:\.\d+)?|[+-]/g);

  if (!tokens || tokens.length === 0) {
    return null;
  }

  const numbers = tokens.filter((token) => token !== '+' && token !== '-');
  const scale = numbers.reduce((maxScale, token) => {
    const decimalDigits = token.split('.')[1]?.length ?? 0;
    return Math.max(maxScale, decimalDigits);
  }, 0);

  let total = scaleNumberToBigInt(tokens[0], scale);

  for (let index = 1; index < tokens.length; index += 2) {
    const operator = tokens[index];
    const nextValue = scaleNumberToBigInt(tokens[index + 1], scale);

    total = operator === '+' ? total + nextValue : total - nextValue;
  }

  return formatScaledBigInt(total, scale);
}

/**
 * @param {string} value
 * @param {number} scale
 * @returns {bigint}
 */
function scaleNumberToBigInt(value, scale) {
  const [integerPart, decimalPart = ''] = value.split('.');
  const scaledDigits = integerPart + decimalPart.padEnd(scale, '0');
  return BigInt(scaledDigits);
}

/**
 * @param {bigint} value
 * @param {number} scale
 * @returns {string}
 */
function formatScaledBigInt(value, scale) {
  const isNegative = value < 0;
  const absoluteValue = isNegative ? -value : value;
  const digits = absoluteValue.toString().padStart(scale + 1, '0');

  if (scale === 0) {
    return `${isNegative ? '-' : ''}${digits}`;
  }

  const integerDigits = digits.slice(0, -scale) || '0';
  const fractionDigits = digits.slice(-scale).replace(/0+$/, '');
  const signedInteger = `${isNegative ? '-' : ''}${integerDigits}`;

  if (!fractionDigits) {
    return signedInteger === '-0' ? '0' : signedInteger;
  }

  return `${signedInteger}.${fractionDigits}`;
}

/**
 * @param {string} amount
 * @returns {string}
 */
function normalizeAmountString(amount) {
  const [rawIntegerPart, rawDecimalPart = ''] = amount.split('.');
  const sign = rawIntegerPart.startsWith('-') ? '-' : '';
  const unsignedIntegerPart = sign ? rawIntegerPart.slice(1) : rawIntegerPart;
  const integerPart = unsignedIntegerPart.replace(/^0+(?=\d)/, '') || '0';
  const decimalPart = rawDecimalPart.replace(/0+$/, '');
  const normalizedInteger = `${sign}${integerPart}`;

  if (!decimalPart) {
    return normalizedInteger === '-0' ? '0' : normalizedInteger;
  }

  return `${normalizedInteger}.${decimalPart}`;
}

/**
 * @param {string} amount
 * @returns {boolean}
 */
function isPositiveAmount(amount) {
  const normalizedAmount = normalizeAmountString(amount);

  if (normalizedAmount.startsWith('-')) {
    return false;
  }

  return normalizedAmount !== '0';
}

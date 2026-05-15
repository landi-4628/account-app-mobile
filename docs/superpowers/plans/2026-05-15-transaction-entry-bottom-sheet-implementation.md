# Transaction Entry Bottom Sheet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the mobile transaction entry screen around category-first selection with a conditional bottom sheet, custom calculator keypad, and submit gating based on settled amount expressions.

**Architecture:** Keep `TransactionForm` as the integration surface for the screen, but move amount entry behavior into a dedicated pure support module so expression parsing, keypad transitions, and submit enablement can be tested independently. Then refactor the form layout to a top category surface plus conditional bottom sheet while reusing the existing draft payload builder and date picker modal.

**Tech Stack:** Expo Router, React Native, existing accounting theme helpers, Node test runner (`node --experimental-default-type=module --test`)

---

## File Structure

- Modify: `components/accounting/transaction-form.jsx`
  - Replace the current stacked form layout with the green header tabs, always-visible category grid, conditional bottom sheet, and custom keypad actions.
- Create: `components/accounting/transaction-amount-expression-support.js`
  - Pure helpers for keypad input, expression validation, resolution, and submit gating.
- Create: `components/accounting/transaction-amount-expression-support.test.js`
  - Focused unit tests for keypad state transitions and `=` / `完成` rules.
- Modify: `components/accounting/transaction-form-support.js`
  - Only if needed to keep amount draft defaults aligned with the new amount expression state.
- Modify: `components/accounting/transaction-form-support.test.js`
  - Add or adjust coverage if draft synchronization behavior changes.
- Modify: `components/accounting/transaction-form.jsx` tests or add new focused tests under `components/accounting/`
  - Cover sheet visibility, category switching, and submit gating at the component behavior level.

### Task 1: Build Amount Expression Support

**Files:**
- Create: `components/accounting/transaction-amount-expression-support.js`
- Create: `components/accounting/transaction-amount-expression-support.test.js`

- [ ] **Step 1: Write the failing tests**

```js
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  appendExpressionKey,
  backspaceExpression,
  clearExpression,
  createAmountExpressionState,
  resolveExpression,
} from './transaction-amount-expression-support.js';

test('builds a simple expression from keypad input', () => {
  let state = createAmountExpressionState();
  state = appendExpressionKey(state, '1');
  state = appendExpressionKey(state, '2');
  state = appendExpressionKey(state, '+');
  state = appendExpressionKey(state, '3');

  assert.equal(state.expression, '12+3');
  assert.equal(state.canSubmit, false);
});

test('resolves a complete expression into a settled amount', () => {
  const result = resolveExpression({ expression: '12+3-1' });

  assert.deepEqual(result, {
    expression: '14',
    amountInput: '14',
    canSubmit: true,
    cleared: false,
  });
});

test('clears an incomplete expression when equals is pressed', () => {
  const result = resolveExpression({ expression: '12+' });

  assert.deepEqual(result, {
    expression: '',
    amountInput: '',
    canSubmit: false,
    cleared: true,
  });
});

test('backspace removes the last key and updates submit gating', () => {
  let state = createAmountExpressionState({ expression: '18' });
  state = backspaceExpression(state);

  assert.equal(state.expression, '1');
  assert.equal(state.canSubmit, true);
});

test('prevents multiple decimal points in one segment', () => {
  let state = createAmountExpressionState();
  state = appendExpressionKey(state, '1');
  state = appendExpressionKey(state, '.');
  state = appendExpressionKey(state, '2');
  state = appendExpressionKey(state, '.');

  assert.equal(state.expression, '1.2');
});

test('clear resets the expression state', () => {
  assert.deepEqual(clearExpression({ expression: '9-1', amountInput: '', canSubmit: false }), {
    expression: '',
    amountInput: '',
    canSubmit: false,
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-default-type=module --test .\components\accounting\transaction-amount-expression-support.test.js`

Expected: FAIL with module-not-found or missing export errors for `transaction-amount-expression-support.js`.

- [ ] **Step 3: Write the minimal implementation**

```js
function buildExpressionMeta(expression) {
  const hasOperator = /[+-]/.test(expression);
  const complete = /^\d+(\.\d+)?([+-]\d+(\.\d+)?)*$/.test(expression);
  const amountInput = !hasOperator && /^\d+(\.\d+)?$/.test(expression) ? expression : '';

  return {
    expression,
    amountInput,
    canSubmit: amountInput !== '' && Number(amountInput) > 0,
    complete,
    hasOperator,
  };
}

export function createAmountExpressionState(input = {}) {
  return buildExpressionMeta(input.expression ?? '');
}

export function appendExpressionKey(state, key) {
  const expression = state.expression ?? '';
  const next = applyKey(expression, key);
  return buildExpressionMeta(next);
}

export function backspaceExpression(state) {
  return buildExpressionMeta((state.expression ?? '').slice(0, -1));
}

export function clearExpression() {
  return buildExpressionMeta('');
}

export function resolveExpression(state) {
  const meta = buildExpressionMeta(state.expression ?? '');
  if (!meta.complete) {
    return { expression: '', amountInput: '', canSubmit: false, cleared: true };
  }

  const total = meta.expression
    .split(/(?=[+-])/)
    .reduce((sum, token) => sum + Number(token), 0);
  const settled = `${total}`.replace(/\.0+$/, '');

  return {
    expression: settled,
    amountInput: settled,
    canSubmit: Number(settled) > 0,
    cleared: false,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-default-type=module --test .\components\accounting\transaction-amount-expression-support.test.js`

Expected: PASS for all expression-support cases.

- [ ] **Step 5: Commit**

```bash
git add components/accounting/transaction-amount-expression-support.js components/accounting/transaction-amount-expression-support.test.js
git commit -m "feat: add transaction amount expression helpers"
```

### Task 2: Refactor TransactionForm Layout To Category + Bottom Sheet

**Files:**
- Modify: `components/accounting/transaction-form.jsx`
- Test: `components/accounting/transaction-form-behavior.test.js` or equivalent focused test file under `components/accounting/`

- [ ] **Step 1: Write the failing component behavior tests**

```js
test('does not render the bottom sheet before a category is selected', () => {
  // Render create-mode form with category options and no forced selection.
  // Assert the amount display, keypad, and complete button are absent.
});

test('keeps the bottom sheet visible while switching categories', () => {
  // Select category A, assert sheet appears, then select category B.
  // Assert sheet still exists and active category changed.
});

test('keeps complete disabled until expression is settled', () => {
  // Tap category, then keypad 1, 2, +, 3.
  // Assert "完成" disabled. Tap "=" and assert "完成" enabled.
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run the project’s focused component test command for the chosen file.

Expected: FAIL because the current `TransactionForm` still renders the vertical amount/date/note form immediately.

- [ ] **Step 3: Implement the layout refactor**

```jsx
const [selectedCategoryId, setSelectedCategoryId] = useState('');
const [expressionState, setExpressionState] = useState(() =>
  createAmountExpressionState({ expression: initialExpression })
);
const sheetVisible = selectedCategoryId !== '';

function handleCategoryPress(categoryId) {
  setSelectedCategoryId(categoryId);
  setDraft((currentDraft) => ({ ...currentDraft, categoryId }));
}

function handleResolveExpression() {
  const resolved = resolveExpression(expressionState);
  setExpressionState(resolved);
  setDraft((currentDraft) => ({ ...currentDraft, amountInput: resolved.amountInput }));
}

function handleSubmitPress() {
  if (!expressionState.canSubmit) {
    return;
  }

  const result = buildTransactionFormSubmitPayload(
    { ...draft, amountInput: expressionState.amountInput },
    { timeZoneOffset, defaultSyncStatus }
  );
  setErrors(result.errors);
  if (result.values) {
    onSubmit(result.values);
  }
}
```

Implementation notes for this step:
- Replace `FieldBlock` usage for amount/date/note with:
  - type tabs in a green surface
  - category grid using icon-circle visual only
  - conditional `BottomSheetPanel`
- Keep `DatePickerModal` and note draft value wiring
- Use a note row press target instead of a full-height textarea in the initial sheet
- Keep edit-mode delete behavior only if still needed by the screen; otherwise isolate create-mode UI cleanly without regressing edit flows

- [ ] **Step 4: Run tests to verify they pass**

Run the focused component tests plus the existing date-picker tests:

`node --experimental-default-type=module --test .\components\accounting\date-picker-support.test.js`

and the chosen `TransactionForm` behavior test command.

Expected: PASS for sheet visibility, category switching, and submit gating.

- [ ] **Step 5: Commit**

```bash
git add components/accounting/transaction-form.jsx components/accounting/<transaction-form-test-file>
git commit -m "feat: redesign transaction form as category bottom sheet"
```

### Task 3: Sync Draft State, Time, And Note Behavior

**Files:**
- Modify: `components/accounting/transaction-form.jsx`
- Modify: `components/accounting/transaction-form-support.js`
- Modify: `components/accounting/transaction-form-support.test.js`

- [ ] **Step 1: Write the failing synchronization tests**

```js
test('keeps note and date draft values while switching category', () => {
  // Seed a draft with note/date, switch categories, assert note/date unchanged.
});

test('does not produce a submit payload when amount input is empty after invalid equals', () => {
  const result = buildTransactionFormSubmitPayload(
    {
      type: 'expense',
      amountInput: '',
      categoryId: 'cat-food',
      accountId: 'acc-cash',
      dateInput: '2026-05-15',
      timeInput: '09:39',
      note: '',
    },
    { timeZoneOffset: '+08:00', defaultSyncStatus: 'pending' }
  );

  assert.equal(result.values, null);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --experimental-default-type=module --test .\components\accounting\transaction-form-support.test.js`

Expected: FAIL if the support layer still assumes direct amount text entry only.

- [ ] **Step 3: Implement minimal synchronization fixes**

```js
// Preserve draft.note and draft.dateInput/date state while category changes.
setDraft((currentDraft) => ({
  ...currentDraft,
  categoryId: nextCategoryId,
}));

// Only mirror expressionState.amountInput into draft.amountInput after a settled "=" result.
if (resolved.canSubmit) {
  setDraft((currentDraft) => ({ ...currentDraft, amountInput: resolved.amountInput }));
} else {
  setDraft((currentDraft) => ({ ...currentDraft, amountInput: '' }));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --experimental-default-type=module --test .\components\accounting\transaction-form-support.test.js`

Expected: PASS for draft and payload behavior.

- [ ] **Step 5: Commit**

```bash
git add components/accounting/transaction-form.jsx components/accounting/transaction-form-support.js components/accounting/transaction-form-support.test.js
git commit -m "fix: preserve transaction draft across category sheet flow"
```

### Task 4: Final Visual Polish And Regression Pass

**Files:**
- Modify: `components/accounting/transaction-form.jsx`
- Optional touch-up: `components/accounting/category-icon.js` if icon-circle behavior needs a shared prop adjustment

- [ ] **Step 1: Add any missing visual assertions or smoke tests**

```js
test('renders active category with icon-circle emphasis only', () => {
  // Assert active icon background changes without active label badge/chip styling.
});
```

- [ ] **Step 2: Run the new visual/smoke test and confirm it fails before the final polish**

Run the focused component test command for the new assertion.

Expected: FAIL if active-state styling still uses old chip treatment.

- [ ] **Step 3: Apply final style polish**

```jsx
typeTabs: {
  backgroundColor: colors.brand,
},
categoryIconActive: {
  backgroundColor: colors.brand,
},
bottomSheet: {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  borderTopLeftRadius: radius.xl,
  borderTopRightRadius: radius.xl,
},
completeButtonDisabled: {
  opacity: 0.4,
},
```

Also verify:
- top bar uses the app green instead of the old yellow
- sheet remains visible while category switches
- `=` clears invalid expressions without showing a modal error

- [ ] **Step 4: Run the regression suite**

Run:

`node --experimental-default-type=module --test .\components\accounting\transaction-amount-expression-support.test.js`

`node --experimental-default-type=module --test .\components\accounting\transaction-form-support.test.js`

`node --experimental-default-type=module --test .\components\accounting\date-picker-support.test.js`

plus the focused `TransactionForm` behavior test file.

Expected: PASS across all targeted tests.

- [ ] **Step 5: Commit**

```bash
git add components/accounting/transaction-form.jsx components/accounting/category-icon.js components/accounting/transaction-amount-expression-support.js components/accounting/transaction-amount-expression-support.test.js components/accounting/transaction-form-support.js components/accounting/transaction-form-support.test.js components/accounting/<transaction-form-test-file>
git commit -m "feat: complete bottom sheet transaction entry redesign"
```

## Self-Review

- Spec coverage:
  - Category-first flow: Task 2
  - Bottom sheet conditional rendering: Task 2
  - Expression keypad and `=` rules: Task 1
  - Submit gating and payload reuse: Tasks 1, 2, 3
  - Date and note preservation: Task 3
  - Final styling with green top surface and icon-only active emphasis: Task 4
- Placeholder scan:
  - The only open variable is the exact focused component test filename because the current repo may already have a preferred test file. Choose one concrete file before execution and use it consistently.
- Type consistency:
  - Use `expressionState.amountInput` as the only settled amount mirrored into `draft.amountInput`
  - `canSubmit` means “pure resolved positive amount ready for submit” everywhere in the plan

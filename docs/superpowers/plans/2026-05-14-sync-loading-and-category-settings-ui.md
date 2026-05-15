# Sync Loading And Category Settings UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add visible loading coverage to all remote sync-related requests and replace the new-transaction category add button with a settings entry that routes to category management.

**Architecture:** Centralize remote activity tracking in the provider so every remote sync-related request can publish a loading message into one shared backdrop. Keep the transaction form shared, but replace inline category creation with an icon action that routes to the existing categories screen using the current entry type as navigation context.

**Tech Stack:** Expo Router, React Native, provider state, Node source tests

---

### Task 1: Lock behavior with tests

**Files:**
- Modify: `tests/feedback-dialog-wiring.test.js`
- Create: `tests/remote-loading-wiring.test.js`

- [ ] Add a source-level test that removes expectations for inline category creation and asserts the transaction form exposes a category management callback instead.
- [ ] Add a provider wiring test that requires remote activity tracking to wrap load, sync, ledger, and category remote actions.

### Task 2: Add provider-level remote activity tracking

**Files:**
- Modify: `providers/mock-app-provider.js`

- [ ] Add remote activity state and a helper that wraps async remote requests with begin/end tracking.
- [ ] Route hydrate, sync, ledger, and category remote operations through that helper.
- [ ] Replace the bootstrap-only backdrop with a shared remote activity backdrop.

### Task 3: Replace inline category creation in the transaction form

**Files:**
- Modify: `components/accounting/transaction-form.jsx`
- Modify: `app/transaction/new.jsx`
- Modify: `app/transaction/[id].jsx`

- [ ] Remove inline category composer state and actions from the shared form.
- [ ] Add a settings icon action in the category grid.
- [ ] Route category management through an explicit callback prop passed from transaction screens.

### Task 4: Default category management to the current entry type

**Files:**
- Modify: `app/categories/index.jsx`

- [ ] Read the route `entryType` param on first render.
- [ ] Initialize the category page filter from that param when valid.

### Task 5: Verify

**Files:**
- Test: `tests/feedback-dialog-wiring.test.js`
- Test: `tests/remote-loading-wiring.test.js`

- [ ] Run targeted tests first.
- [ ] Run `npm.cmd run lint`.

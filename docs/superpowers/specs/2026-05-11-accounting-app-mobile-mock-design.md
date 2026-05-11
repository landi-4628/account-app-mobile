# Accounting App Mobile Mock Frontend Design

## Goal

Implement the `account-app-mobile` Expo app as a componentized local-mock MVP shell based on the product and UI specs in the repository. The result should behave like a usable product prototype: full page flow, coherent visual system, and cross-screen mock interactions, while intentionally excluding backend, auth, SQLite persistence, and sync execution.

## Scope

This design applies only to `account-app-mobile`.

Included:

- Bottom-tab app shell
- Home, Details, Statistics, Profile tabs
- Quick Add bottom sheet in compact and expanded states
- Accounts management screen
- Categories management screen
- Transaction detail screen
- Shared theme and reusable UI components
- Centralized local mock data
- In-memory interactions that update multiple screens in one session

Excluded:

- Real login, registration, forgot-password flow
- API integration
- SQLite storage
- Background sync jobs
- Token/session management
- Complex search and filters
- Production-grade form validation and persistence

## Product Positioning For This Phase

This phase is a front-end-first mock implementation of the accounting MVP. The app should present the intended product shape for a personal bookkeeping tool:

- quick entry for daily bookkeeping
- monthly overview and statistics
- lightweight account and category management
- clear but restrained sync-state feedback

The mock should feel like a real app, not a static design dump.

## Recommended Implementation Approach

Use a componentized mock shell.

This is the middle path between two weaker options:

- a static page assembly approach would be fast but would scatter mock state and make later data integration expensive
- an early repository/store architecture would be more extensible but too heavy for the current goal

The chosen approach should:

- keep screens thin
- centralize mock data
- establish reusable business UI components
- allow later replacement of mock data sources with SQLite or API-backed sources

## Navigation Design

Retain Expo Router as the navigation system.

### Primary Navigation

The bottom navigation should expose:

1. Home
2. Details
3. Statistics
4. Profile

The center action is a primary bookkeeping trigger, not a standalone information page. It should open the Quick Add sheet from anywhere the tab bar is shown.

### Secondary Navigation

Additional pushed screens:

- Accounts
- Categories
- Transaction Detail

These should be reachable from Home shortcuts, Profile management lists, and transaction taps where appropriate.

## Information Architecture

### Home

Purpose:

- show the current month summary
- show recent transactions
- expose the fastest bookkeeping entry point
- expose high-value shortcuts

Structure:

- header
- monthly summary card
- quick actions grid
- recent transactions section
- sync hint

### Details

Purpose:

- browse transactions grouped by day
- switch month context
- open transaction detail

### Statistics

Purpose:

- show monthly income, expense, and balance
- show expense and income category breakdowns

### Profile

Purpose:

- show user/account context
- show sync state presentation
- provide management entry points
- surface settings-style rows including logout styling

### Accounts

Purpose:

- list lightweight balance accounts
- open add/edit account forms
- toggle active state in mock mode

### Categories

Purpose:

- switch between expense and income categories
- list categories
- open add/edit category forms

### Transaction Detail

Purpose:

- show full transaction fields
- allow mock edit/delete actions

## Visual System

Follow the UI spec as the implementation baseline and replace the Expo starter look entirely.

### Core Visual Rules

- page background: `#F7F8F4`
- card background: `#FFFFFF`
- brand tint: `#2F8F83`
- income color: `#2E9B62`
- expense color: `#E07A5F`
- text hierarchy:
  - primary `#1F2A24`
  - secondary `#66736D`
  - muted `#94A19B`
- page horizontal padding: `16`
- section spacing: `20`
- card padding: `16`
- border radius scale: `10 / 12 / 16 / 999`

### Design Intent

The interface should feel:

- light
- clear
- stable
- efficient

It should avoid:

- marketing-style hero composition
- loud decorative gradients
- heavy shadows
- dense enterprise-dashboard styling

## Code Organization

### Route Files

Recommended route structure:

- `app/_layout.tsx`
- `app/(tabs)/_layout.tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/details.tsx`
- `app/(tabs)/statistics.tsx`
- `app/(tabs)/profile.tsx`
- `app/accounts.tsx`
- `app/categories.tsx`
- `app/transaction/[id].tsx`

### Business UI Components

Create a dedicated business UI area:

- `components/accounting/`

This should hold reusable accounting-specific UI instead of mixing it into the Expo starter sample components.

### Theme And Constants

Use `constants/` for:

- colors
- spacing
- radius
- shadows
- text sizes
- icon mappings where useful
- UI copy constants if reused

### Mock Data

Create:

- `data/mock/`

This should be the single source for demo content used by screens.

### Pure Utilities

Use `utils/` for formatting and grouping logic such as:

- currency formatting
- month labels
- relative group labels like today/yesterday
- transaction grouping by date

## Component Model

### Reusable UI Components

The first implementation should establish the following reusable building blocks:

- `AppHeader`
- `MonthSwitcher`
- `SummaryCard`
- `QuickActionGrid`
- `TransactionListItem`
- `TransactionGroupSection`
- `TransactionListSection`
- `SyncBadge`
- `SyncStatusCard`
- `SegmentedControl`
- `AmountDisplayInput`
- `CategoryChip`
- `FormRow`
- `BottomSheetScaffold`
- `EmptyState`
- `SectionCard`

### Composite Feature Component

Create a dedicated `QuickAddSheet` component that manages:

- compact versus expanded layout
- expense/income toggle
- amount display
- category selection
- optional fields for account, time, and note
- save action

This component should own local presentation logic and delegate data mutation through a thin mock action interface.

## Data Shape And Mock State

Mock data should be centralized rather than embedded inside screens.

Recommended files:

- `data/mock/mockUser.ts`
- `data/mock/mockAccounts.ts`
- `data/mock/mockCategories.ts`
- `data/mock/mockTransactions.ts`
- `data/mock/mockStatistics.ts`

The mock layer should provide enough structure to support:

- one default ledger
- several accounts
- income and expense categories
- recent transactions
- monthly summary values
- sync-state display values

## State Strategy

Use lightweight React state for this phase.

Rules:

- screen-local concerns stay in `useState`
- shared demo mutations should be lifted into a thin in-memory app-level provider or local shared state mechanism
- do not introduce Zustand in this phase
- do not introduce TanStack Query in this phase

Rationale:

- current scope is front-end mock interaction
- persistence and server coordination are intentionally absent
- the simplest state model is easier to verify and replace later

## Interaction Design

### Home

- tapping quick actions navigates to their respective screens
- tapping a transaction opens transaction detail
- tapping the main add trigger opens Quick Add

### Quick Add

- default state is compact
- compact includes type switch, amount, categories, and save
- expanded adds account, time, and note
- save mutates in-memory transaction data
- after save, Home, Details, and Statistics should reflect the change in the same session

### Details

- supports month switching
- groups transactions by day
- opens detail screen on item tap

### Statistics

- supports month switching
- displays income, expense, and balance summary
- displays lightweight mock chart sections and ranked breakdown lists

### Profile

- shows account information and sync state
- "sync now" remains a visual/mock action only

### Accounts And Categories

- open add/edit forms in a bottom sheet or modal pattern consistent with the app
- create and edit values in local memory
- support active/inactive state display

### Transaction Detail

- shows all transaction fields
- supports mock edit and delete actions
- updates shared in-memory state after mutation

## Acceptance Criteria

The implementation is acceptable for this phase only if all of the following are true:

- the UI clearly follows the product and UI spec documents
- all core screens are reachable and usable
- the visual language is coherent and no longer resembles the Expo starter app
- Quick Add supports both compact and expanded modes
- creating a mock transaction updates the relevant screens in-session
- navigation from Home to management and detail pages works
- empty-state, sync-state, and summary-state visuals are covered where required

## Deferred Work

The following are intentionally deferred and should not shape the implementation beyond leaving clean extension points:

- real auth screens and flows
- local SQLite repository
- sync queue and background execution
- API contracts and client integration
- token refresh handling
- robust validation and offline conflict logic

## Extension Readiness

Even though this phase is mock-only, the implementation should leave clean boundaries for the next phase:

- screen components should not own raw business data definitions
- formatting and grouping logic should live outside screens
- reusable UI should not be tied to a single route
- future persistence should be able to replace the mock source without rewriting the visual structure

## Risks And Controls

### Risk: mock state gets scattered across routes

Control:

- centralize demo data and shared mutations

### Risk: implementation drifts from spec due to convenience

Control:

- build from the documented layout, spacing, and copy baseline

### Risk: overengineering mock infrastructure

Control:

- use only the minimum shared state needed for cross-screen updates

## Final Design Decision

Build `account-app-mobile` as a componentized local-mock product shell with:

- full MVP screen coverage for the mobile client
- centralized mock data
- thin route files
- reusable accounting UI components
- a spec-driven visual system
- in-memory cross-screen updates for add/edit/delete bookkeeping flows

This provides the fastest route to a convincing, testable mobile prototype while keeping the codebase ready for the next phase of real data integration.

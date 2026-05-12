# Accounting App Mobile Mock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `account-app-mobile` into a runnable accounting MVP mock frontend that matches the approved product/UI specs and uses in-memory local mock data across all core screens.

**Architecture:** Replace the Expo starter screens with a spec-driven tab shell, centralized mock data, a thin app-level mock provider for shared mutations, and reusable accounting UI components. Keep routes thin, move formatting/grouping logic into utilities, and use lightweight local/shared React state instead of persistence or network layers.

**Tech Stack:** Expo Router, React Native, TypeScript, Expo vector icons, React state/context, Expo lint, TypeScript compiler

---

## File Structure

### Existing files to modify

- `app/_layout.tsx` - root stack and status bar setup
- `app/(tabs)/_layout.tsx` - bottom tabs and global add entry point
- `app/(tabs)/index.tsx` - replace starter Home screen
- `constants/theme.ts` - replace starter theme tokens with product tokens
- `package.json` - add `typecheck` script if needed for verification

### Existing files to delete or stop referencing

- `app/(tabs)/explore.tsx` - replace with `details.tsx`
- starter-only component usage from:
  - `components/hello-wave.tsx`
  - `components/parallax-scroll-view.tsx`
  - `components/themed-text.tsx`
  - `components/themed-view.tsx`
  - `components/ui/collapsible.tsx`

### New route files

- `app/(tabs)/details.tsx`
- `app/(tabs)/statistics.tsx`
- `app/(tabs)/profile.tsx`
- `app/accounts.tsx`
- `app/categories.tsx`
- `app/transaction/[id].tsx`

### New app/state files

- `providers/mock-app-provider.tsx`
- `hooks/use-mock-app.ts`
- `types/accounting.ts`

### New constants and utility files

- `constants/accounting-theme.ts`
- `constants/accounting-copy.ts`
- `utils/currency.ts`
- `utils/date.ts`
- `utils/transactions.ts`

### New mock data files

- `data/mock/mock-user.ts`
- `data/mock/mock-accounts.ts`
- `data/mock/mock-categories.ts`
- `data/mock/mock-transactions.ts`
- `data/mock/mock-statistics.ts`
- `data/mock/index.ts`

### New business UI component files

- `components/accounting/screen.tsx`
- `components/accounting/app-header.tsx`
- `components/accounting/month-switcher.tsx`
- `components/accounting/summary-card.tsx`
- `components/accounting/quick-action-grid.tsx`
- `components/accounting/transaction-list-item.tsx`
- `components/accounting/transaction-group-section.tsx`
- `components/accounting/transaction-list-section.tsx`
- `components/accounting/sync-badge.tsx`
- `components/accounting/sync-status-card.tsx`
- `components/accounting/segmented-control.tsx`
- `components/accounting/amount-display-input.tsx`
- `components/accounting/category-chip.tsx`
- `components/accounting/form-row.tsx`
- `components/accounting/bottom-sheet-scaffold.tsx`
- `components/accounting/empty-state.tsx`
- `components/accounting/section-card.tsx`
- `components/accounting/quick-add-sheet.tsx`

## Task 1: Establish Shared Domain, Theme, And Mock Data Foundations

**Files:**
- Create: `types/accounting.ts`
- Create: `constants/accounting-theme.ts`
- Create: `constants/accounting-copy.ts`
- Create: `data/mock/mock-user.ts`
- Create: `data/mock/mock-accounts.ts`
- Create: `data/mock/mock-categories.ts`
- Create: `data/mock/mock-transactions.ts`
- Create: `data/mock/mock-statistics.ts`
- Create: `data/mock/index.ts`
- Modify: `constants/theme.ts`
- Modify: `package.json`

- [ ] **Step 1: Add the `typecheck` script so verification can use both lint and TypeScript**

```json
{
  "scripts": {
    "start": "expo start",
    "reset-project": "node ./scripts/reset-project.js",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "lint": "expo lint",
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **Step 2: Create shared accounting domain types**

```ts
export type EntryType = 'expense' | 'income';
export type SyncStatus = 'synced' | 'pending' | 'failed';
export type AccountType = 'cash' | 'bank' | 'alipay' | 'wechat';

export type LedgerAccount = {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  isActive: boolean;
};

export type TransactionRecord = {
  id: string;
  type: EntryType;
  amount: number;
  categoryId: string;
  accountId: string;
  note: string;
  transactionAt: string;
  syncStatus: SyncStatus;
};
```

- [ ] **Step 3: Replace starter theme tokens with accounting tokens and aliases**

```ts
export const accountingTheme = {
  colors: {
    background: '#F7F8F4',
    surface: '#FFFFFF',
    border: '#E6EBE7',
    brand: '#2F8F83',
    brandSoft: '#DFF3EE',
    income: '#2E9B62',
    expense: '#E07A5F',
    warning: '#D97706',
    danger: '#C65A46',
    text: '#1F2A24',
    textSecondary: '#66736D',
    textMuted: '#94A19B',
  },
  spacing: { xs: 8, sm: 12, md: 16, lg: 20, xl: 24 },
  radius: { sm: 10, md: 12, lg: 16, pill: 999 },
};
```

- [ ] **Step 4: Add concrete mock fixtures that match the approved product copy**

```ts
export const mockTransactions = [
  {
    id: 'tx-lunch',
    type: 'expense',
    amount: 3200,
    categoryId: 'cat-food',
    accountId: 'acc-wechat',
    note: '午饭',
    transactionAt: '2026-05-11T12:30:00+08:00',
    syncStatus: 'pending',
  },
  {
    id: 'tx-salary',
    type: 'income',
    amount: 1200000,
    categoryId: 'cat-salary',
    accountId: 'acc-bank',
    note: '五月工资',
    transactionAt: '2026-05-10T09:00:00+08:00',
    syncStatus: 'synced',
  },
];
```

- [ ] **Step 5: Run static verification after the foundation files exist**

Run: `npm run lint`
Expected: lint completes without syntax errors in the new constants/types/mock modules

Run: `npm run typecheck`
Expected: TypeScript completes without path or type errors in the new shared modules

- [ ] **Step 6: Commit**

```bash
git add package.json constants/theme.ts constants/accounting-theme.ts constants/accounting-copy.ts types/accounting.ts data/mock
git commit -m "feat: add accounting theme and mock data foundation"
```

## Task 2: Create Shared Mock App State And Mutation Layer

**Files:**
- Create: `providers/mock-app-provider.tsx`
- Create: `hooks/use-mock-app.ts`
- Modify: `app/_layout.tsx`
- Test: `providers/mock-app-provider.tsx`

- [ ] **Step 1: Create a thin app-level provider for shared in-memory state**

```ts
type MockAppState = {
  currentMonth: string;
  transactions: TransactionRecord[];
  accounts: LedgerAccount[];
  selectedEntryType: EntryType;
  quickAddOpen: boolean;
};

type MockAppActions = {
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
  setCurrentMonth: (month: string) => void;
  setSelectedEntryType: (type: EntryType) => void;
  addTransaction: (input: NewTransactionInput) => void;
  updateTransaction: (id: string, input: EditTransactionInput) => void;
  deleteTransaction: (id: string) => void;
};
```

- [ ] **Step 2: Implement deterministic mutation behavior using local arrays and derived selectors**

```ts
const addTransaction = (input: NewTransactionInput) => {
  const record: TransactionRecord = {
    id: `tx-${Date.now()}`,
    type: input.type,
    amount: input.amount,
    categoryId: input.categoryId,
    accountId: input.accountId,
    note: input.note ?? '',
    transactionAt: input.transactionAt,
    syncStatus: 'pending',
  };

  setTransactions((current) => [record, ...current]);
};
```

- [ ] **Step 3: Mount the provider at the root so all routes can share mock state**

```tsx
export default function RootLayout() {
  return (
    <MockAppProvider>
      <ThemeProvider value={navigationTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="accounts" options={{ headerShown: false }} />
          <Stack.Screen name="categories" options={{ headerShown: false }} />
          <Stack.Screen name="transaction/[id]" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </MockAppProvider>
  );
}
```

- [ ] **Step 4: Verify the provider compiles cleanly**

Run: `npm run typecheck`
Expected: app root, provider, and hook types compile without context-nullability errors

Run: `npm run lint`
Expected: lint passes for root layout and provider files

- [ ] **Step 5: Commit**

```bash
git add app/_layout.tsx providers/mock-app-provider.tsx hooks/use-mock-app.ts
git commit -m "feat: add shared mock app provider"
```

## Task 3: Replace The Starter Tab Shell With Accounting Navigation

**Files:**
- Modify: `app/(tabs)/_layout.tsx`
- Create: `app/(tabs)/details.tsx`
- Create: `app/(tabs)/statistics.tsx`
- Create: `app/(tabs)/profile.tsx`
- Modify: `app/(tabs)/index.tsx`
- Delete/replace usage from: `app/(tabs)/explore.tsx`

- [ ] **Step 1: Define the four-tab shell with a center add trigger**

```tsx
<Tabs screenOptions={{ headerShown: false, tabBarStyle: styles.tabBar }}>
  <Tabs.Screen name="index" options={{ title: '首页', tabBarIcon: homeIcon }} />
  <Tabs.Screen name="details" options={{ title: '明细', tabBarIcon: receiptIcon }} />
  <Tabs.Screen name="statistics" options={{ title: '统计', tabBarIcon: statsIcon }} />
  <Tabs.Screen name="profile" options={{ title: '我的', tabBarIcon: userIcon }} />
</Tabs>
```

- [ ] **Step 2: Add the floating primary action as a tab-bar overlay instead of a fifth route**

```tsx
return (
  <View style={{ flex: 1 }}>
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: styles.tabBar }}>
      <Tabs.Screen name="index" options={{ title: '首页', tabBarIcon: homeIcon }} />
      <Tabs.Screen name="details" options={{ title: '明细', tabBarIcon: receiptIcon }} />
      <Tabs.Screen name="statistics" options={{ title: '统计', tabBarIcon: statsIcon }} />
      <Tabs.Screen name="profile" options={{ title: '我的', tabBarIcon: userIcon }} />
    </Tabs>
    <View pointerEvents="box-none" style={styles.fabContainer}>
      <Pressable accessibilityLabel="记一笔" onPress={openQuickAdd} style={styles.fabButton}>
        <Feather name="plus" size={24} color="#FFFFFF" />
      </Pressable>
    </View>
    <QuickAddSheet />
  </View>
);
```

- [ ] **Step 3: Replace all starter screen stubs with empty accounting route shells**

```tsx
export default function DetailsScreen() {
  return <AccountingScreen><Text>明细</Text></AccountingScreen>;
}
```

- [ ] **Step 4: Verify that the route graph is valid**

Run: `npm run typecheck`
Expected: Expo Router route names and component exports compile cleanly

Run: `npm run lint`
Expected: no unused imports from removed starter components remain

- [ ] **Step 5: Commit**

```bash
git add app/(tabs)/_layout.tsx app/(tabs)/index.tsx app/(tabs)/details.tsx app/(tabs)/statistics.tsx app/(tabs)/profile.tsx
git commit -m "feat: replace starter tabs with accounting shell"
```

## Task 4: Build The Reusable Accounting UI Component Set

**Files:**
- Create: `components/accounting/screen.tsx`
- Create: `components/accounting/app-header.tsx`
- Create: `components/accounting/month-switcher.tsx`
- Create: `components/accounting/summary-card.tsx`
- Create: `components/accounting/quick-action-grid.tsx`
- Create: `components/accounting/transaction-list-item.tsx`
- Create: `components/accounting/transaction-group-section.tsx`
- Create: `components/accounting/transaction-list-section.tsx`
- Create: `components/accounting/sync-badge.tsx`
- Create: `components/accounting/sync-status-card.tsx`
- Create: `components/accounting/segmented-control.tsx`
- Create: `components/accounting/amount-display-input.tsx`
- Create: `components/accounting/category-chip.tsx`
- Create: `components/accounting/form-row.tsx`
- Create: `components/accounting/bottom-sheet-scaffold.tsx`
- Create: `components/accounting/empty-state.tsx`
- Create: `components/accounting/section-card.tsx`

- [ ] **Step 1: Create a shared screen/container primitive**

```tsx
export function AccountingScreen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Implement the spec-driven summary, transaction, and sync components**

```tsx
export function SummaryCard({ monthLabel, balance, income, expense, syncLabel }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.month}>{monthLabel}</Text>
      <Text style={styles.balanceLabel}>本月结余</Text>
      <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
      <View style={styles.row}>
        <Metric label="收入" value={income} tone="income" />
        <Metric label="支出" value={expense} tone="expense" />
      </View>
      <SyncBadge status="synced" label={syncLabel} />
    </View>
  );
}
```

- [ ] **Step 3: Implement form-oriented components for Quick Add and management sheets**

```tsx
export function FormRow({ label, value, icon, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.left}>
        <Feather name={icon} size={18} color={theme.colors.textSecondary} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
    </Pressable>
  );
}
```

- [ ] **Step 4: Verify component set integrity before wiring screens**

Run: `npm run lint`
Expected: components compile without duplicate style keys or unused props

Run: `npm run typecheck`
Expected: shared components accept typed props and no implicit `any` remains

- [ ] **Step 5: Commit**

```bash
git add components/accounting
git commit -m "feat: add reusable accounting UI components"
```

## Task 5: Implement Home Screen And Quick Add Flow

**Files:**
- Create: `components/accounting/quick-add-sheet.tsx`
- Create: `utils/currency.ts`
- Create: `utils/date.ts`
- Create: `utils/transactions.ts`
- Modify: `app/(tabs)/index.tsx`
- Modify: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Add utility functions for formatting and transaction grouping**

```ts
export function formatCurrency(amountInCents: number) {
  return `¥${(amountInCents / 100).toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}
```

```ts
export function groupTransactionsByDay(records: TransactionRecord[]) {
  return records.reduce<Record<string, TransactionRecord[]>>((groups, record) => {
    const key = record.transactionAt.slice(0, 10);
    groups[key] = groups[key] ? [...groups[key], record] : [record];
    return groups;
  }, {});
}
```

- [ ] **Step 2: Implement `QuickAddSheet` with compact and expanded states**

```tsx
export function QuickAddSheet() {
  const { quickAddOpen, selectedEntryType, setSelectedEntryType, addTransaction } = useMockApp();
  const [expanded, setExpanded] = useState(false);
  const [amount, setAmount] = useState('0.00');

  return (
    <BottomSheetScaffold visible={quickAddOpen} onClose={closeQuickAdd}>
      <SegmentedControl
        value={selectedEntryType}
        options={[{ label: '支出', value: 'expense' }, { label: '收入', value: 'income' }]}
        onChange={setSelectedEntryType}
      />
      <AmountDisplayInput value={amount} onChange={setAmount} />
    </BottomSheetScaffold>
  );
}
```

- [ ] **Step 3: Implement the Home screen with summary, quick actions, recent records, and sync hint**

```tsx
export default function HomeScreen() {
  const router = useRouter();
  const { homeSummary, recentTransactions, pendingCount, openQuickAdd } = useMockApp();

  return (
    <AccountingScreen>
      <AppHeader title="五月账本" subtitle="今天也记清楚一点" />
      <SummaryCard {...homeSummary} />
      <QuickActionGrid
        onPressAccounts={() => router.push('/accounts')}
        onPressCategories={() => router.push('/categories')}
        onPressDetails={() => router.push('/details')}
        onPressStatistics={() => router.push('/statistics')}
      />
      <TransactionListSection
        records={recentTransactions}
        onPressItem={(record) => router.push(`/transaction/${record.id}`)}
      />
      <Pressable onPress={openQuickAdd}>
        <Text>记一笔</Text>
      </Pressable>
      {pendingCount > 0 ? <SyncBadge status="pending" label={`${pendingCount} 条记录待同步`} /> : null}
    </AccountingScreen>
  );
}
```

- [ ] **Step 4: Verify cross-screen mutation behavior at the shell level**

Run: `npm run typecheck`
Expected: Quick Add props, utility return types, and Home screen usage compile cleanly

Run: `npm run lint`
Expected: Home and Quick Add files pass lint after navigation hooks and local state are wired

- [ ] **Step 5: Commit**

```bash
git add app/(tabs)/index.tsx app/(tabs)/_layout.tsx components/accounting/quick-add-sheet.tsx utils
git commit -m "feat: add home screen and quick add flow"
```

## Task 6: Implement Details, Statistics, And Profile Screens

**Files:**
- Modify: `app/(tabs)/details.tsx`
- Modify: `app/(tabs)/statistics.tsx`
- Modify: `app/(tabs)/profile.tsx`

- [ ] **Step 1: Implement the Details screen with month switching and grouped transactions**

```tsx
export default function DetailsScreen() {
  const { currentMonth, setCurrentMonth, monthTransactions } = useMockApp();

  return (
    <AccountingScreen>
      <AppHeader title="明细" />
      <MonthSwitcher value={currentMonth} onChange={setCurrentMonth} />
      <TransactionListSection records={monthTransactions} onPressItem={openTransaction} />
    </AccountingScreen>
  );
}
```

- [ ] **Step 2: Implement the Statistics screen with monthly overview and breakdown sections**

```tsx
export default function StatisticsScreen() {
  const { currentMonth, setCurrentMonth, currentMonthStats } = useMockApp();

  return (
    <AccountingScreen>
      <AppHeader title="统计" />
      <MonthSwitcher value={currentMonthStats.month} onChange={setCurrentMonth} />
      <SummaryCard {...currentMonthStats.summaryCard} />
      <SectionCard title="支出分类">
        {currentMonthStats.expenseBreakdown.map((item) => (
          <FormRow
            key={item.categoryId}
            label={item.name}
            value={`${formatCurrency(item.amount)} · ${item.percent}%`}
            icon="pie-chart"
          />
        ))}
      </SectionCard>
      <SectionCard title="收入分类">
        {currentMonthStats.incomeBreakdown.map((item) => (
          <FormRow
            key={item.categoryId}
            label={item.name}
            value={`${formatCurrency(item.amount)} · ${item.percent}%`}
            icon="trending-up"
          />
        ))}
      </SectionCard>
    </AccountingScreen>
  );
}
```

- [ ] **Step 3: Implement the Profile screen with user card, sync card, and management list**

```tsx
export default function ProfileScreen() {
  const router = useRouter();
  const { user, syncSummary } = useMockApp();

  return (
    <AccountingScreen>
      <AppHeader title="我的" />
      <SectionCard title={user.email}>
        <Text>{user.ledgerName}</Text>
        <Text>{user.currency}</Text>
      </SectionCard>
      <SyncStatusCard {...syncSummary} />
      <FormRow label="账户管理" value="" icon="credit-card" onPress={() => router.push('/accounts')} />
      <FormRow label="分类管理" value="" icon="grid" onPress={() => router.push('/categories')} />
    </AccountingScreen>
  );
}
```

- [ ] **Step 4: Verify that all primary tabs compile and render through the shared data API**

Run: `npm run lint`
Expected: all tab screens pass lint without unused derived state

Run: `npm run typecheck`
Expected: route screen components and provider selectors compile without type mismatches

- [ ] **Step 5: Commit**

```bash
git add app/(tabs)/details.tsx app/(tabs)/statistics.tsx app/(tabs)/profile.tsx
git commit -m "feat: add details statistics and profile screens"
```

## Task 7: Implement Accounts, Categories, And Transaction Detail Screens

**Files:**
- Create: `app/accounts.tsx`
- Create: `app/categories.tsx`
- Create: `app/transaction/[id].tsx`
- Modify: `providers/mock-app-provider.tsx`

- [ ] **Step 1: Extend the mock provider with account/category edit helpers**

```ts
type MockAppActions = {
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
  setCurrentMonth: (month: string) => void;
  setSelectedEntryType: (type: EntryType) => void;
  addTransaction: (input: NewTransactionInput) => void;
  updateTransaction: (id: string, input: EditTransactionInput) => void;
  deleteTransaction: (id: string) => void;
  saveAccount: (input: LedgerAccount) => void;
  toggleAccountActive: (id: string) => void;
  saveCategory: (input: LedgerCategory) => void;
  toggleCategoryActive: (id: string) => void;
};
```

- [ ] **Step 2: Implement Accounts and Categories screens with add/edit sheet flows**

```tsx
export default function AccountsScreen() {
  const { accounts, saveAccount, toggleAccountActive } = useMockApp();
  const [editingAccount, setEditingAccount] = useState<LedgerAccount | null>(null);

  return (
    <AccountingScreen>
      <AppHeader
        title="账户管理"
        actionLabel="新增"
        onActionPress={() =>
          setEditingAccount({ id: '', name: '', type: 'cash', initialBalance: 0, isActive: true })
        }
      />
      {accounts.map((account) => (
        <FormRow
          key={account.id}
          label={account.name}
          value={`${account.type} · ${account.isActive ? '启用' : '停用'}`}
          icon="credit-card"
          onPress={() => setEditingAccount(account)}
        />
      ))}
    </AccountingScreen>
  );
}
```

```tsx
export default function CategoriesScreen() {
  const { categoriesByType } = useMockApp();
  const [entryType, setEntryType] = useState<EntryType>('expense');
  const [editingCategory, setEditingCategory] = useState<LedgerCategory | null>(null);

  return (
    <AccountingScreen>
      <AppHeader title="分类管理" />
      <SegmentedControl value={entryType} onChange={setEntryType} options={categoryTypeOptions} />
      {categoriesByType(entryType).map((category) => (
        <FormRow
          key={category.id}
          label={category.name}
          value={category.isActive ? '启用' : '停用'}
          icon="grid"
          onPress={() => setEditingCategory(category)}
        />
      ))}
    </AccountingScreen>
  );
}
```

- [ ] **Step 3: Implement transaction detail with mock edit/delete actions**

```tsx
export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTransactionById, deleteTransaction } = useMockApp();
  const record = getTransactionById(id);
  const [editing, setEditing] = useState(false);

  return (
    <AccountingScreen>
      <AppHeader title="交易详情" actionLabel="编辑" onActionPress={() => setEditing(true)} />
      <SectionCard title="金额">
        <Text>{formatCurrency(record.amount)}</Text>
        <Text>{record.note}</Text>
        <Text>{record.transactionAt}</Text>
      </SectionCard>
      <Pressable onPress={() => deleteTransaction(record.id)}>
        <Text>删除</Text>
      </Pressable>
    </AccountingScreen>
  );
}
```

- [ ] **Step 4: Verify secondary routes and mutation coverage**

Run: `npm run typecheck`
Expected: provider actions, route params, and edit-sheet state compile correctly

Run: `npm run lint`
Expected: account/category/detail screens pass lint and no stale starter imports remain

- [ ] **Step 5: Commit**

```bash
git add app/accounts.tsx app/categories.tsx app/transaction/[id].tsx providers/mock-app-provider.tsx
git commit -m "feat: add management and transaction detail screens"
```

## Task 8: Final UX Polish And Verification

**Files:**
- Modify: `app/_layout.tsx`
- Modify: `app/(tabs)/_layout.tsx`
- Modify: `app/(tabs)/index.tsx`
- Modify: `app/(tabs)/details.tsx`
- Modify: `app/(tabs)/statistics.tsx`
- Modify: `app/(tabs)/profile.tsx`
- Modify: `app/accounts.tsx`
- Modify: `app/categories.tsx`
- Modify: `app/transaction/[id].tsx`
- Modify: `components/accounting/app-header.tsx`
- Modify: `components/accounting/bottom-sheet-scaffold.tsx`
- Modify: `components/accounting/empty-state.tsx`
- Modify: `components/accounting/quick-action-grid.tsx`
- Modify: `components/accounting/quick-add-sheet.tsx`
- Modify: `components/accounting/screen.tsx`
- Modify: `components/accounting/section-card.tsx`
- Modify: `components/accounting/summary-card.tsx`
- Modify: `components/accounting/sync-badge.tsx`
- Modify: `components/accounting/sync-status-card.tsx`
- Modify: `components/accounting/transaction-list-section.tsx`

- [ ] **Step 1: Remove any leftover Expo starter visual language**

```tsx
<StatusBar style="dark" />
```

```ts
tabBarStyle: {
  height: 84,
  backgroundColor: '#FFFFFF',
  borderTopColor: '#E6EBE7',
}
```

- [ ] **Step 2: Add empty-state handling and sync-state coverage where the spec calls for it**

```tsx
{records.length === 0 ? (
  <EmptyState
    title="还没有记录"
    description="先记第一笔，账本就开始有意义了"
    actionLabel="记一笔"
    onActionPress={openQuickAdd}
  />
) : (
  <TransactionListSection records={records} onPressItem={openTransaction} />
)}
```

- [ ] **Step 3: Run required verification**

Run: `npm run lint`
Expected: PASS with no ESLint errors

Run: `npm run typecheck`
Expected: PASS with no TypeScript errors

Run: `npm run web`
Expected: app boots successfully and the accounting tab shell renders instead of the Expo starter pages

Manual verification checklist:

- open Home and confirm summary card, quick actions, recent transactions, and sync hint render
- open Quick Add, save a new expense, and confirm Home/Details/Statistics update in-session
- switch month on Details and Statistics and confirm labels/content change coherently
- open Profile, then navigate to Accounts and Categories
- open a transaction detail screen and confirm delete/edit mock actions behave correctly
- confirm empty states render when the relevant list is cleared in mock state

- [ ] **Step 4: Commit**

```bash
git add app components/accounting constants data/mock hooks providers types utils package.json
git commit -m "feat: deliver accounting mobile mock frontend"
```

## Self-Review Checklist

- Spec coverage:
  - Home, Details, Statistics, Profile: covered by Tasks 5 and 6
  - Quick Add compact/expanded: covered by Task 5
  - Accounts, Categories, Transaction Detail: covered by Task 7
  - Theme/system/UI consistency: covered by Tasks 1, 4, and 8
  - In-memory shared updates: covered by Tasks 2, 5, and 7
- Placeholder scan:
  - No `TBD` or `TODO` markers
  - All tasks list concrete files and commands
- Type consistency:
  - Shared domain names are introduced in Task 1 before provider/component use in later tasks
  - Screen actions depend on provider APIs introduced in Task 2 and expanded in Task 7

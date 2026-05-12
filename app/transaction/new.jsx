import React, { useMemo } from 'react';
import { Stack, useRouter } from 'expo-router';

import { AccountingScreen, TransactionForm } from '@/components/accounting';
import { accountingCategoryLabels, accountingCopy } from '@/constants/accounting-copy';
import { useMockApp } from '@/providers/mock-app-provider';

const DEFAULT_TIME_ZONE_OFFSET = '+08:00';

function buildCategoryOptions(categories) {
  return categories.map((category) => ({
    value: category.id,
    label: accountingCategoryLabels[category.id] ?? category.id,
    type: category.type,
    isActive: category.isActive,
  }));
}

function buildAccountOptions(accounts) {
  return accounts.map((account) => ({
    value: account.id,
    label: account.name,
    isActive: account.isActive,
  }));
}

export default function NewTransactionScreen() {
  const router = useRouter();
  const { actions, accounts, categories, selectedEntryType, user } = useMockApp();
  const categoryOptions = useMemo(() => buildCategoryOptions(categories), [categories]);
  const accountOptions = useMemo(() => buildAccountOptions(accounts), [accounts]);

  const handleSubmit = React.useCallback(
    (values) => {
      actions.addTransaction(values);
      router.back();
    },
    [actions, router]
  );

  return (
    <>
      <Stack.Screen options={{ title: accountingCopy.actions.addEntry }} />
      <AccountingScreen>
        <TransactionForm
          accountOptions={accountOptions}
          categoryOptions={categoryOptions}
          defaultAccountId={user.defaultAccountId}
          defaultSyncStatus="pending"
          defaultType={selectedEntryType}
          mode="create"
          submitLabel={accountingCopy.actions.addEntry}
          timeZoneOffset={DEFAULT_TIME_ZONE_OFFSET}
          onSubmit={handleSubmit}
        />
      </AccountingScreen>
    </>
  );
}

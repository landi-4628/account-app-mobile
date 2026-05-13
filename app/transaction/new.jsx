import React, { useMemo } from 'react';
import { Stack, useRouter } from 'expo-router';

import { AccountingScreen, TransactionForm } from '@/components/accounting';
import { accountingCopy } from '@/constants/accounting-copy';
import { resolveImplicitAccountId } from '@/lib/resolve-implicit-account-id.js';
import { useMockApp } from '@/providers/mock-app-provider';

const DEFAULT_TIME_ZONE_OFFSET = '+08:00';

function buildCategoryOptions(categories) {
  return categories.map((category) => ({
    value: category.id,
    label: category.name ?? category.id,
    type: category.type,
    isActive: category.isActive,
  }));
}

export default function NewTransactionScreen() {
  const router = useRouter();
  const { actions, categories, implicitLedgerAccountId, selectedEntryType, user } = useMockApp();
  const categoryOptions = useMemo(() => buildCategoryOptions(categories), [categories]);
  const implicitAccountId = useMemo(
    () => resolveImplicitAccountId(implicitLedgerAccountId, user.defaultAccountId),
    [implicitLedgerAccountId, user.defaultAccountId]
  );

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
          categoryOptions={categoryOptions}
          implicitAccountId={implicitAccountId}
          defaultSyncStatus="pending"
          defaultType={selectedEntryType}
          mode="create"
          onCreateCategory={actions.addCategory}
          submitLabel={accountingCopy.actions.addEntry}
          timeZoneOffset={DEFAULT_TIME_ZONE_OFFSET}
          onSubmit={handleSubmit}
        />
      </AccountingScreen>
    </>
  );
}

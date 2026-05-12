import React, { useMemo } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { AccountingScreen, EmptyState, TransactionForm } from '@/components/accounting';
import { accountingCopy } from '@/constants/accounting-copy';
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

function buildAccountOptions(accounts) {
  return accounts.map((account) => ({
    value: account.id,
    label: account.name,
    isActive: account.isActive,
  }));
}

export default function EditTransactionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { actions, accounts, categories, selectors } = useMockApp();
  const transactionId = Array.isArray(id) ? id[0] : id;
  const transaction = transactionId ? selectors.getTransactionById(transactionId) : null;
  const categoryOptions = useMemo(() => buildCategoryOptions(categories), [categories]);
  const accountOptions = useMemo(() => buildAccountOptions(accounts), [accounts]);

  const handleSubmit = React.useCallback(
    (values) => {
      if (!transactionId || !transaction) {
        return;
      }

      if (typeof actions.updateTransaction === 'function') {
        actions.updateTransaction(transactionId, values);
      } else {
        actions.deleteTransaction(transactionId);
        actions.addTransaction({
          ...values,
          id: transactionId,
          syncStatus: values.syncStatus ?? transaction.syncStatus,
        });
      }

      router.back();
    },
    [actions, router, transaction, transactionId]
  );

  const handleDelete = React.useCallback(() => {
    if (!transactionId) {
      return;
    }

    actions.deleteTransaction(transactionId);
    router.replace('/details');
  }, [actions, router, transactionId]);

  if (!transactionId || !transaction) {
    return (
      <>
        <Stack.Screen options={{ title: accountingCopy.actions.edit }} />
        <AccountingScreen>
          <EmptyState
            title={accountingCopy.form.notFoundTitle}
            description={accountingCopy.form.notFoundDescription}
            actionLabel={accountingCopy.actions.backToDetails}
            onActionPress={() => router.replace('/details')}
          />
        </AccountingScreen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: accountingCopy.actions.edit }} />
      <AccountingScreen>
        <TransactionForm
          accountOptions={accountOptions}
          categoryOptions={categoryOptions}
          defaultSyncStatus="pending"
          initialValues={transaction}
          mode="edit"
          onCreateAccount={actions.addAccount}
          onCreateCategory={actions.addCategory}
          submitLabel={accountingCopy.actions.save}
          timeZoneOffset={DEFAULT_TIME_ZONE_OFFSET}
          deleteLabel={accountingCopy.actions.delete}
          onDelete={handleDelete}
          onSubmit={handleSubmit}
        />
      </AccountingScreen>
    </>
  );
}

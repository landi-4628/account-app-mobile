import React, { useMemo } from 'react';
import { Stack, useRouter } from 'expo-router';

import { AccountingScreen, FeedbackDialog, TransactionForm } from '@/components/accounting';
import { buildAuthRequiredDialogState } from '@/components/accounting/auth-required-dialog-support';
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
  const [dialogState, setDialogState] = React.useState(null);
  const categoryOptions = useMemo(() => buildCategoryOptions(categories), [categories]);
  const implicitAccountId = useMemo(
    () => resolveImplicitAccountId(implicitLedgerAccountId, user.defaultAccountId),
    [implicitLedgerAccountId, user.defaultAccountId]
  );

  const handleSubmit = React.useCallback(
    (values) => {
      try {
        actions.addTransaction(values);
        router.back();
      } catch (error) {
        setDialogState(
          error instanceof Error && error.message === '请先登录'
            ? buildAuthRequiredDialogState(() => {
                router.replace('/auth/login');
              })
            : {
                title: error instanceof Error ? error.message : '保存失败',
                actions: [{ label: '知道了', tone: 'primary' }],
              }
        );
      }
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
        <FeedbackDialog
          visible={dialogState != null}
          title={dialogState?.title ?? ''}
          description={dialogState?.description}
          actions={dialogState?.actions}
          onClose={() => setDialogState(null)}
        />
      </AccountingScreen>
    </>
  );
}

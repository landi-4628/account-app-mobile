import React, { useMemo } from 'react';
import { Stack, useRouter } from 'expo-router';

import { AccountingScreen, FeedbackDialog, TransactionForm } from '@/components/accounting';
import { buildAuthRequiredDialogState } from '@/components/accounting/auth-required-dialog-support';
import { getAccountingScreenHeaderlessContentStyle } from '@/components/accounting/screen-support';
import { accountingCopy } from '@/constants/accounting-copy';
import { resolveImplicitAccountId } from '@/lib/resolve-implicit-account-id.js';
import { useMockApp } from '@/providers/mock-app-provider';

const DEFAULT_TIME_ZONE_OFFSET = '+08:00';
const transactionHeaderOptions = {
  title: accountingCopy.actions.addEntry,
  headerTitleAlign: 'left',
  headerTitleContainerStyle: {
    left: 44,
  },
};

function buildCategoryOptions(categories) {
  return categories.map((category) => ({
    value: category.id,
    label: category.name ?? category.id,
    type: category.type,
    isActive: category.isActive,
    color: category.color,
    iconName: category.iconName,
    isSystem: category.isSystem,
    sortOrder: category.sortOrder,
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
    async (values) => {
      try {
        await actions.addTransaction(values);
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
      <Stack.Screen options={transactionHeaderOptions} />
      <AccountingScreen
        contentContainerStyle={getAccountingScreenHeaderlessContentStyle({
          md: 16,
          xl: 24,
        })}
        scrollable={false}>
        <TransactionForm
          categoryOptions={categoryOptions}
          implicitAccountId={implicitAccountId}
          defaultSyncStatus="pending"
          defaultType={selectedEntryType}
          mode="create"
          onManageCategories={(entryType) => {
            router.push({
              pathname: '/categories',
              params: { entryType },
            });
          }}
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

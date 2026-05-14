import React, { useMemo } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { AccountingScreen, EmptyState, FeedbackDialog, TransactionForm } from '@/components/accounting';
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

export default function EditTransactionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { actions, categories, implicitLedgerAccountId, selectors, user } = useMockApp();
  const [dialogState, setDialogState] = React.useState(null);
  const transactionId = Array.isArray(id) ? id[0] : id;
  const transaction = transactionId ? selectors.getTransactionById(transactionId) : null;
  const categoryOptions = useMemo(() => buildCategoryOptions(categories), [categories]);
  const implicitAccountId = useMemo(
    () => resolveImplicitAccountId(implicitLedgerAccountId, user.defaultAccountId),
    [implicitLedgerAccountId, user.defaultAccountId]
  );

  const handleSubmit = React.useCallback(
    (values) => {
      if (!transactionId || !transaction) {
        return;
      }

      try {
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
    [actions, router, transaction, transactionId]
  );

  const handleDelete = React.useCallback(() => {
    if (!transactionId) {
      return;
    }

    try {
      actions.deleteTransaction(transactionId);
      router.replace('/details');
    } catch (error) {
      setDialogState(
        error instanceof Error && error.message === '请先登录'
          ? buildAuthRequiredDialogState(() => {
              router.replace('/auth/login');
            })
          : {
              title: error instanceof Error ? error.message : '删除失败',
              actions: [{ label: '知道了', tone: 'primary' }],
            }
      );
    }
  }, [actions, router, transactionId]);

  const handleCreateCategoryError = React.useCallback(
    (error) => {
      setDialogState(
        error instanceof Error && error.message === '请先登录'
          ? buildAuthRequiredDialogState(() => {
              router.replace('/auth/login');
            })
          : {
              title: error instanceof Error ? error.message : '新增分类失败',
              actions: [{ label: '知道了', tone: 'primary' }],
            }
      );
    },
    [router]
  );

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
          categoryOptions={categoryOptions}
          implicitAccountId={implicitAccountId}
          defaultSyncStatus="pending"
          initialValues={transaction}
          mode="edit"
          onCreateCategory={actions.addCategory}
          onCreateCategoryError={handleCreateCategoryError}
          submitLabel={accountingCopy.actions.save}
          timeZoneOffset={DEFAULT_TIME_ZONE_OFFSET}
          deleteLabel={accountingCopy.actions.delete}
          onDelete={handleDelete}
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

import React, { useMemo, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  AccountingScreen,
  EmptyState,
  FeedbackDialog,
  FormField,
  ManagementRow,
  SectionHeader,
  SurfaceCard,
} from '@/components/accounting';
import { buildAuthRequiredDialogState } from '@/components/accounting/auth-required-dialog-support';
import {
  buildCapabilityNotice,
  buildCategoryManagementViewModel,
  getActionAvailability,
} from '@/components/accounting/management-screen-support';
import { useAccountingTheme } from '@/components/accounting/use-accounting-theme';
import { useMockApp } from '@/providers/mock-app-provider';

const ENTRY_TYPES = ['expense', 'income'];
const copy = {
  title: '\u5206\u7c7b\u7ba1\u7406',
  subtitle: '\u65b0\u5efa\u5206\u7c7b\uff0c\u540e\u7eed\u518d\u63a5\u5165\u7f16\u8f91\u548c\u5f00\u5173\u80fd\u529b',
  createUnavailableTitle: '\u5f53\u524d provider \u6682\u4e0d\u652f\u6301\u65b0\u5efa\u5206\u7c7b',
  createUnavailableDescription: '\u8868\u5355\u4f1a\u7ee7\u7eed\u663e\u793a\uff0c\u4f46\u6dfb\u52a0\u64cd\u4f5c\u4f1a\u4fdd\u6301\u7981\u7528\uff0c\u76f4\u5230\u66b4\u9732 addCategory \u80fd\u529b\u3002',
  manageUnavailableTitle: '\u73b0\u6709\u5206\u7c7b\u6682\u65f6\u53ea\u8bfb',
  manageUnavailableDescription: '\u5f53\u524d\u6ca1\u6709 updateCategory\u3001saveCategory \u6216 toggleCategoryActive \u80fd\u529b\uff0c\u56e0\u6b64\u5217\u8868\u64cd\u4f5c\u4f1a\u4fdd\u6301\u7981\u7528\u3002',
  submitError: '\u6dfb\u52a0\u5206\u7c7b\u5931\u8d25',
  addButton: '\u6dfb\u52a0\u5206\u7c7b',
  newCategory: '\u65b0\u5efa\u5206\u7c7b',
  type: '\u7c7b\u578b',
  expense: '\u652f\u51fa',
  income: '\u6536\u5165',
  categoryName: '\u5206\u7c7b\u540d\u79f0',
  expensePlaceholder: '\u4ea4\u901a\u3001\u9910\u996e',
  incomePlaceholder: '\u5de5\u8d44\u3001\u5956\u91d1',
  expenseCategories: '\u652f\u51fa\u5206\u7c7b',
  incomeCategories: '\u6536\u5165\u5206\u7c7b',
  tapToDeactivate: '\u70b9\u51fb\u505c\u7528',
  tapToActivate: '\u70b9\u51fb\u542f\u7528',
  inactive: '\u5df2\u505c\u7528',
  editTitle: '\u7f16\u8f91\u5206\u7c7b',
  saveEdit: '\u4fdd\u5b58',
  cancelEdit: '\u53d6\u6d88',
  editHint: '\u957f\u6309\u81ea\u5efa\u5206\u7c7b\u53ef\u7f16\u8f91\u6216\u5220\u9664',
  deleteConfirmTitle: '\u786e\u8ba4\u5220\u9664',
  deleteConfirmBody: '\u5220\u9664\u540e\u4e0d\u53ef\u6062\u590d\u3002',
  deleteAction: '\u5220\u9664',
  cancelAction: '\u53d6\u6d88',
  editAction: '\u7f16\u8f91',
  acknowledge: '知道了',
};

function EntryTypePicker({ value, onChange, disabled }) {
  const theme = useAccountingTheme();
  const styles = createPickerStyles(theme);

  return (
    <View style={styles.wrap}>
      {ENTRY_TYPES.map((type) => (
        <Pressable
          key={type}
          accessibilityRole="button"
          disabled={disabled}
          onPress={() => onChange(type)}
          style={({ pressed }) => [
            styles.option,
            value === type ? styles.optionSelected : null,
            disabled ? styles.optionDisabled : null,
            pressed && !disabled ? styles.optionPressed : null,
          ]}>
          <Text style={value === type ? styles.optionLabelSelected : styles.optionLabel}>
            {type === 'expense' ? copy.expense : copy.income}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function createPickerStyles({ colors, spacing, radius, typography }) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    option: {
      flex: 1,
      minHeight: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: spacing.md,
    },
    optionSelected: {
      borderColor: colors.brand,
      backgroundColor: colors.brandSoft,
    },
    optionDisabled: {
      opacity: 0.5,
    },
    optionPressed: {
      opacity: 0.85,
    },
    optionLabel: {
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.text,
    },
    optionLabelSelected: {
      fontSize: typography.body,
      fontWeight: '700',
      color: colors.brandContrast,
    },
  });
}

function AddCategoryButton({ disabled, onPress }) {
  const theme = useAccountingTheme();
  const styles = createButtonStyles(theme);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled ? styles.buttonDisabled : null,
        pressed && !disabled ? styles.buttonPressed : null,
      ]}>
      <Text style={styles.label}>{copy.addButton}</Text>
    </Pressable>
  );
}

function createButtonStyles({ colors, spacing, radius, typography }) {
  return StyleSheet.create({
    button: {
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      backgroundColor: colors.brand,
      paddingHorizontal: spacing.md,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonPressed: {
      opacity: 0.85,
    },
    label: {
      fontSize: typography.body,
      fontWeight: '700',
      color: colors.textInverse,
    },
  });
}

export default function CategoriesScreen() {
  const router = useRouter();
  const { categories, actions, isAuthenticated } = useMockApp();
  const theme = useAccountingTheme();
  const styles = createStyles(theme);
  const availability = useMemo(() => getActionAvailability(actions), [actions]);
  const [entryType, setEntryType] = useState('expense');
  const [name, setName] = useState('');
  const [dialogState, setDialogState] = useState(null);
  const [editCategory, setEditCategory] = useState(
    /** @type {{ id: string, name: string, type: string } | null} */ (null)
  );
  const [editName, setEditName] = useState('');
  const [editEntryType, setEditEntryType] = useState('expense');
  const viewModel = useMemo(
    () => buildCategoryManagementViewModel(categories, entryType, actions),
    [actions, categories, entryType]
  );
  const createNotice = buildCapabilityNotice('categoriesCreate', availability);
  const manageNotice = buildCapabilityNotice('categoriesManage', availability);

  React.useEffect(() => {
    if (!createNotice && !manageNotice) {
      return;
    }

    setDialogState((current) => current ?? {
      title: createNotice ? copy.createUnavailableTitle : copy.manageUnavailableTitle,
      description: createNotice ? copy.createUnavailableDescription : copy.manageUnavailableDescription,
      actions: [{ label: copy.acknowledge, tone: 'primary' }],
    });
  }, [createNotice, manageNotice]);

  const openCategoryMenu = React.useCallback(
    (row) => {
      if (!row.item.isCustom) {
        return;
      }

      Alert.alert(row.item.name, undefined, [
        { text: copy.cancelAction, style: 'cancel' },
        {
          text: copy.editAction,
          onPress: () => {
            setEditName(row.item.name);
            setEditEntryType(row.item.type);
            setEditCategory({ id: row.id, name: row.item.name, type: row.item.type });
          },
        },
        {
          text: copy.deleteAction,
          style: 'destructive',
          onPress: () =>
            Alert.alert(copy.deleteConfirmTitle, copy.deleteConfirmBody, [
              { text: copy.cancelAction, style: 'cancel' },
              {
                text: copy.deleteAction,
                style: 'destructive',
                onPress: () =>
                  void actions.deleteCategory?.(row.id).catch((error) => {
                    setDialogState(
                      error instanceof Error && error.message === '请先登录'
                        ? buildAuthRequiredDialogState(() => {
                            router.push('/auth/login');
                          })
                        : {
                            title: error instanceof Error ? error.message : copy.submitError,
                            actions: [{ label: copy.acknowledge, tone: 'primary' }],
                          }
                    );
                  }),
              },
            ]),
        },
      ]);
    },
    [actions, router]
  );

  const handleSaveCategoryEdit = React.useCallback(() => {
    if (!editCategory || !editName.trim()) {
      return;
    }

    void actions.updateCategory?.(editCategory.id, {
      name: editName.trim(),
      type: /** @type {import('@/types/accounting').EntryType} */ (editEntryType),
    }).then(() => {
      setEditCategory(null);
    }).catch((error) => {
      setDialogState(
        error instanceof Error && error.message === '请先登录'
          ? buildAuthRequiredDialogState(() => {
              router.push('/auth/login');
            })
          : {
              title: error instanceof Error ? error.message : copy.submitError,
              actions: [{ label: copy.acknowledge, tone: 'primary' }],
            }
      );
    });
  }, [actions, editCategory, editEntryType, editName, router]);

  const handleCreate = React.useCallback(async () => {
    if (!name.trim() || !availability.canCreateCategories) {
      return;
    }

    try {
      await actions.addCategory?.({
        name: name.trim(),
        type: entryType,
      });
      setName('');
    } catch (error) {
      setDialogState(
        error instanceof Error && error.message === '请先登录'
          ? buildAuthRequiredDialogState(() => {
              router.push('/auth/login');
            })
          : {
              title: error instanceof Error ? error.message : copy.submitError,
              actions: [{ label: copy.acknowledge, tone: 'primary' }],
            }
      );
    }
  }, [actions, availability.canCreateCategories, entryType, name, router]);

  const handleToggleActive = React.useCallback(
    async (categoryId, isActive) => {
      if (!viewModel.canManageExisting) {
        return;
      }

      try {
        await actions.toggleCategoryActive?.(categoryId, !isActive);
      } catch (error) {
        setDialogState(
          error instanceof Error && error.message === '请先登录'
            ? buildAuthRequiredDialogState(() => {
                router.push('/auth/login');
              })
            : {
                title: error instanceof Error ? error.message : copy.submitError,
                actions: [{ label: copy.acknowledge, tone: 'primary' }],
              }
        );
      }
    },
    [actions, router, viewModel.canManageExisting]
  );

  return (
    <>
      <Stack.Screen options={{ title: copy.title }} />
      <AccountingScreen>
        <SectionHeader title={copy.title} subtitle={copy.subtitle} />
        {isAuthenticated ? (
          <>
            <Text style={styles.hint}>{copy.editHint}</Text>
            <SurfaceCard style={styles.card}>
              <Text style={styles.sectionTitle}>{copy.newCategory}</Text>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{copy.type}</Text>
                <EntryTypePicker
                  value={entryType}
                  onChange={setEntryType}
                  disabled={!availability.canCreateCategories}
                />
              </View>
              <FormField
                label={copy.categoryName}
                value={name}
                onChangeText={setName}
                placeholder={entryType === 'expense' ? copy.expensePlaceholder : copy.incomePlaceholder}
                autoCapitalize="words"
              />
              <AddCategoryButton
                disabled={!availability.canCreateCategories || !name.trim()}
                onPress={() => void handleCreate()}
              />
            </SurfaceCard>
            <View style={styles.listSection}>
              <Text style={styles.sectionTitle}>
                {entryType === 'expense' ? copy.expenseCategories : copy.incomeCategories}
              </Text>
              <View style={styles.list}>
                {viewModel.rows.map((row) => (
                  <ManagementRow
                    key={row.id}
                    title={row.item.name}
                    subtitle={row.item.type === 'expense' ? copy.expense : copy.income}
                    meta={row.isActive ? copy.tapToDeactivate : copy.tapToActivate}
                    badge={row.isActive ? null : { label: copy.inactive, tone: 'warning' }}
                    disabled={!viewModel.canManageExisting}
                    onPress={() => void handleToggleActive(row.id, row.isActive)}
                    onLongPress={() => openCategoryMenu(row)}
                  />
                ))}
              </View>
            </View>
          </>
        ) : (
          <EmptyState
            title="请先登录"
            description="登录后才能查看和管理分类。"
            actionLabel="去登录"
            onActionPress={() => router.push('/auth/login')}
          />
        )}
        <Modal
          visible={editCategory != null}
          transparent
          animationType="fade"
          onRequestClose={() => setEditCategory(null)}>
          <View style={styles.modalBackdrop}>
            <SurfaceCard style={styles.modalCard}>
              <Text style={styles.sectionTitle}>{copy.editTitle}</Text>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{copy.type}</Text>
                <EntryTypePicker value={editEntryType} onChange={setEditEntryType} disabled={false} />
              </View>
              <FormField label={copy.categoryName} value={editName} onChangeText={setEditName} />
              <View style={styles.modalActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setEditCategory(null)}
                  style={({ pressed }) => [styles.modalCancel, pressed ? styles.modalPressed : null]}>
                  <Text style={styles.modalCancelText}>{copy.cancelEdit}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={!editName.trim()}
                  onPress={() => void handleSaveCategoryEdit()}
                  style={({ pressed }) => [
                    styles.modalSave,
                    !editName.trim() ? styles.modalSaveDisabled : null,
                    pressed && editName.trim() ? styles.modalPressed : null,
                  ]}>
                  <Text style={styles.modalSaveText}>{copy.saveEdit}</Text>
                </Pressable>
              </View>
            </SurfaceCard>
          </View>
        </Modal>
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

function createStyles({ colors, spacing, typography }) {
  return StyleSheet.create({
    card: {
      gap: spacing.md,
    },
    sectionTitle: {
      fontSize: typography.bodyLarge,
      fontWeight: '700',
      color: colors.text,
    },
    fieldGroup: {
      gap: spacing.sm,
    },
    fieldLabel: {
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.text,
    },
    listSection: {
      gap: spacing.sm,
    },
    list: {
      gap: spacing.sm,
    },
    hint: {
      fontSize: typography.caption,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      padding: spacing.md,
    },
    modalCard: {
      gap: spacing.md,
    },
    modalActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    modalCancel: {
      flex: 1,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    modalCancelText: {
      fontSize: typography.body,
      fontWeight: '700',
      color: colors.text,
    },
    modalSave: {
      flex: 1,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      backgroundColor: colors.brand,
    },
    modalSaveDisabled: {
      opacity: 0.5,
    },
    modalSaveText: {
      fontSize: typography.body,
      fontWeight: '700',
      color: colors.textInverse,
    },
    modalPressed: {
      opacity: 0.85,
    },
  });
}

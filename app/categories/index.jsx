import React, { useMemo, useState } from 'react';
import { Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  AccountingScreen,
  FormField,
  InfoBanner,
  ManagementRow,
  SectionHeader,
  SurfaceCard,
} from '@/components/accounting';
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
  const { categories, actions } = useMockApp();
  const theme = useAccountingTheme();
  const styles = createStyles(theme);
  const availability = useMemo(() => getActionAvailability(actions), [actions]);
  const [entryType, setEntryType] = useState('expense');
  const [name, setName] = useState('');
  const [submitError, setSubmitError] = useState('');
  const viewModel = useMemo(
    () => buildCategoryManagementViewModel(categories, entryType, actions),
    [actions, categories, entryType]
  );
  const createNotice = buildCapabilityNotice('categoriesCreate', availability);
  const manageNotice = buildCapabilityNotice('categoriesManage', availability);

  const handleCreate = React.useCallback(() => {
    if (!name.trim() || !availability.canCreateCategories) {
      return;
    }

    try {
      actions.addCategory?.({
        name: name.trim(),
        type: entryType,
      });
      setName('');
      setSubmitError('');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : copy.submitError);
    }
  }, [actions, availability.canCreateCategories, entryType, name]);

  const handleToggleActive = React.useCallback(
    (categoryId, isActive) => {
      if (!viewModel.canManageExisting) {
        return;
      }

      actions.toggleCategoryActive?.(categoryId, !isActive);
    },
    [actions, viewModel.canManageExisting]
  );

  return (
    <>
      <Stack.Screen options={{ title: copy.title }} />
      <AccountingScreen>
        <SectionHeader title={copy.title} subtitle={copy.subtitle} />
        {createNotice ? (
          <InfoBanner
            tone="warning"
            title={copy.createUnavailableTitle}
            description={copy.createUnavailableDescription}
          />
        ) : null}
        {manageNotice ? (
          <InfoBanner
            tone="warning"
            title={copy.manageUnavailableTitle}
            description={copy.manageUnavailableDescription}
          />
        ) : null}
        {submitError ? <InfoBanner tone="warning" title={submitError} /> : null}
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
            onPress={handleCreate}
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
                onPress={() => handleToggleActive(row.id, row.isActive)}
              />
            ))}
          </View>
        </View>
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
  });
}

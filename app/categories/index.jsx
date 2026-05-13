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
            {type === 'expense' ? 'Expense' : 'Income'}
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
      <Text style={styles.label}>Add category</Text>
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
      setSubmitError(error instanceof Error ? error.message : 'Unable to add category');
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
      <Stack.Screen options={{ title: 'Categories' }} />
      <AccountingScreen>
        <SectionHeader
          title="Categories"
          subtitle="Create categories now and leave edit/toggle behavior disabled until the provider supports it"
        />
        {createNotice ? (
          <InfoBanner
            tone="warning"
            title="Category creation is not available in the current provider"
            description="The form stays visible, but the add action remains disabled until addCategory is exposed."
          />
        ) : null}
        {manageNotice ? (
          <InfoBanner
            tone="warning"
            title="Existing categories are read-only for now"
            description="No updateCategory/saveCategory or toggleCategoryActive action is available, so row actions stay disabled."
          />
        ) : null}
        {submitError ? <InfoBanner tone="warning" title={submitError} /> : null}
        <SurfaceCard style={styles.card}>
          <Text style={styles.sectionTitle}>New category</Text>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Type</Text>
            <EntryTypePicker
              value={entryType}
              onChange={setEntryType}
              disabled={!availability.canCreateCategories}
            />
          </View>
          <FormField
            label="Category name"
            value={name}
            onChangeText={setName}
            placeholder={entryType === 'expense' ? 'Transport, Dining' : 'Salary, Bonus'}
            autoCapitalize="words"
          />
          <AddCategoryButton
            disabled={!availability.canCreateCategories || !name.trim()}
            onPress={handleCreate}
          />
        </SurfaceCard>
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>
            {entryType === 'expense' ? 'Expense categories' : 'Income categories'}
          </Text>
          <View style={styles.list}>
            {viewModel.rows.map((row) => (
              <ManagementRow
                key={row.id}
                title={row.item.name}
                subtitle={row.item.type === 'expense' ? 'Expense' : 'Income'}
                meta={row.isActive ? 'Tap to deactivate' : 'Tap to activate'}
                badge={row.isActive ? null : { label: 'Inactive', tone: 'warning' }}
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

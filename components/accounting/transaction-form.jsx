import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { SyncBadge } from './sync-badge.js';
import {
  buildTransactionFormSubmitPayload,
  createTransactionFormDraft,
  getTransactionFormAccountOptions,
  getTransactionFormCategoryOptions,
} from './transaction-form-support.js';
import { useAccountingTheme } from './use-accounting-theme.js';

/** @typedef {import('./transaction-form-support.js').TransactionFormDraft} TransactionFormDraft */
/** @typedef {import('./transaction-form-support.js').TransactionFormErrors} TransactionFormErrors */
/** @typedef {import('./transaction-form-support.js').TransactionFormInitialValues} TransactionFormInitialValues */
/** @typedef {import('./transaction-form-support.js').TransactionFormOption} TransactionFormOption */
/** @typedef {import('@/types/accounting').EntryType} EntryType */
/** @typedef {import('@/types/accounting').SyncStatus} SyncStatus */
/** @typedef {import('./use-accounting-theme.js').AccountingThemeColors} AccountingThemeColors */
/** @typedef {import('./use-accounting-theme.js').AccountingThemeSpacing} AccountingThemeSpacing */
/** @typedef {import('./use-accounting-theme.js').AccountingThemeRadius} AccountingThemeRadius */
/** @typedef {import('./use-accounting-theme.js').AccountingThemeTypography} AccountingThemeTypography */
/** @typedef {ReturnType<typeof createStyles>} TransactionFormStyles */

/** @type {Array<{ value: EntryType, label: string }>} */
const entryTypeOptions = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
];

/** @type {Array<{ value: SyncStatus, label: string }>} */
const defaultSyncStatusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'synced', label: 'Synced' },
  { value: 'failed', label: 'Failed' },
];

/**
 * @param {{
 *   mode?: 'create' | 'edit' | undefined,
 *   initialValues?: TransactionFormInitialValues | undefined,
 *   categoryOptions: TransactionFormOption[],
 *   accountOptions: TransactionFormOption[],
 *   syncStatusOptions?: Array<{ value: SyncStatus, label: string }> | undefined,
 *   defaultType?: EntryType | undefined,
 *   defaultAccountId?: string | undefined,
 *   defaultSyncStatus?: SyncStatus | undefined,
 *   timeZoneOffset?: string | undefined,
 *   submitLabel?: string | undefined,
 *   deleteLabel?: string | undefined,
 *   disabled?: boolean | undefined,
 *   busy?: boolean | undefined,
 *   onSubmit: (values: {
 *     type: EntryType,
 *     amount: number,
 *     categoryId: string,
 *     accountId: string,
 *     transactionAt: string,
 *     note: string,
 *     syncStatus: SyncStatus,
 *   }) => void,
 *   onDelete?: (() => void) | undefined,
 * }} props
 */
export function TransactionForm({
  mode = 'create',
  initialValues,
  categoryOptions,
  accountOptions,
  syncStatusOptions = defaultSyncStatusOptions,
  defaultType = 'expense',
  defaultAccountId,
  defaultSyncStatus = 'pending',
  timeZoneOffset = '+00:00',
  submitLabel,
  deleteLabel = 'Delete',
  disabled = false,
  busy = false,
  onSubmit,
  onDelete,
}) {
  const { colors, spacing, radius, typography, shadow } = useAccountingTheme();
  const styles = useMemo(
    () => createStyles(colors, spacing, radius, typography, shadow.card),
    [colors, spacing, radius, typography, shadow]
  );
  const filteredAccounts = useMemo(
    () => getTransactionFormAccountOptions(accountOptions),
    [accountOptions]
  );
  const [draft, setDraft] = useState(() =>
    createTransactionFormDraft({
      mode,
      initialValues,
      categoryOptions,
      accountOptions,
      defaultType,
      defaultAccountId,
      defaultSyncStatus,
      timeZoneOffset,
    })
  );
  const [errors, setErrors] = useState(/** @type {TransactionFormErrors} */ ({}));
  const visibleCategories = useMemo(
    () => getTransactionFormCategoryOptions(categoryOptions, draft.type),
    [categoryOptions, draft.type]
  );

  useEffect(() => {
    setDraft(
      createTransactionFormDraft({
        mode,
        initialValues,
        categoryOptions,
        accountOptions,
        defaultType,
        defaultAccountId,
        defaultSyncStatus,
        timeZoneOffset,
      })
    );
    setErrors(/** @type {TransactionFormErrors} */ ({}));
  }, [
    accountOptions,
    categoryOptions,
    defaultAccountId,
    defaultSyncStatus,
    defaultType,
    initialValues,
    mode,
    timeZoneOffset,
  ]);

  useEffect(() => {
    if (!visibleCategories.some((option) => option.value === draft.categoryId)) {
      setDraft((currentDraft) => ({
        ...currentDraft,
        categoryId: visibleCategories[0]?.value ?? '',
      }));
    }
  }, [draft.categoryId, visibleCategories]);

  const submitButtonLabel = submitLabel ?? (mode === 'edit' ? 'Save changes' : 'Create transaction');
  const disableActions = disabled || busy;

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Type</Text>
        <View style={styles.segmentedRow}>
          {entryTypeOptions.map((option) => (
            <OptionChip
              key={option.value}
              active={draft.type === option.value}
              disabled={disableActions}
              label={option.label}
              onPress={() =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  type: /** @type {EntryType} */ (option.value),
                }))
              }
              styles={styles}
            />
          ))}
        </View>
      </View>

      <FieldBlock label="Amount" error={errors.amountInput} styles={styles}>
        <TextInput
          editable={!disableActions}
          keyboardType="decimal-pad"
          onChangeText={(amountInput) => setDraft((currentDraft) => ({ ...currentDraft, amountInput }))}
          placeholder="0.00"
          placeholderTextColor={colors.textMuted}
          style={styles.textInput}
          value={draft.amountInput}
        />
      </FieldBlock>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Category</Text>
        <View style={styles.optionGrid}>
          {visibleCategories.map((option) => (
            <OptionChip
              key={option.value}
              active={draft.categoryId === option.value}
              disabled={disableActions}
              label={option.label}
              onPress={() =>
                setDraft((currentDraft) => ({ ...currentDraft, categoryId: option.value }))
              }
              styles={styles}
            />
          ))}
        </View>
        {errors.categoryId ? <Text style={styles.errorText}>{errors.categoryId}</Text> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.optionGrid}>
          {filteredAccounts.map((option) => (
            <OptionChip
              key={option.value}
              active={draft.accountId === option.value}
              disabled={disableActions}
              label={option.label}
              onPress={() =>
                setDraft((currentDraft) => ({ ...currentDraft, accountId: option.value }))
              }
              styles={styles}
            />
          ))}
        </View>
        {errors.accountId ? <Text style={styles.errorText}>{errors.accountId}</Text> : null}
      </View>

      <FieldBlock label="Date and time" error={errors.dateTimeInput} styles={styles}>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          editable={!disableActions}
          onChangeText={(dateTimeInput) => setDraft((currentDraft) => ({ ...currentDraft, dateTimeInput }))}
          placeholder="YYYY-MM-DDTHH:mm"
          placeholderTextColor={colors.textMuted}
          style={styles.textInput}
          value={draft.dateTimeInput}
        />
      </FieldBlock>

      <FieldBlock label="Note" styles={styles}>
        <TextInput
          editable={!disableActions}
          multiline
          onChangeText={(note) => setDraft((currentDraft) => ({ ...currentDraft, note }))}
          placeholder="Add context"
          placeholderTextColor={colors.textMuted}
          style={[styles.textInput, styles.noteInput]}
          textAlignVertical="top"
          value={draft.note}
        />
      </FieldBlock>

      <View style={styles.section}>
        <View style={styles.syncHeader}>
          <Text style={styles.sectionLabel}>Sync status</Text>
          <SyncBadge status={draft.syncStatus} label={syncStatusOptions.find((option) => option.value === draft.syncStatus)?.label} />
        </View>
        <View style={styles.optionGrid}>
          {syncStatusOptions.map((option) => (
            <OptionChip
              key={option.value}
              active={draft.syncStatus === option.value}
              disabled={disableActions}
              label={option.label}
              onPress={() =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  syncStatus: option.value,
                }))
              }
              styles={styles}
            />
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          disabled={disableActions}
          onPress={() => {
            const result = buildTransactionFormSubmitPayload(draft, { timeZoneOffset });
            setErrors(result.errors);

            if (result.values) {
              onSubmit(result.values);
            }
          }}
          style={({ pressed }) => [
            styles.primaryButton,
            disableActions && styles.buttonDisabled,
            pressed && !disableActions ? styles.primaryButtonPressed : null,
          ]}>
          <Text style={styles.primaryButtonLabel}>{busy ? 'Saving...' : submitButtonLabel}</Text>
        </Pressable>

        {mode === 'edit' && onDelete ? (
          <Pressable
            accessibilityRole="button"
            disabled={disableActions}
            onPress={onDelete}
            style={({ pressed }) => [
              styles.secondaryButton,
              disableActions && styles.buttonDisabled,
              pressed && !disableActions ? styles.secondaryButtonPressed : null,
            ]}>
            <Text style={styles.secondaryButtonLabel}>{deleteLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/**
 * @param {{
 *   label: string,
 *   error?: string | undefined,
 *   styles: TransactionFormStyles,
 *   children: import('react').ReactNode,
 * }} props
 */
function FieldBlock({ label, error, styles, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

/**
 * @param {{
 *   active: boolean,
 *   disabled: boolean,
 *   label: string,
 *   onPress: () => void,
 *   styles: TransactionFormStyles,
 * }} props
 */
function OptionChip({ active, disabled, label, onPress, styles }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionChip,
        active ? styles.optionChipActive : null,
        disabled ? styles.buttonDisabled : null,
        pressed && !disabled ? styles.optionChipPressed : null,
      ]}>
      <Text style={[styles.optionChipLabel, active ? styles.optionChipLabelActive : null]}>{label}</Text>
    </Pressable>
  );
}

/**
 * @param {AccountingThemeColors} colors
 * @param {AccountingThemeSpacing} spacing
 * @param {AccountingThemeRadius} radius
 * @param {AccountingThemeTypography} typography
 * @param {object} cardShadow
 */
function createStyles(colors, spacing, radius, typography, cardShadow) {
  return StyleSheet.create({
    container: {
      gap: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      ...cardShadow,
    },
    section: {
      gap: spacing.sm,
    },
    sectionLabel: {
      fontSize: typography.caption,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
    },
    segmentedRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    optionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    optionChip: {
      minWidth: 96,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionChipActive: {
      borderColor: colors.brand,
      backgroundColor: colors.brandSoft,
    },
    optionChipPressed: {
      opacity: 0.85,
    },
    optionChipLabel: {
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.text,
    },
    optionChipLabelActive: {
      color: colors.brandContrast,
    },
    textInput: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: typography.bodyLarge,
      color: colors.text,
    },
    noteInput: {
      minHeight: 104,
    },
    syncHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    errorText: {
      fontSize: typography.caption,
      color: colors.danger,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    primaryButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      backgroundColor: colors.brand,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    primaryButtonPressed: {
      opacity: 0.9,
    },
    primaryButtonLabel: {
      fontSize: typography.bodyLarge,
      fontWeight: '700',
      color: colors.textInverse,
    },
    secondaryButton: {
      minWidth: 104,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    secondaryButtonPressed: {
      opacity: 0.8,
    },
    secondaryButtonLabel: {
      fontSize: typography.body,
      fontWeight: '700',
      color: colors.danger,
    },
    buttonDisabled: {
      opacity: 0.55,
    },
  });
}

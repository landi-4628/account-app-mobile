import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { accountingCopy } from '../../constants/accounting-copy.js';
import { formatAccountingMonth } from './helpers.js';
import {
  addMonthsToDateInput,
  buildCalendarWeeks,
  formatDatePickerLabel,
} from './date-picker-support.js';
import {
  buildTransactionFormSubmitPayload,
  createTransactionFormDraft,
  getTransactionFormCategoryOptions,
} from './transaction-form-support.js';
import { getTransactionFormContainerStyle } from './transaction-form-layout-support.js';
import { useAccountingTheme } from './use-accounting-theme.js';

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
  { value: 'expense', label: accountingCopy.entryType.expense },
  { value: 'income', label: accountingCopy.entryType.income },
];

const inlineCopy = {
  addCategory: '\u65b0\u589e\u5206\u7c7b',
  cancel: '\u53d6\u6d88',
  categoryName: '\u5206\u7c7b\u540d\u79f0',
  categoryPlaceholder: '\u8f93\u5165\u5206\u7c7b\u540d\u79f0',
  duplicateCategory: '\u5df2\u5b58\u5728\u540c\u540d\u5206\u7c7b',
  requiredName: '\u8bf7\u8f93\u5165\u540d\u79f0',
  chooseDate: '\u9009\u62e9\u65e5\u671f',
  calendarConfirm: '\u786e\u5b9a',
  calendarWeekdays: ['\u65e5', '\u4e00', '\u4e8c', '\u4e09', '\u56db', '\u4e94', '\u516d'],
};

/**
 * @param {{
 *   mode?: 'create' | 'edit' | undefined,
 *   initialValues?: TransactionFormInitialValues | undefined,
 *   categoryOptions: TransactionFormOption[],
 *   implicitAccountId: string,
 *   defaultType?: EntryType | undefined,
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
 *   onCreateCategory?: ((input: { name: string, type: EntryType }) => ({ id: string } | Promise<{ id: string } | null | undefined> | null | undefined)) | undefined,
 *   onCreateCategoryError?: ((error: unknown) => void) | undefined,
 *   onDelete?: (() => void) | undefined,
 * }} props
 */
export function TransactionForm({
  mode = 'create',
  initialValues,
  categoryOptions,
  implicitAccountId,
  defaultType = 'expense',
  defaultSyncStatus = 'pending',
  timeZoneOffset = '+00:00',
  submitLabel,
  deleteLabel = accountingCopy.actions.delete,
  disabled = false,
  busy = false,
  onSubmit,
  onCreateCategory,
  onCreateCategoryError,
  onDelete,
}) {
  const { colors, spacing, radius, typography, shadow } = useAccountingTheme();
  const styles = useMemo(
    () => createStyles(colors, spacing, radius, typography, shadow.card),
    [colors, spacing, radius, typography, shadow]
  );
  const latestCategoryOptionsRef = React.useRef(categoryOptions);
  const [draft, setDraft] = useState(() =>
    createTransactionFormDraft({
      mode,
      initialValues,
      categoryOptions,
      implicitAccountId,
      defaultType,
      defaultSyncStatus,
      timeZoneOffset,
    })
  );
  const [errors, setErrors] = useState(/** @type {TransactionFormErrors} */ ({}));
  const [categoryComposerOpen, setCategoryComposerOpen] = useState(false);
  const [categoryNameInput, setCategoryNameInput] = useState('');
  const [categoryCreateError, setCategoryCreateError] = useState('');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(draft.dateInput.slice(0, 7));
  const visibleCategories = useMemo(
    () => getTransactionFormCategoryOptions(categoryOptions, draft.type),
    [categoryOptions, draft.type]
  );
  const calendarWeeks = useMemo(() => buildCalendarWeeks(visibleMonth), [visibleMonth]);

  useEffect(() => {
    latestCategoryOptionsRef.current = categoryOptions;
  }, [categoryOptions]);

  useEffect(() => {
    const latestCategoryOptions = latestCategoryOptionsRef.current;

    const nextDraft = createTransactionFormDraft({
      mode,
      initialValues,
      categoryOptions: latestCategoryOptions,
      implicitAccountId,
      defaultType,
      defaultSyncStatus,
      timeZoneOffset,
    });

    setDraft(nextDraft);
    setVisibleMonth(nextDraft.dateInput.slice(0, 7));
    setErrors(/** @type {TransactionFormErrors} */ ({}));
    setCategoryComposerOpen(false);
    setCategoryNameInput('');
    setCategoryCreateError('');
    setDatePickerOpen(false);
  }, [
    defaultSyncStatus,
    defaultType,
    implicitAccountId,
    initialValues,
    mode,
    timeZoneOffset,
  ]);

  useEffect(() => {
    if (mode !== 'create' || !implicitAccountId) {
      return;
    }

    setDraft((current) =>
      current.accountId === implicitAccountId ? current : { ...current, accountId: implicitAccountId }
    );
  }, [implicitAccountId, mode]);

  useEffect(() => {
    if (!visibleCategories.some((option) => option.value === draft.categoryId)) {
      setDraft((currentDraft) => ({
        ...currentDraft,
        categoryId: visibleCategories[0]?.value ?? '',
      }));
    }
  }, [draft.categoryId, visibleCategories]);

  const submitButtonLabel =
    submitLabel ?? (mode === 'edit' ? accountingCopy.actions.save : accountingCopy.actions.create);
  const disableActions = disabled || busy;
  const categoryNameSet = useMemo(
    () => new Set(visibleCategories.map((option) => option.label.trim().toLocaleLowerCase())),
    [visibleCategories]
  );

  const saveNewCategory = React.useCallback(async () => {
    const normalizedName = categoryNameInput.trim();

    if (!normalizedName) {
      setCategoryCreateError(inlineCopy.requiredName);
      return;
    }

    if (categoryNameSet.has(normalizedName.toLocaleLowerCase())) {
      setCategoryCreateError(inlineCopy.duplicateCategory);
      return;
    }

    try {
      const created = await Promise.resolve(
        onCreateCategory?.({ name: normalizedName, type: draft.type })
      );

      if (!created?.id) {
        return;
      }

      setDraft((currentDraft) => ({
        ...currentDraft,
        categoryId: created.id,
      }));
      setCategoryComposerOpen(false);
      setCategoryNameInput('');
      setCategoryCreateError('');
    } catch (error) {
      onCreateCategoryError?.(error);
    }
  }, [categoryNameInput, categoryNameSet, draft.type, onCreateCategory, onCreateCategoryError]);

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{accountingCopy.form.type}</Text>
        <View style={styles.segmentedRow}>
          {entryTypeOptions.map((option) => (
            <View key={option.value} style={styles.segmentedItem}>
              <OptionChip
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
            </View>
          ))}
        </View>
      </View>

      <FieldBlock label={accountingCopy.form.amount} error={errors.amountInput} styles={styles}>
        <TextInput
          editable={!disableActions}
          keyboardType="decimal-pad"
          onChangeText={(amountInput) => setDraft((currentDraft) => ({ ...currentDraft, amountInput }))}
          placeholder={accountingCopy.form.amountPlaceholder}
          placeholderTextColor={colors.textMuted}
          style={styles.textInput}
          value={draft.amountInput}
        />
      </FieldBlock>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{accountingCopy.form.category}</Text>
        <View style={styles.optionGrid}>
          {visibleCategories.map((option) => (
            <View key={option.value} style={styles.optionGridItem}>
              <OptionChip
                active={draft.categoryId === option.value}
                disabled={disableActions}
                label={option.label}
                onPress={() =>
                  setDraft((currentDraft) => ({ ...currentDraft, categoryId: option.value }))
                }
                styles={styles}
              />
            </View>
          ))}
          <View style={styles.optionGridItem}>
            <ActionChip
              disabled={disableActions}
              label={inlineCopy.addCategory}
              onPress={() => {
                setCategoryComposerOpen((current) => !current);
                setCategoryCreateError('');
              }}
              styles={styles}
            />
          </View>
        </View>
        {errors.categoryId ? <Text style={styles.errorText}>{errors.categoryId}</Text> : null}
        {categoryComposerOpen ? (
          <View style={styles.inlineComposer}>
            <FieldBlock label={inlineCopy.categoryName} error={categoryCreateError} styles={styles}>
              <TextInput
                editable={!disableActions}
                onChangeText={(value) => {
                  setCategoryNameInput(value);
                  if (categoryCreateError) {
                    setCategoryCreateError('');
                  }
                }}
                placeholder={inlineCopy.categoryPlaceholder}
                placeholderTextColor={colors.textMuted}
                style={styles.textInput}
                value={categoryNameInput}
              />
            </FieldBlock>
            <View style={styles.inlineActions}>
              <Pressable
                accessibilityRole="button"
                disabled={disableActions}
                onPress={() => {
                  void saveNewCategory();
                }}
                style={({ pressed }) => [
                  styles.inlinePrimaryButton,
                  disableActions && styles.buttonDisabled,
                  pressed && !disableActions ? styles.primaryButtonPressed : null,
                ]}>
                <Text style={styles.primaryButtonLabel}>{inlineCopy.addCategory}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={disableActions}
                onPress={() => {
                  setCategoryComposerOpen(false);
                  setCategoryNameInput('');
                  setCategoryCreateError('');
                }}
                style={({ pressed }) => [
                  styles.inlineSecondaryButton,
                  disableActions && styles.buttonDisabled,
                  pressed && !disableActions ? styles.secondaryButtonPressed : null,
                ]}>
                <Text style={styles.secondaryButtonLabel}>{inlineCopy.cancel}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>

      <FieldBlock label={accountingCopy.form.dateTime} error={errors.dateInput} styles={styles}>
        <Pressable
          accessibilityRole="button"
          disabled={disableActions}
          onPress={() => {
            setVisibleMonth(draft.dateInput.slice(0, 7));
            setDatePickerOpen(true);
          }}
          style={({ pressed }) => [
            styles.dateField,
            disableActions && styles.buttonDisabled,
            pressed && !disableActions ? styles.optionChipPressed : null,
          ]}>
          <Text style={styles.dateFieldValue}>{formatDatePickerLabel(draft.dateInput)}</Text>
          <Text style={styles.dateFieldAction}>{inlineCopy.chooseDate}</Text>
        </Pressable>
      </FieldBlock>

      <FieldBlock label={accountingCopy.form.note} styles={styles}>
        <TextInput
          editable={!disableActions}
          multiline
          onChangeText={(note) => setDraft((currentDraft) => ({ ...currentDraft, note }))}
          placeholder={accountingCopy.form.notePlaceholder}
          placeholderTextColor={colors.textMuted}
          style={[styles.textInput, styles.noteInput]}
          textAlignVertical="top"
          value={draft.note}
        />
      </FieldBlock>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          disabled={disableActions}
          onPress={() => {
            const result = buildTransactionFormSubmitPayload(draft, {
              timeZoneOffset,
              defaultSyncStatus,
            });
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
          <Text style={styles.primaryButtonLabel}>
            {busy ? accountingCopy.form.saving : submitButtonLabel}
          </Text>
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

      <DatePickerModal
        disableActions={disableActions}
        draftDateInput={draft.dateInput}
        onCancel={() => setDatePickerOpen(false)}
        onChangeMonth={(monthDelta) => setVisibleMonth((current) => addMonthsToDateInput(`${current}-01`, monthDelta).slice(0, 7))}
        onSelect={(dateInput) => {
          setDraft((currentDraft) => ({ ...currentDraft, dateInput }));
          setDatePickerOpen(false);
        }}
        open={datePickerOpen}
        styles={styles}
        visibleMonth={visibleMonth}
        weeks={calendarWeeks}
      />
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
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[styles.optionChipLabel, active ? styles.optionChipLabelActive : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * @param {{
 *   disabled: boolean,
 *   label: string,
 *   onPress: () => void,
 *   styles: TransactionFormStyles,
 * }} props
 */
function ActionChip({ disabled, label, onPress, styles }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionChip,
        disabled ? styles.buttonDisabled : null,
        pressed && !disabled ? styles.optionChipPressed : null,
      ]}>
      <Text numberOfLines={1} ellipsizeMode="tail" style={styles.actionChipLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * @param {{
 *   open: boolean,
 *   visibleMonth: string,
 *   draftDateInput: string,
 *   weeks: Array<Array<{ key: string, dayNumber: number, value: string, inCurrentMonth: boolean }>>,
 *   disableActions: boolean,
 *   onCancel: () => void,
 *   onChangeMonth: (monthDelta: number) => void,
 *   onSelect: (dateInput: string) => void,
 *   styles: TransactionFormStyles,
 * }} props
 */
function DatePickerModal({
  open,
  visibleMonth,
  draftDateInput,
  weeks,
  disableActions,
  onCancel,
  onChangeMonth,
  onSelect,
  styles,
}) {
  return (
    <Modal animationType="fade" transparent visible={open} onRequestClose={onCancel}>
      <Pressable style={styles.modalBackdrop} onPress={onCancel}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <View style={styles.calendarHeader}>
            <Pressable accessibilityRole="button" disabled={disableActions} onPress={() => onChangeMonth(-1)} style={styles.calendarNavButton}>
              <Text style={styles.calendarNavLabel}>{'<'}</Text>
            </Pressable>
            <Text style={styles.calendarTitle}>{formatAccountingMonth(visibleMonth)}</Text>
            <Pressable accessibilityRole="button" disabled={disableActions} onPress={() => onChangeMonth(1)} style={styles.calendarNavButton}>
              <Text style={styles.calendarNavLabel}>{'>'}</Text>
            </Pressable>
          </View>

          <View style={styles.calendarWeekdays}>
            {inlineCopy.calendarWeekdays.map((weekday) => (
              <Text key={weekday} style={styles.calendarWeekdayLabel}>
                {weekday}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {weeks.flat().map((day) => {
              const active = day.value === draftDateInput;

              return (
                <Pressable
                  key={day.key}
                  accessibilityRole="button"
                  onPress={() => onSelect(day.value)}
                  style={({ pressed }) => [
                    styles.calendarDay,
                    day.inCurrentMonth ? null : styles.calendarDayMuted,
                    active ? styles.calendarDayActive : null,
                    pressed ? styles.optionChipPressed : null,
                  ]}>
                  <Text
                    style={[
                      styles.calendarDayLabel,
                      day.inCurrentMonth ? null : styles.calendarDayLabelMuted,
                      active ? styles.calendarDayLabelActive : null,
                    ]}>
                    {day.dayNumber}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable accessibilityRole="button" onPress={onCancel} style={styles.modalFooterButton}>
            <Text style={styles.modalFooterButtonLabel}>{inlineCopy.calendarConfirm}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
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
    container: getTransactionFormContainerStyle(spacing),
    section: {
      gap: spacing.sm,
    },
    sectionLabel: {
      fontSize: typography.caption,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    segmentedRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    segmentedItem: {
      flex: 1,
    },
    optionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -spacing.xs,
      rowGap: spacing.sm,
    },
    optionGridItem: {
      width: '33.3333%',
      paddingHorizontal: spacing.xs,
    },
    optionChip: {
      width: '100%',
      minHeight: 44,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionChip: {
      width: '100%',
      minHeight: 44,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.brand,
      backgroundColor: colors.brandSoft,
      paddingHorizontal: spacing.sm,
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
      width: '100%',
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    optionChipLabelActive: {
      color: colors.brandContrast,
    },
    actionChipLabel: {
      width: '100%',
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.brandContrast,
      textAlign: 'center',
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
    dateField: {
      minHeight: 52,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      justifyContent: 'center',
      gap: 4,
    },
    dateFieldValue: {
      fontSize: typography.bodyLarge,
      fontWeight: '600',
      color: colors.text,
    },
    dateFieldAction: {
      fontSize: typography.caption,
      color: colors.textSecondary,
    },
    noteInput: {
      minHeight: 104,
    },
    errorText: {
      fontSize: typography.caption,
      color: colors.danger,
    },
    inlineComposer: {
      gap: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      padding: spacing.md,
    },
    inlineActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    inlinePrimaryButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      backgroundColor: colors.brand,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    inlineSecondaryButton: {
      minWidth: 92,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
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
    modalBackdrop: {
      flex: 1,
      justifyContent: 'center',
      backgroundColor: 'rgba(15, 23, 42, 0.16)',
      padding: spacing.lg,
    },
    modalCard: {
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: spacing.lg,
      gap: spacing.md,
      ...cardShadow,
    },
    calendarHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    calendarNavButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    calendarNavLabel: {
      fontSize: typography.bodyLarge,
      fontWeight: '700',
      color: colors.text,
    },
    calendarTitle: {
      fontSize: typography.bodyLarge,
      fontWeight: '700',
      color: colors.text,
    },
    calendarWeekdays: {
      flexDirection: 'row',
    },
    calendarWeekdayLabel: {
      width: '14.2857%',
      textAlign: 'center',
      fontSize: typography.caption,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    calendarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    calendarDay: {
      width: '14.2857%',
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
    },
    calendarDayMuted: {
      opacity: 0.45,
    },
    calendarDayActive: {
      backgroundColor: colors.brandSoft,
      borderWidth: 1,
      borderColor: colors.brand,
    },
    calendarDayLabel: {
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.text,
    },
    calendarDayLabelMuted: {
      color: colors.textSecondary,
    },
    calendarDayLabelActive: {
      color: colors.brandContrast,
    },
    modalFooterButton: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      backgroundColor: colors.brand,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    modalFooterButtonLabel: {
      fontSize: typography.body,
      fontWeight: '700',
      color: colors.textInverse,
    },
  });
}

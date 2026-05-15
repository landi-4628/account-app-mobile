import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { accountingCopy } from '../../constants/accounting-copy.js';
import { CategoryIcon } from './category-icon.js';
import { formatAccountingMonth } from './helpers.js';
import {
  addMonthsToDateInput,
  buildCalendarWeeks,
  createCalendarDayLabelTextStyle,
  formatDatePickerLabel,
} from './date-picker-support.js';
import {
  appendAmountExpressionKey,
  backspaceAmountExpression,
  clearAmountExpression,
  createAmountExpressionState,
  settleAmountExpression,
} from './transaction-amount-expression-support.js';
import {
  buildTransactionFormSubmitPayload,
  createTransactionFormDraft,
  getTransactionFormCategoryOptions,
} from './transaction-form-support.js';
import {
  resolveTransactionDraftAmountInput,
  selectTransactionFormDraftCategory,
} from './transaction-form-ui-support.js';
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

const keypadRows = [
  ['7', '8', '9', '+'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', 'backspace'],
  ['.', '0', 'clear', 'settle'],
];

const inlineCopy = {
  amountHint: '\u9009\u62e9\u5206\u7c7b\u540e\u8f93\u5165\u91d1\u989d',
  amountLabel: '\u91d1\u989d',
  chooseDate: '\u9009\u62e9\u65e5\u671f',
  complete: '\u5b8c\u6210',
  calendarConfirm: '\u786e\u5b9a',
  calendarWeekdays: ['\u65e5', '\u4e00', '\u4e8c', '\u4e09', '\u56db', '\u4e94', '\u516d'],
  keyboardClear: 'C',
  keyboardBackspace: '\u232b',
  manageCategories: '\u5206\u7c7b\u7ba1\u7406',
  timeLabel: '\u65f6\u95f4',
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
 *   onManageCategories?: ((entryType: EntryType) => void) | undefined,
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
  onManageCategories,
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
  const [amountState, setAmountState] = useState(() =>
    createInitialAmountState(
      createTransactionFormDraft({
        mode,
        initialValues,
        categoryOptions,
        implicitAccountId,
        defaultType,
        defaultSyncStatus,
        timeZoneOffset,
      }).amountInput
    )
  );
  const [errors, setErrors] = useState(/** @type {TransactionFormErrors} */ ({}));
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(draft.dateInput.slice(0, 7));
  const visibleCategories = useMemo(
    () => getTransactionFormCategoryOptions(categoryOptions, draft.type),
    [categoryOptions, draft.type]
  );
  const calendarWeeks = useMemo(() => buildCalendarWeeks(visibleMonth), [visibleMonth]);
  const completeButtonLabel = submitLabel ?? inlineCopy.complete;
  const disableActions = disabled || busy;
  const shouldShowBottomPanel = Boolean(draft.categoryId);

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
    setAmountState(createInitialAmountState(nextDraft.amountInput));
    setVisibleMonth(nextDraft.dateInput.slice(0, 7));
    setErrors(/** @type {TransactionFormErrors} */ ({}));
    setDatePickerOpen(false);
  }, [
    defaultType,
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
    if (!draft.categoryId) {
      return;
    }

    if (!visibleCategories.some((option) => option.value === draft.categoryId)) {
      setDraft((currentDraft) => ({
        ...currentDraft,
        categoryId: '',
      }));
    }
  }, [draft.categoryId, visibleCategories]);

  const handleAmountStateChange = React.useCallback((nextAmountState) => {
    setAmountState(nextAmountState);
    setDraft((currentDraft) => ({
      ...currentDraft,
      amountInput: resolveTransactionDraftAmountInput(nextAmountState),
    }));
    if (errors.amountInput) {
      setErrors((currentErrors) => ({ ...currentErrors, amountInput: undefined }));
    }
  }, [errors.amountInput]);

  const handleSubmit = React.useCallback(() => {
    const result = buildTransactionFormSubmitPayload(draft, {
      timeZoneOffset,
      defaultSyncStatus,
    });

    setErrors(result.errors);

    if (result.values) {
      onSubmit(result.values);
    }
  }, [defaultSyncStatus, draft, onSubmit, timeZoneOffset]);

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <View style={styles.typeTabs}>
          {entryTypeOptions.map((option) => (
            <View key={option.value} style={styles.segmentedItem}>
              <OptionChip
                active={draft.type === option.value}
                disabled={disableActions}
                label={option.label}
                variant="type"
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

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{accountingCopy.form.category}</Text>
        <View style={styles.optionGrid}>
          {visibleCategories.map((option) => (
            <View key={option.value} style={styles.optionGridItem}>
              <OptionChip
                active={draft.categoryId === option.value}
                color={option.color}
                disabled={disableActions}
                iconName={option.iconName}
                label={option.label}
                variant="category"
                onPress={() =>
                  setDraft((currentDraft) =>
                    selectTransactionFormDraftCategory(currentDraft, option.value)
                  )
                }
                styles={styles}
              />
            </View>
          ))}
          <View style={styles.optionGridItem}>
            <SettingsChip
              disabled={disableActions}
              label={inlineCopy.manageCategories}
              onPress={() => onManageCategories?.(draft.type)}
              styles={styles}
            />
          </View>
        </View>
        {errors.categoryId ? <Text style={styles.errorText}>{errors.categoryId}</Text> : null}
      </View>

      {shouldShowBottomPanel ? (
        <View style={styles.bottomPanel}>
          <View style={styles.amountPanel}>
            <Text style={styles.amountPanelLabel}>{inlineCopy.amountLabel}</Text>
            <Text style={styles.amountPanelValue}>
              {amountState.expression || amountState.amount || '0'}
            </Text>
            {amountState.expression && amountState.expression !== amountState.amount ? (
              <Text style={styles.amountPanelHint}>{amountState.amount || inlineCopy.amountHint}</Text>
            ) : (
              <Text style={styles.amountPanelHint}>{inlineCopy.amountHint}</Text>
            )}
            {errors.amountInput ? <Text style={styles.errorText}>{errors.amountInput}</Text> : null}
          </View>

          <View style={styles.inlineFields}>
            <View style={styles.inlineFieldRow}>
              <Pressable
                accessibilityRole="button"
                disabled={disableActions}
                onPress={() => {
                  setVisibleMonth(draft.dateInput.slice(0, 7));
                  setDatePickerOpen(true);
                }}
                style={({ pressed }) => [
                  styles.inlineFieldCard,
                  styles.inlineFieldHalf,
                  disableActions && styles.buttonDisabled,
                  pressed && !disableActions ? styles.optionChipPressed : null,
                ]}>
                <Text style={styles.inlineFieldLabel}>{accountingCopy.form.dateTime}</Text>
                <Text style={styles.inlineFieldValue}>{formatDatePickerLabel(draft.dateInput)}</Text>
              </Pressable>

              <View style={[styles.inlineFieldCard, styles.inlineFieldHalf]}>
                <Text style={styles.inlineFieldLabel}>{inlineCopy.timeLabel}</Text>
                <TextInput
                  editable={!disableActions}
                  onChangeText={(timeInput) =>
                    setDraft((currentDraft) => ({ ...currentDraft, timeInput }))
                  }
                  placeholder="12:30"
                  placeholderTextColor={colors.textMuted}
                  style={styles.timeInput}
                  value={draft.timeInput}
                />
              </View>
            </View>

            <View style={styles.inlineFieldCard}>
              <Text style={styles.inlineFieldLabel}>{accountingCopy.form.note}</Text>
              <TextInput
                editable={!disableActions}
                multiline
                onChangeText={(note) => setDraft((currentDraft) => ({ ...currentDraft, note }))}
                placeholder={accountingCopy.form.notePlaceholder}
                placeholderTextColor={colors.textMuted}
                style={styles.noteInput}
                textAlignVertical="top"
                value={draft.note}
              />
            </View>
          </View>

          <View style={styles.keypadGrid}>
            {keypadRows.flat().map((key) => (
              <KeypadButton
                key={key}
                disabled={disableActions}
                label={getKeypadButtonLabel(key)}
                variant={key === 'settle' ? 'accent' : key === 'clear' ? 'subtle' : 'default'}
                onPress={() => {
                  const nextAmountState = reduceAmountState(amountState, key);
                  handleAmountStateChange(nextAmountState);
                }}
                styles={styles}
              />
            ))}
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={disableActions || !amountState.canSubmit}
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.primaryButton,
                (disableActions || !amountState.canSubmit) && styles.buttonDisabled,
                pressed && !(disableActions || !amountState.canSubmit)
                  ? styles.primaryButtonPressed
                  : null,
              ]}>
              <Text style={styles.primaryButtonLabel}>
                {busy ? accountingCopy.form.saving : completeButtonLabel}
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
        </View>
      ) : null}

      <DatePickerModal
        disableActions={disableActions}
        draftDateInput={draft.dateInput}
        onCancel={() => setDatePickerOpen(false)}
        onChangeMonth={(monthDelta) =>
          setVisibleMonth((current) => addMonthsToDateInput(`${current}-01`, monthDelta).slice(0, 7))
        }
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
 * @param {string} amountInput
 * @returns {{ expression: string, amount: string, canSubmit: boolean }}
 */
function createInitialAmountState(amountInput) {
  if (!amountInput) {
    return createAmountExpressionState();
  }

  return settleAmountExpression({ expression: amountInput });
}

/**
 * @param {{ expression: string, amount: string, canSubmit: boolean }} currentAmountState
 * @param {string} key
 * @returns {{ expression: string, amount: string, canSubmit: boolean }}
 */
function reduceAmountState(currentAmountState, key) {
  if (key === 'backspace') {
    return backspaceAmountExpression(currentAmountState);
  }

  if (key === 'clear') {
    return clearAmountExpression();
  }

  if (key === 'settle') {
    return settleAmountExpression(currentAmountState);
  }

  return appendAmountExpressionKey(currentAmountState, key);
}

/**
 * @param {string} key
 * @returns {string}
 */
function getKeypadButtonLabel(key) {
  if (key === 'backspace') {
    return inlineCopy.keyboardBackspace;
  }

  if (key === 'clear') {
    return inlineCopy.keyboardClear;
  }

  if (key === 'settle') {
    return '=';
  }

  return key;
}

/**
 * @param {{
 *   active: boolean,
 *   disabled: boolean,
 *   label: string,
 *   iconName?: string | undefined,
 *   color?: string | undefined,
 *   onPress: () => void,
 *   styles: TransactionFormStyles,
 *   variant?: 'type' | 'category' | undefined,
 * }} props
 */
function OptionChip({
  active,
  disabled,
  label,
  iconName,
  color,
  onPress,
  styles,
  variant = 'category',
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        variant === 'type' ? styles.typeChip : styles.optionChip,
        active && variant === 'type' ? styles.typeChipActive : null,
        disabled ? styles.buttonDisabled : null,
        pressed && !disabled ? styles.optionChipPressed : null,
      ]}>
      {variant === 'category' ? (
        <>
          <CategoryIcon
            active={active}
            color={active ? color ?? '#1f2937' : '#667085'}
            iconName={iconName}
          />
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.optionChipLabel, active ? styles.optionChipLabelActive : null]}>
            {label}
          </Text>
        </>
      ) : (
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.typeChipLabel, active ? styles.typeChipLabelActive : null]}>
          {label}
        </Text>
      )}
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
function SettingsChip({ disabled, label, onPress, styles }) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionChip,
        disabled ? styles.buttonDisabled : null,
        pressed && !disabled ? styles.optionChipPressed : null,
      ]}>
      <CategoryIcon color="#667085" iconName="settings-outline" />
      <Text style={styles.optionChipLabel}>{label}</Text>
    </Pressable>
  );
}

/**
 * @param {{
 *   disabled: boolean,
 *   label: string,
 *   onPress: () => void,
 *   styles: TransactionFormStyles,
 *   variant: 'default' | 'accent' | 'subtle',
 * }} props
 */
function KeypadButton({ disabled, label, onPress, styles, variant }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.keypadButton,
        variant === 'accent' ? styles.keypadButtonAccent : null,
        variant === 'subtle' ? styles.keypadButtonSubtle : null,
        disabled ? styles.buttonDisabled : null,
        pressed && !disabled ? styles.optionChipPressed : null,
      ]}>
      <Text
        style={[
          styles.keypadButtonLabel,
          variant === 'accent' ? styles.keypadButtonLabelAccent : null,
        ]}>
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
            <Pressable
              accessibilityRole="button"
              disabled={disableActions}
              onPress={() => onChangeMonth(-1)}
              style={styles.calendarNavButton}>
              <Text style={styles.calendarNavLabel}>{'<'}</Text>
            </Pressable>
            <Text style={styles.calendarTitle}>{formatAccountingMonth(visibleMonth)}</Text>
            <Pressable
              accessibilityRole="button"
              disabled={disableActions}
              onPress={() => onChangeMonth(1)}
              style={styles.calendarNavButton}>
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
    typeTabs: {
      flexDirection: 'row',
      gap: spacing.sm,
      borderRadius: radius.xl,
      backgroundColor: colors.brandSoft,
      padding: spacing.xs,
    },
    sectionLabel: {
      fontSize: typography.body,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    segmentedItem: {
      flex: 1,
    },
    optionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -spacing.xs,
      rowGap: spacing.lg,
    },
    optionGridItem: {
      width: '25%',
      paddingHorizontal: spacing.xs,
    },
    optionChip: {
      width: '100%',
      gap: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionChip: {
      width: '100%',
      gap: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
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
      color: colors.brand,
    },
    typeChip: {
      minHeight: 48,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      paddingHorizontal: spacing.sm,
    },
    typeChipActive: {
      backgroundColor: colors.brand,
    },
    typeChipLabel: {
      fontSize: typography.bodyLarge,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    typeChipLabelActive: {
      color: colors.textInverse,
    },
    bottomPanel: {
      gap: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: spacing.lg,
      ...cardShadow,
    },
    amountPanel: {
      gap: spacing.xs,
      borderRadius: radius.md,
      backgroundColor: colors.brandSoft,
      padding: spacing.md,
    },
    amountPanelLabel: {
      fontSize: typography.caption,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    amountPanelValue: {
      fontSize: 36,
      fontWeight: '700',
      color: colors.text,
    },
    amountPanelHint: {
      fontSize: typography.caption,
      color: colors.textSecondary,
    },
    inlineFields: {
      gap: spacing.sm,
    },
    inlineFieldRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    inlineFieldCard: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      padding: spacing.md,
      gap: spacing.xs,
    },
    inlineFieldHalf: {
      flex: 1,
    },
    inlineFieldLabel: {
      fontSize: typography.caption,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    inlineFieldValue: {
      fontSize: typography.bodyLarge,
      fontWeight: '600',
      color: colors.text,
    },
    timeInput: {
      fontSize: typography.bodyLarge,
      fontWeight: '600',
      color: colors.text,
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
    noteInput: {
      minHeight: 88,
      fontSize: typography.body,
      color: colors.text,
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
    keypadGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    keypadButton: {
      width: '22%',
      minHeight: 52,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    keypadButtonAccent: {
      backgroundColor: colors.brand,
      borderColor: colors.brand,
    },
    keypadButtonSubtle: {
      backgroundColor: colors.highlight,
      borderColor: colors.borderStrong,
    },
    keypadButtonLabel: {
      fontSize: typography.bodyLarge,
      fontWeight: '700',
      color: colors.text,
    },
    keypadButtonLabelAccent: {
      color: colors.textInverse,
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
      ...createCalendarDayLabelTextStyle(),
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
      backgroundColor: colors.highlight,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    modalFooterButtonLabel: {
      fontSize: typography.body,
      fontWeight: '700',
      color: colors.text,
    },
  });
}

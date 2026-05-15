import React, { useEffect, useMemo, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { accountingCopy } from '../../constants/accounting-copy.js';
import { CategoryIcon } from './category-icon.js';
import { formatAccountingMonth } from './helpers.js';
import {
  addMonthsToDateInput,
  buildCalendarWeeks,
  createCalendarDayLabelTextStyle,
  isDateInputAfter,
} from './date-picker-support.js';
import {
  appendAmountExpressionKey,
  backspaceAmountExpression,
  createAmountExpressionState,
  settleAmountExpression,
} from './transaction-amount-expression-support.js';
import {
  buildTransactionFormSubmitPayload,
  createTransactionFormDraft,
  formatDateInput,
  getTransactionFormCategoryOptions,
} from './transaction-form-support.js';
import {
  resolveTransactionDraftAmountInput,
  resolveTransactionFormPrimaryAmountAction,
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
  ['7', '8', '9', 'date'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['.', '0', 'backspace', 'submit'],
];

const inlineCopy = {
  amountHint: '\u8bf7\u8f93\u5165\u91d1\u989d',
  complete: '\u5b8c\u6210',
  calendarConfirm: '\u786e\u5b9a',
  calendarWeekdays: ['\u65e5', '\u4e00', '\u4e8c', '\u4e09', '\u56db', '\u4e94', '\u516d'],
  keyboardBackspace: '\u232b',
  manageCategories: '\u5206\u7c7b\u7ba1\u7406',
  notePlaceholder: '\u70b9\u51fb\u586b\u5199\u5907\u6ce8',
  today: '\u4eca\u5929',
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
  disabled = false,
  busy = false,
  onSubmit,
  onManageCategories,
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
  const todayDateInput = useMemo(() => formatDateInput(new Date(), timeZoneOffset), [timeZoneOffset]);
  const completeButtonLabel = submitLabel ?? inlineCopy.complete;
  const primaryAmountAction = resolveTransactionFormPrimaryAmountAction(amountState, {
    submitLabel: busy ? accountingCopy.form.saving : completeButtonLabel,
  });
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
    defaultSyncStatus,
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

      <ScrollView
        contentContainerStyle={[
          styles.categoryScrollContent,
          shouldShowBottomPanel ? styles.categoryScrollContentWithBottomPanel : null,
        ]}
        showsVerticalScrollIndicator={false}
        style={styles.categoryScroll}>
        <View style={styles.section}>
          <View style={styles.categoryHeader}>
            <Text style={styles.sectionLabel}>{accountingCopy.form.category}</Text>
            {onManageCategories ? (
              <Pressable
                accessibilityLabel={inlineCopy.manageCategories}
                accessibilityRole="button"
                disabled={disableActions}
                onPress={() => onManageCategories?.(draft.type)}
                style={({ pressed }) => [
                  styles.categoryManageButton,
                  disableActions ? styles.buttonDisabled : null,
                  pressed && !disableActions ? styles.optionChipPressed : null,
                ]}>
                <Ionicons color={colors.icon} name="settings-outline" size={18} />
              </Pressable>
            ) : null}
          </View>
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
          </View>
          {errors.categoryId ? <Text style={styles.errorText}>{errors.categoryId}</Text> : null}
        </View>
      </ScrollView>

      {shouldShowBottomPanel ? (
        <View style={styles.bottomPanel}>
          <View style={styles.amountPanel}>
            <Text style={styles.amountPanelValue}>
              {amountState.expression || amountState.amount || '0.00'}
            </Text>
            {errors.amountInput ? <Text style={styles.errorText}>{errors.amountInput}</Text> : null}
          </View>

          <View style={styles.inlineFields}>
            <View style={styles.inlineFieldCard}>
              <Text style={styles.inlineFieldPrefix}>{'\u5907\u6ce8\uff1a'}</Text>
              <TextInput
                editable={!disableActions}
                onChangeText={(note) => setDraft((currentDraft) => ({ ...currentDraft, note }))}
                placeholder={inlineCopy.notePlaceholder}
                placeholderTextColor={colors.textMuted}
                style={styles.noteInput}
                value={draft.note}
              />
            </View>
          </View>

          <View style={styles.keypadGrid}>
            {keypadRows.flat().map((key) => (
              <KeypadButton
                key={key}
                disabled={key === 'submit' ? disableActions || primaryAmountAction.disabled : disableActions}
                iconName={getKeypadButtonIcon(key)}
                label={getKeypadButtonLabel(key, primaryAmountAction.label, draft.dateInput)}
                variant={getKeypadButtonVariant(key)}
                onPress={() => {
                  if (key === 'date') {
                    setVisibleMonth(draft.dateInput.slice(0, 7));
                    setDatePickerOpen(true);
                    return;
                  }

                  if (key === 'submit') {
                    if (primaryAmountAction.type === 'settle') {
                      handleAmountStateChange(settleAmountExpression(amountState));
                      return;
                    }

                    handleSubmit();
                    return;
                  }

                  const nextAmountState = reduceAmountState(amountState, key);
                  handleAmountStateChange(nextAmountState);
                }}
                styles={styles}
              />
            ))}
          </View>
        </View>
      ) : null}

      <DatePickerModal
        disableActions={disableActions}
        draftDateInput={draft.dateInput}
        maxDateInput={todayDateInput}
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

  return appendAmountExpressionKey(currentAmountState, key);
}

/**
 * @param {string} key
 * @param {string} primaryActionLabel
 * @param {string} dateInput
 * @returns {string}
 */
function getKeypadButtonLabel(key, primaryActionLabel, dateInput) {
  if (key === 'date') {
    return dateInput;
  }

  if (key === 'backspace') {
    return '';
  }

  if (key === 'submit') {
    return primaryActionLabel;
  }

  return key;
}

/**
 * @param {string} key
 * @returns {'default' | 'submit' | 'date'}
 */
function getKeypadButtonVariant(key) {
  if (key === 'submit') {
    return 'submit';
  }

  if (key === 'date') {
    return 'date';
  }

  return 'default';
}

/**
 * @param {string} key
 * @returns {import('@expo/vector-icons/Ionicons').defaultProps['name'] | undefined}
 */
function getKeypadButtonIcon(key) {
  if (key === 'backspace') {
    return 'backspace-outline';
  }

  return undefined;
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
 *   iconName?: import('@expo/vector-icons/Ionicons').defaultProps['name'] | undefined,
 *   label: string,
 *   onPress: () => void,
 *   styles: TransactionFormStyles,
 *   variant: 'default' | 'submit' | 'date',
 * }} props
 */
function KeypadButton({ disabled, iconName, label, onPress, styles, variant }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.keypadButton,
        variant === 'submit' ? styles.keypadButtonSubmit : null,
        variant === 'date' ? styles.keypadButtonDate : null,
        disabled ? styles.buttonDisabled : null,
        pressed && !disabled ? styles.optionChipPressed : null,
      ]}>
      <View style={variant === 'date' ? styles.keypadButtonDateContent : styles.keypadButtonContent}>
        {iconName ? (
          <Ionicons
            color={variant === 'submit' ? styles.keypadButtonLabelSubmit.color : styles.keypadButtonLabel.color}
            name={iconName}
            size={22}
          />
        ) : null}
        {label ? (
          <Text
            style={[
              styles.keypadButtonLabel,
              variant === 'submit' ? styles.keypadButtonLabelSubmit : null,
              variant === 'date' ? styles.keypadButtonLabelDate : null,
            ]}>
            {label}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/**
 * @param {{
 *   open: boolean,
 *   visibleMonth: string,
 *   draftDateInput: string,
 *   maxDateInput: string,
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
  maxDateInput,
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
              disabled={disableActions || visibleMonth >= maxDateInput.slice(0, 7)}
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
              const disabledDay = disableActions || isDateInputAfter(day.value, maxDateInput);

              return (
                <Pressable
                  key={day.key}
                  accessibilityRole="button"
                  disabled={disabledDay}
                  onPress={() => onSelect(day.value)}
                  style={({ pressed }) => [
                    styles.calendarDay,
                    day.inCurrentMonth ? null : styles.calendarDayMuted,
                    disabledDay ? styles.calendarDayDisabled : null,
                    active ? styles.calendarDayActive : null,
                    pressed && !disabledDay ? styles.optionChipPressed : null,
                  ]}>
                  <Text
                    style={[
                      styles.calendarDayLabel,
                      day.inCurrentMonth ? null : styles.calendarDayLabelMuted,
                      disabledDay ? styles.calendarDayLabelDisabled : null,
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
    container: {
      ...getTransactionFormContainerStyle(spacing),
      flex: 1,
      position: 'relative',
    },
    section: {
      gap: spacing.xs,
    },
    typeTabs: {
      flexDirection: 'row',
      gap: spacing.xs,
      minHeight: 42,
      marginHorizontal: -spacing.sm,
      borderRadius: radius.xl,
      backgroundColor: colors.brandSoft,
      padding: 4,
    },
    sectionLabel: {
      fontSize: typography.body,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    categoryHeader: {
      minHeight: 36,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    categoryManageButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryScroll: {
      flex: 1,
    },
    categoryScrollContent: {
      paddingBottom: spacing.xl,
    },
    categoryScrollContentWithBottomPanel: {
      paddingBottom: 430,
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
      minHeight: 38,
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
      position: 'absolute',
      right: -spacing.md,
      bottom: -spacing.xl,
      left: -spacing.md,
      gap: 0,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 0,
      overflow: 'hidden',
      ...cardShadow,
    },
    amountPanel: {
      minHeight: 46,
      alignItems: 'flex-end',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
    },
    amountPanelValue: {
      fontSize: 30,
      fontWeight: '400',
      color: colors.text,
    },
    inlineFields: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    inlineFieldCard: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.sm,
      minHeight: 34,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      gap: spacing.xs,
    },
    inlineFieldPrefix: {
      fontSize: typography.body,
      fontWeight: '700',
      color: colors.text,
    },
    noteInput: {
      fontSize: typography.body,
      color: colors.text,
      flex: 1,
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
    keypadGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    keypadButton: {
      width: '25%',
      minHeight: 56,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    keypadButtonContent: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    keypadButtonDate: {
      backgroundColor: colors.surface,
    },
    keypadButtonDateContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    keypadButtonSubmit: {
      backgroundColor: colors.brand,
    },
    keypadButtonLabel: {
      fontSize: typography.bodyLarge,
      fontWeight: '500',
      color: colors.text,
    },
    keypadButtonLabelDate: {
      fontSize: typography.caption,
      fontWeight: '700',
    },
    keypadButtonLabelSubmit: {
      fontSize: typography.title ?? typography.bodyLarge,
      fontWeight: '700',
      color: colors.textInverse,
    },
    errorText: {
      fontSize: typography.caption,
      color: colors.danger,
      alignSelf: 'flex-start',
      paddingTop: spacing.xs,
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
    calendarDayDisabled: {
      opacity: 0.3,
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
    calendarDayLabelDisabled: {
      color: colors.textMuted,
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

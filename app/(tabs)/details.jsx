import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { accountingCopy } from '@/constants/accounting-copy';
import { useMockApp } from '@/providers/mock-app-provider';
import {
  AccountingScreen,
  EmptyState,
  InteractiveCard,
  MonthSwitcher,
  SectionHeader,
  TransactionListItem,
  formatAccountingCurrency,
} from '@/components/accounting';
import {
  buildDetailsSummaryItems,
  createCategoryNameMap,
  getAccountingMonthLabel,
  groupTransactionsByDay,
} from '@/components/accounting/home-details-utils.js';
import { useAccountingTheme } from '@/components/accounting/use-accounting-theme.js';

export default function DetailsScreen() {
  const router = useRouter();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { colors, spacing, radius, typography, shadow } = useAccountingTheme();
  const styles = useMemo(
    () => createStyles(colors, spacing, radius, typography, shadow),
    [colors, spacing, radius, typography, shadow]
  );
  const {
    actions,
    availableMonths,
    categories,
    currentMonth,
    currentMonthData,
    user,
  } = useMockApp();
  const [activeMenu, setActiveMenu] = useState(
    /** @type {{ id: string, x: number, y: number } | null} */ (null)
  );
  const summaryItems = buildDetailsSummaryItems(currentMonthData.summary);
  const categoryNameMap = useMemo(() => createCategoryNameMap(categories), [categories]);
  const groupedTransactions = useMemo(
    () => groupTransactionsByDay(currentMonthData.transactions, user.timezone),
    [currentMonthData.transactions, user.timezone]
  );

  const openNewTransaction = React.useCallback(() => {
    router.push('/transaction/new');
  }, [router]);

  const openEditTransaction = React.useCallback(
    (transactionId) => {
      setActiveMenu(null);
      router.push(`/transaction/${transactionId}`);
    },
    [router]
  );

  const closeTransactionMenu = React.useCallback(() => {
    setActiveMenu(null);
  }, []);

  const openTransactionMenu = React.useCallback((transactionId, event) => {
    const { pageX, pageY } = event.nativeEvent;

    setActiveMenu({
      id: transactionId,
      x: pageX,
      y: pageY,
    });
  }, []);

  const deleteTransaction = React.useCallback(
    (transactionId) => {
      setActiveMenu(null);
      actions.deleteTransaction(transactionId);
    },
    [actions]
  );

  const menuPosition = useMemo(() => {
    if (!activeMenu) {
      return null;
    }

    const menuWidth = 164;
    const estimatedMenuHeight = 112;
    const left = Math.min(
      Math.max(activeMenu.x - menuWidth + 20, spacing.md),
      windowWidth - menuWidth - spacing.md
    );
    const top = Math.min(
      Math.max(activeMenu.y - estimatedMenuHeight, spacing.md),
      windowHeight - estimatedMenuHeight - spacing.xl
    );

    return { left, top, width: menuWidth };
  }, [activeMenu, spacing.md, spacing.xl, windowHeight, windowWidth]);

  return (
    <View style={styles.screen}>
      <AccountingScreen>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{accountingCopy.tabs.details}</Text>
            <Text style={styles.subtitle}>
              {`${getAccountingMonthLabel(currentMonth)} · ${currentMonthData.transactions.length} ${accountingCopy.details.monthRecordSuffix}`}
            </Text>
          </View>
        </View>

        <MonthSwitcher
          months={availableMonths}
          value={currentMonth}
          onChange={actions.setCurrentMonth}
        />

        <View style={styles.summaryStrip}>
          {summaryItems.map((item) => (
            <InteractiveCard key={item.key} style={styles.summaryCard} shadowStyle={shadow.card}>
              <Text style={styles.summaryLabel}>{item.label}</Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                style={[
                  styles.summaryValue,
                  item.tone === 'income'
                    ? styles.summaryValueIncome
                    : item.tone === 'expense'
                      ? styles.summaryValueExpense
                      : null,
                ]}>
                {formatAccountingCurrency(item.value)}
              </Text>
            </InteractiveCard>
          ))}
        </View>

        {groupedTransactions.length > 0 ? (
          groupedTransactions.map((group) => (
            <View key={group.key} style={styles.groupSection}>
              <SectionHeader
                title={group.label}
                subtitle={buildGroupSubtitle(group.totalIncome, group.totalExpense)}
              />
              <View style={styles.groupList}>
                {group.transactions.map((transaction) => (
                  <TransactionListItem
                    key={transaction.id}
                    transaction={transaction}
                    categoryLabel={categoryNameMap.get(transaction.categoryId) ?? transaction.categoryId}
                    timeZone={user.timezone}
                    onLongPress={(item, event) => openTransactionMenu(item.id, event)}
                  />
                ))}
              </View>
            </View>
          ))
        ) : (
          <EmptyState
            title={accountingCopy.details.emptyTitle}
            description={accountingCopy.details.emptyDescription}
            actionLabel={accountingCopy.actions.addEntry}
            onActionPress={openNewTransaction}
          />
        )}
      </AccountingScreen>

      <Pressable
        accessibilityLabel={accountingCopy.actions.addEntry}
        accessibilityRole="button"
        onPress={openNewTransaction}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}>
        <Ionicons name="add" size={28} color={colors.textInverse} />
      </Pressable>

      <Modal
        transparent
        visible={Boolean(activeMenu && menuPosition)}
        animationType="fade"
        onRequestClose={closeTransactionMenu}>
        <Pressable style={styles.menuBackdrop} onPress={closeTransactionMenu}>
          {menuPosition && activeMenu ? (
            <View style={[styles.menuCard, menuPosition]}>
              <MenuAction
                icon="create-outline"
                label={accountingCopy.actions.edit}
                onPress={() => openEditTransaction(activeMenu.id)}
                styles={styles}
              />
              <View style={styles.menuDivider} />
              <MenuAction
                icon="trash-outline"
                label={accountingCopy.actions.delete}
                tone="danger"
                onPress={() => deleteTransaction(activeMenu.id)}
                styles={styles}
              />
            </View>
          ) : null}
        </Pressable>
      </Modal>
    </View>
  );
}

function MenuAction({ icon, label, tone = 'default', onPress, styles }) {
  const isDanger = tone === 'danger';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.menuAction, pressed && styles.menuActionPressed]}>
      <Ionicons
        size={18}
        name={icon}
        color={isDanger ? styles._dangerColor.color : styles._defaultActionColor.color}
      />
      <Text style={isDanger ? styles.menuActionLabelDanger : styles.menuActionLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

function buildGroupSubtitle(totalIncome, totalExpense) {
  if (totalIncome > 0 && totalExpense > 0) {
    return `+${formatAccountingCurrency(totalIncome)} / -${formatAccountingCurrency(totalExpense)}`;
  }

  if (totalIncome > 0) {
    return `+${formatAccountingCurrency(totalIncome)}`;
  }

  return `-${formatAccountingCurrency(totalExpense)}`;
}

function createStyles(colors, spacing, radius, typography, shadow) {
  return StyleSheet.create({
    screen: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    headerCopy: {
      flex: 1,
      gap: 4,
    },
    title: {
      fontSize: typography.headline,
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: {
      fontSize: typography.body,
      color: colors.textSecondary,
    },
    summaryStrip: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    summaryCard: {
      flex: 1,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.sm,
      gap: 6,
      ...shadow.card,
    },
    summaryLabel: {
      fontSize: typography.caption,
      color: colors.textMuted,
    },
    summaryValue: {
      fontSize: typography.bodyLarge,
      fontWeight: '700',
      color: colors.text,
    },
    summaryValueIncome: {
      color: colors.income,
    },
    summaryValueExpense: {
      color: colors.expense,
    },
    groupSection: {
      gap: spacing.sm,
    },
    groupList: {
      gap: spacing.sm,
    },
    menuBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.08)',
    },
    menuCard: {
      position: 'absolute',
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 6,
      shadowColor: '#0f172a',
      shadowOpacity: 0.16,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 10,
    },
    menuAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    menuActionPressed: {
      backgroundColor: colors.surfaceAlt,
    },
    menuActionLabel: {
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.text,
    },
    menuActionLabelDanger: {
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.danger,
    },
    menuDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 2,
    },
    _defaultActionColor: {
      color: colors.text,
    },
    _dangerColor: {
      color: colors.danger,
    },
    fab: {
      position: 'absolute',
      right: spacing.lg,
      bottom: spacing.xl,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.brand,
      shadowColor: '#0f172a',
      shadowOpacity: 0.2,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 10,
    },
    fabPressed: {
      opacity: 0.88,
    },
  });
}

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
  buildAccountManagementViewModel,
  buildCapabilityNotice,
  getActionAvailability,
} from '@/components/accounting/management-screen-support';
import { getAccountTypeLabel } from '@/components/accounting/statistics-profile-support';
import { useAccountingTheme } from '@/components/accounting/use-accounting-theme';
import { useMockApp } from '@/providers/mock-app-provider';

const ACCOUNT_TYPES = ['cash', 'bank', 'alipay', 'wechat'];

function TypePicker({ value, onChange, disabled }) {
  const theme = useAccountingTheme();
  const styles = createPickerStyles(theme);

  return (
    <View style={styles.wrap}>
      {ACCOUNT_TYPES.map((type) => (
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
            {getAccountTypeLabel(type)}
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
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    option: {
      minWidth: 88,
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
      color: colors.text,
      fontWeight: '600',
    },
    optionLabelSelected: {
      fontSize: typography.body,
      color: colors.brandContrast,
      fontWeight: '700',
    },
  });
}

function AddAccountButton({ disabled, onPress }) {
  const theme = useAccountingTheme();
  const styles = createAddButtonStyles(theme);

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
      <Text style={styles.label}>Add account</Text>
    </Pressable>
  );
}

function createAddButtonStyles({ colors, spacing, radius, typography }) {
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

export default function AccountsScreen() {
  const { accounts, actions } = useMockApp();
  const theme = useAccountingTheme();
  const styles = createStyles(theme);
  const availability = useMemo(() => getActionAvailability(actions), [actions]);
  const viewModel = useMemo(
    () => buildAccountManagementViewModel(accounts, actions),
    [accounts, actions]
  );
  const [name, setName] = useState('');
  const [type, setType] = useState('cash');
  const [submitError, setSubmitError] = useState('');
  const createNotice = buildCapabilityNotice('accountsCreate', availability);
  const manageNotice = buildCapabilityNotice('accountsManage', availability);

  const handleCreate = React.useCallback(() => {
    if (!name.trim() || !availability.canCreateAccounts) {
      return;
    }

    try {
      actions.addAccount?.({
        name: name.trim(),
        type,
      });
      setName('');
      setSubmitError('');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to add account');
    }
  }, [actions, availability.canCreateAccounts, name, type]);

  const handleToggleActive = React.useCallback(
    (accountId, isActive) => {
      if (!viewModel.canManageExisting) {
        return;
      }

      actions.toggleAccountActive?.(accountId, !isActive);
    },
    [actions, viewModel.canManageExisting]
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Accounts' }} />
      <AccountingScreen>
        <SectionHeader
          title="Accounts"
          subtitle="Create accounts now and keep read-only management visible until more provider actions arrive"
        />
        {createNotice ? (
          <InfoBanner
            tone="warning"
            title="Account creation is not available in the current provider"
            description="The form stays visible, but the add action remains disabled until addAccount is exposed."
          />
        ) : null}
        {manageNotice ? (
          <InfoBanner
            tone="warning"
            title="Existing accounts are read-only for now"
            description="No updateAccount/saveAccount or toggleAccountActive action is available, so row actions stay disabled."
          />
        ) : null}
        {submitError ? <InfoBanner tone="warning" title={submitError} /> : null}
        <SurfaceCard style={styles.card}>
          <Text style={styles.sectionTitle}>New account</Text>
          <FormField
            label="Account name"
            value={name}
            onChangeText={setName}
            placeholder="Savings, Cash, Travel card"
            autoCapitalize="words"
          />
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Account type</Text>
            <TypePicker
              value={type}
              onChange={setType}
              disabled={!availability.canCreateAccounts}
            />
          </View>
          <AddAccountButton
            disabled={!availability.canCreateAccounts || !name.trim()}
            onPress={handleCreate}
          />
        </SurfaceCard>
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Existing accounts</Text>
          <View style={styles.list}>
            {viewModel.rows.map((row) => (
              <ManagementRow
                key={row.id}
                title={row.item.name}
                subtitle={getAccountTypeLabel(row.item.type)}
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

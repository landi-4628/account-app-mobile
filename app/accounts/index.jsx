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
const copy = {
  title: '\u8d26\u6237\u7ba1\u7406',
  subtitle: '\u65b0\u5efa\u8d26\u6237\uff0c\u5e76\u5728\u540e\u7eed\u63a5\u5165\u66f4\u591a\u7f16\u8f91\u80fd\u529b',
  createUnavailableTitle: '\u5f53\u524d provider \u6682\u4e0d\u652f\u6301\u65b0\u5efa\u8d26\u6237',
  createUnavailableDescription: '\u8868\u5355\u4f1a\u7ee7\u7eed\u663e\u793a\uff0c\u4f46\u6dfb\u52a0\u64cd\u4f5c\u4f1a\u4fdd\u6301\u7981\u7528\uff0c\u76f4\u5230\u66b4\u9732 addAccount \u80fd\u529b\u3002',
  manageUnavailableTitle: '\u73b0\u6709\u8d26\u6237\u6682\u65f6\u53ea\u8bfb',
  manageUnavailableDescription: '\u5f53\u524d\u6ca1\u6709 updateAccount\u3001saveAccount \u6216 toggleAccountActive \u80fd\u529b\uff0c\u56e0\u6b64\u5217\u8868\u64cd\u4f5c\u4f1a\u4fdd\u6301\u7981\u7528\u3002',
  submitError: '\u6dfb\u52a0\u8d26\u6237\u5931\u8d25',
  addButton: '\u6dfb\u52a0\u8d26\u6237',
  newAccount: '\u65b0\u5efa\u8d26\u6237',
  accountName: '\u8d26\u6237\u540d\u79f0',
  accountNamePlaceholder: 'Savings, Cash, Travel card',
  accountType: '\u8d26\u6237\u7c7b\u578b',
  existingAccounts: '\u73b0\u6709\u8d26\u6237',
  tapToDeactivate: '\u70b9\u51fb\u505c\u7528',
  tapToActivate: '\u70b9\u51fb\u542f\u7528',
  inactive: '\u5df2\u505c\u7528',
};

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
      <Text style={styles.label}>{copy.addButton}</Text>
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
      setSubmitError(error instanceof Error ? error.message : copy.submitError);
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
          <Text style={styles.sectionTitle}>{copy.newAccount}</Text>
          <FormField
            label={copy.accountName}
            value={name}
            onChangeText={setName}
            placeholder={copy.accountNamePlaceholder}
            autoCapitalize="words"
          />
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{copy.accountType}</Text>
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
          <Text style={styles.sectionTitle}>{copy.existingAccounts}</Text>
          <View style={styles.list}>
            {viewModel.rows.map((row) => (
              <ManagementRow
                key={row.id}
                title={row.item.name}
                subtitle={getAccountTypeLabel(row.item.type)}
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

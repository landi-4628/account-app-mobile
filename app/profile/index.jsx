import React, { useMemo } from 'react';
import { Stack } from 'expo-router';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { AccountingScreen, InteractiveCard, SectionHeader } from '@/components/accounting';
import {
  getSyncActionLabel,
  getSyncSummaryDetail,
} from '@/components/accounting/statistics-profile-support';
import { useAccountingTheme } from '@/components/accounting/use-accounting-theme';
import { useMockApp } from '@/providers/mock-app-provider';

function InfoCard({ title, rows }) {
  const { colors, spacing, radius, typography, shadow } = useAccountingTheme();
  const styles = createStyles(colors, spacing, radius, typography, shadow);

  return (
    <InteractiveCard style={styles.card} shadowStyle={shadow.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.infoList}>
        {rows.map((row) => (
          <View key={row.label} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{row.label}</Text>
            <Text style={styles.infoValue}>{row.value}</Text>
          </View>
        ))}
      </View>
    </InteractiveCard>
  );
}

function SyncSettingRow({ label, description, control }) {
  const { colors, spacing, typography } = useAccountingTheme();
  const styles = createStyles(colors, spacing, undefined, typography, undefined);

  return (
    <View style={styles.settingRow}>
      <View style={styles.settingCopy}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description ? <Text style={styles.settingDescription}>{description}</Text> : null}
      </View>
      {control}
    </View>
  );
}

export function ProfileDetailsContent({ profile, syncSettings }) {
  const { colors, spacing, radius, typography, shadow } = useAccountingTheme();
  const styles = createStyles(colors, spacing, radius, typography, shadow);

  return (
    <AccountingScreen>
      <SectionHeader
        title="个人信息"
        subtitle="基础资料与同步设置"
      />
      <InfoCard title={profile.name} rows={profile.basicRows} />
      <InfoCard title="工作区" rows={profile.workspaceRows} />
      <InteractiveCard style={styles.card} shadowStyle={shadow.card}>
        <Text style={styles.cardTitle}>{"\u540c\u6b65\u8bbe\u7f6e"}</Text>
        <View style={styles.syncSettingsList}>
          <SyncSettingRow
            label={syncSettings.autoSyncLabel}
            description={syncSettings.autoSyncDescription}
            control={
              <Switch
                accessibilityLabel={syncSettings.autoSyncLabel}
                value={syncSettings.autoSyncEnabled}
                onValueChange={syncSettings.onAutoSyncChange}
                trackColor={{
                  false: colors.border,
                  true: colors.brand,
                }}
                thumbColor={colors.surface}
              />
            }
          />
          <View style={styles.rowDivider} />
          <SyncSettingRow
            label={syncSettings.manualSyncLabel}
            description={syncSettings.manualSyncDescription}
            control={
              syncSettings.showManualSync ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={syncSettings.manualSyncDisabled}
                  onPress={() => void syncSettings.onManualSyncPress()}
                  style={({ pressed }) => [
                    styles.actionButton,
                    syncSettings.manualSyncDisabled && styles.actionButtonDisabled,
                    pressed && !syncSettings.manualSyncDisabled && styles.actionButtonPressed,
                  ]}>
                  <Text style={styles.actionButtonLabel}>{syncSettings.manualSyncButtonText}</Text>
                </Pressable>
              ) : (
                <Text style={styles.statusText}>{"\u5df2\u5f00\u542f"}</Text>
              )
            }
          />
          {syncSettings.syncStatusLabel ? (
            <>
              <View style={styles.rowDivider} />
              <View style={styles.statusBlock}>
                <Text style={styles.settingLabel}>{"\u5f53\u524d\u72b6\u6001"}</Text>
                <Text style={styles.statusText}>{syncSettings.syncStatusLabel}</Text>
              </View>
            </>
          ) : null}
        </View>
      </InteractiveCard>
    </AccountingScreen>
  );
}

export default function ProfileDetailsScreen() {
  const {
    user,
    accountSummaries,
    syncSummary,
    autoSyncEnabled,
    syncInFlight,
    actions,
  } = useMockApp();

  const profile = useMemo(() => {
    const defaultAccountName =
      accountSummaries.find((account) => account.id === user.defaultAccountId)?.name ??
      user.defaultAccountId;

    return {
      name: user.name,
      basicRows: [
        { label: '\u8d26\u672c', value: user.ledgerName },
        { label: '\u90ae\u7bb1', value: user.email },
        { label: '\u5e01\u79cd', value: user.currency },
        { label: '\u65f6\u533a', value: user.timezone },
      ],
      workspaceRows: [
        { label: '\u9ed8\u8ba4\u8d26\u6237', value: defaultAccountName },
        {
          label: '\u542f\u7528\u8d26\u6237',
          value: String(accountSummaries.filter((account) => account.isActive).length),
        },
        { label: '\u5f53\u524d\u6a21\u5f0f', value: '\u4ec5\u672c\u5730 Mock \u6570\u636e' },
      ],
    };
  }, [accountSummaries, user]);

  const syncSettings = useMemo(
    () => ({
      autoSyncEnabled,
      onAutoSyncChange: actions.setAutoSyncEnabled,
      onManualSyncPress: actions.syncPendingTransactions,
      autoSyncLabel: '\u81ea\u52a8\u540c\u6b65',
      autoSyncDescription: autoSyncEnabled
        ? '\u8d26\u76ee\u4f1a\u5148\u5199\u5165\u672c\u5730 SQLite\uff0c\u6709\u7f51\u65f6\u81ea\u52a8\u4e0a\u4f20\u5230\u670d\u52a1\u7aef\u3002'
        : '\u5173\u95ed\u540e\u53ea\u4fdd\u5b58\u5230\u672c\u5730 SQLite\uff0c\u540e\u7eed\u53ef\u4ee5\u624b\u52a8\u540c\u6b65\u3002',
      manualSyncLabel:
        getSyncActionLabel(syncSummary.status, {
          isAutoSyncEnabled: autoSyncEnabled,
          hasPendingChanges: syncSummary.pendingCount > 0 || syncSummary.failedCount > 0,
        }) ?? '\u624b\u52a8\u540c\u6b65',
      manualSyncDescription: autoSyncEnabled
        ? '\u81ea\u52a8\u540c\u6b65\u5f00\u542f\u65f6\uff0c\u5f85\u540c\u6b65\u6570\u636e\u4f1a\u5728\u6709\u7f51\u65f6\u81ea\u52a8\u4e0a\u4f20\u3002'
        : '\u4ec5\u672c\u5730\u4fdd\u5b58\u6a21\u5f0f\u4e0b\uff0c\u53ef\u5728\u540e\u7eed\u624b\u52a8\u89e6\u53d1\u4e0a\u4f20\u3002',
      syncStatusLabel: getSyncSummaryDetail(syncSummary, user.timezone, {
        isAutoSyncEnabled: autoSyncEnabled,
      }),
      showManualSync: !autoSyncEnabled,
      manualSyncDisabled:
        syncInFlight || (syncSummary.pendingCount === 0 && syncSummary.failedCount === 0),
      manualSyncButtonText: syncInFlight ? '\u540c\u6b65\u4e2d...' : '\u7acb\u5373\u540c\u6b65',
    }),
    [actions, autoSyncEnabled, syncInFlight, syncSummary, user.timezone]
  );

  return (
    <>
      <Stack.Screen options={{ title: '个人信息' }} />
      <ProfileDetailsContent profile={profile} syncSettings={syncSettings} />
    </>
  );
}

function createStyles(colors, spacing, radius, typography, shadow) {
  return StyleSheet.create({
    card: {
      borderRadius: radius?.lg ?? 16,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.md,
      ...(shadow?.card ?? {}),
    },
    cardTitle: {
      fontSize: typography.title,
      fontWeight: '700',
      color: colors.text,
    },
    infoList: {
      gap: spacing.sm,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    infoLabel: {
      fontSize: typography.body,
      color: colors.textSecondary,
    },
    infoValue: {
      flex: 1,
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'right',
    },
    syncSettingsList: {
      gap: spacing.md,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    settingCopy: {
      flex: 1,
      gap: 4,
    },
    settingLabel: {
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.text,
    },
    settingDescription: {
      fontSize: typography.caption,
      color: colors.textSecondary,
    },
    rowDivider: {
      height: 1,
      backgroundColor: colors.border,
    },
    actionButton: {
      minHeight: 36,
      justifyContent: 'center',
      borderRadius: radius?.pill ?? 999,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.brandSoft,
    },
    actionButtonPressed: {
      opacity: 0.82,
    },
    actionButtonDisabled: {
      opacity: 0.45,
    },
    actionButtonLabel: {
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.brandContrast,
    },
    statusBlock: {
      gap: 4,
    },
    statusText: {
      fontSize: typography.body,
      color: colors.textSecondary,
    },
  });
}

import React, { useMemo, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  AccountingScreen,
  FeedbackDialog,
  ManagementRow,
  SectionHeader,
  SurfaceCard,
} from '@/components/accounting';
import {
  buildCapabilityNotice,
  getActionAvailability,
} from '@/components/accounting/management-screen-support';
import {
  buildProfileCapabilityNotice,
  buildProfileHubSections,
  buildProfileSyncModeRows,
  getProfileSyncModeCopy,
} from '@/components/accounting/profile-screen-support';
import { useAccountingTheme } from '@/components/accounting/use-accounting-theme';
import { useMockApp } from '@/providers/mock-app-provider';

const copy = {
  title: '\u4e2a\u4eba\u8d44\u6599',
  subtitle: '\u8d44\u6599\u3001\u8d26\u6237\u5b89\u5168\u548c\u8d26\u672c\u8bbe\u7f6e',
  email: '\u90ae\u7bb1',
  ledger: '\u8d26\u672c',
  timezone: '\u65f6\u533a',
  syncMode: '\u540c\u6b65\u65b9\u5f0f',
  pendingSync: '\u5f85\u540c\u6b65',
  logout: '退出登录',
  logoutConfirmTitle: '确认退出登录',
  logoutConfirmDescription: '退出后将清除当前设备上的登录状态。',
  cancel: '取消',
  acknowledge: '知道了',
  confirm: '退出登录',
};

function QuickLinkSection({ title, rows }) {
  const { spacing } = useAccountingTheme();

  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={sectionTitleStyle(useAccountingTheme())}>{title}</Text>
      <View style={{ gap: spacing.sm }}>
        {rows.map((row, index) => {
          const { key: rowKey, ...rowProps } = row;

          return (
            <ManagementRow
              key={rowKey ?? row.href ?? `${title}-${index}`}
              {...rowProps}
            />
          );
        })}
      </View>
    </View>
  );
}

function sectionTitleStyle(theme) {
  return {
    fontSize: theme.typography.bodyLarge,
    fontWeight: '700',
    color: theme.colors.text,
  };
}

export default function ProfileHubScreen() {
  const router = useRouter();
  const { user, actions, syncSummary, autoSyncEnabled, isAuthenticated } = useMockApp();
  const theme = useAccountingTheme();
  const styles = createStyles(theme);
  const availability = useMemo(() => getActionAvailability(actions), [actions]);
  const [dialogState, setDialogState] = useState(null);
  const sections = buildProfileHubSections({
    availability,
  });
  const syncModeRows = buildProfileSyncModeRows({
    autoSyncEnabled,
    setAutoSyncEnabled: actions.setAutoSyncEnabled,
  });

  const capabilityNotice =
    buildCapabilityNotice('profileEdit', availability)
    ?? buildCapabilityNotice('passwordChange', availability)
    ?? buildCapabilityNotice('login', availability);
  const capabilityNoticeCopy = capabilityNotice ? buildProfileCapabilityNotice() : null;

  React.useEffect(() => {
    if (!capabilityNoticeCopy) {
      return;
    }

    setDialogState((current) => current ?? {
      title: capabilityNoticeCopy.title,
      description: capabilityNoticeCopy.description,
      actions: [{ label: copy.acknowledge, tone: 'primary' }],
    });
  }, [capabilityNoticeCopy]);

  const handleLogoutPress = React.useCallback(() => {
    setDialogState({
      title: copy.logoutConfirmTitle,
      description: copy.logoutConfirmDescription,
      actions: [
        { label: copy.cancel, tone: 'secondary' },
        {
          label: copy.confirm,
          tone: 'danger',
          onPress: () => {
            void actions.logout?.();
          },
        },
      ],
    });
  }, [actions]);

  return (
    <>
      <Stack.Screen options={{ title: copy.title }} />
      <AccountingScreen>
        <SectionHeader title={copy.title} subtitle={copy.subtitle} />
        <SurfaceCard style={styles.card}>
          <Text style={styles.name}>{user.name}</Text>
          <View style={styles.summaryList}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{copy.email}</Text>
              <Text style={styles.summaryValue}>{user.email}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{copy.ledger}</Text>
              <Text style={styles.summaryValue}>{user.ledgerName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{copy.timezone}</Text>
              <Text style={styles.summaryValue}>{user.timezone}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{copy.syncMode}</Text>
              <Text style={styles.summaryValue}>{getProfileSyncModeCopy(autoSyncEnabled)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{copy.pendingSync}</Text>
              <Text style={styles.summaryValue}>{String(syncSummary.pendingCount)}</Text>
            </View>
          </View>
        </SurfaceCard>
        {isAuthenticated ? (
          <Pressable
            accessibilityRole="button"
            onPress={handleLogoutPress}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed ? styles.logoutButtonPressed : null,
            ]}>
            <Text style={styles.logoutButtonLabel}>{copy.logout}</Text>
          </Pressable>
        ) : null}
        <QuickLinkSection title={copy.syncMode} rows={syncModeRows} />
        {sections.map((section) => (
          <QuickLinkSection
            key={section.title}
            title={section.title}
            rows={section.rows.map((row) => ({
              ...row,
              onPress: () => router.push(row.href),
            }))}
          />
        ))}
        <FeedbackDialog
          visible={dialogState != null}
          title={dialogState?.title ?? ''}
          description={dialogState?.description}
          actions={dialogState?.actions}
          onClose={() => setDialogState(null)}
        />
      </AccountingScreen>
    </>
  );
}

function createStyles({ colors, spacing, typography }) {
  return StyleSheet.create({
    card: {
      gap: spacing.md,
    },
    name: {
      fontSize: typography.title,
      fontWeight: '700',
      color: colors.text,
    },
    summaryList: {
      gap: spacing.sm,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    summaryLabel: {
      fontSize: typography.body,
      color: colors.textSecondary,
    },
    summaryValue: {
      flex: 1,
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'right',
    },
    logoutButton: {
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.danger,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
    },
    logoutButtonPressed: {
      opacity: 0.85,
    },
    logoutButtonLabel: {
      fontSize: typography.body,
      fontWeight: '700',
      color: colors.danger,
    },
  });
}

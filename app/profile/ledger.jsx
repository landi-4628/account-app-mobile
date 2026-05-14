import React, { useEffect, useMemo, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  AccountingScreen,
  EmptyState,
  FeedbackDialog,
  FormField,
  ManagementRow,
  SectionHeader,
  SurfaceCard,
} from '@/components/accounting';
import { buildAuthRequiredDialogState } from '@/components/accounting/auth-required-dialog-support';
import { useAccountingTheme } from '@/components/accounting/use-accounting-theme';
import { useMockApp } from '@/providers/mock-app-provider';

const copy = {
  title: '账本管理',
  subtitle: '查看当前账本、创建账本并切换正在使用的账本',
  currentLedger: '当前账本',
  myLedgers: '我的账本',
  noLedgers: '还没有可用账本',
  ledgerName: '账本名称',
  ledgerNamePlaceholder: '例如：家庭账本',
  createLedger: '创建账本',
  switchLedger: '切换',
  activeLedger: '当前',
  createErrorFallback: '创建账本失败',
  switchErrorFallback: '切换账本失败',
  loadErrorFallback: '加载账本失败',
  ledgerNameError: '请输入账本名称',
  acknowledge: '知道了',
};

function ActionButton({ label, onPress, disabled }) {
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
      <Text style={styles.label}>{label}</Text>
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

export default function LedgerManagementScreen() {
  const router = useRouter();
  const { currentLedger, myLedgers, user, actions, isAuthenticated } = useMockApp();
  const theme = useAccountingTheme();
  const styles = createStyles(theme);
  const [draftName, setDraftName] = useState('');
  const [dialogState, setDialogState] = useState(null);
  const [busyLedgerId, setBusyLedgerId] = useState('');
  const [creating, setCreating] = useState(false);
  const trimmedDraftName = draftName.trim();
  const draftNameError = useMemo(
    () => (draftName.length > 0 && trimmedDraftName.length === 0 ? copy.ledgerNameError : ''),
    [draftName, trimmedDraftName.length]
  );

  useEffect(() => {
    let active = true;

    async function hydrate() {
      if (!isAuthenticated) {
        return;
      }

      try {
        await actions.loadMyLedgers();
      } catch (error) {
        if (active) {
          setDialogState({
            title: error instanceof Error ? error.message : copy.loadErrorFallback,
            actions: [{ label: copy.acknowledge, tone: 'primary' }],
          });
        }
      }
    }

    void hydrate();

    return () => {
      active = false;
    };
  }, [actions, isAuthenticated]);

  const handleCreateLedger = React.useCallback(async () => {
    if (!trimmedDraftName) {
      setDialogState({
        title: copy.ledgerNameError,
        actions: [{ label: copy.acknowledge, tone: 'primary' }],
      });
      return;
    }

    setCreating(true);

    try {
      await actions.createLedger({
        name: trimmedDraftName,
        baseCurrency: user.currency,
      });
      setDraftName('');
    } catch (error) {
      setDialogState(
        error instanceof Error && error.message === '请先登录'
          ? buildAuthRequiredDialogState(() => {
              router.push('/auth/login');
            })
          : {
              title: error instanceof Error ? error.message : copy.createErrorFallback,
              actions: [{ label: copy.acknowledge, tone: 'primary' }],
            }
      );
    } finally {
      setCreating(false);
    }
  }, [actions, router, trimmedDraftName, user.currency]);

  const handleSwitchLedger = React.useCallback(
    async (ledgerId) => {
      setBusyLedgerId(ledgerId);

      try {
        await actions.switchLedger(ledgerId);
      } catch (error) {
        setDialogState(
          error instanceof Error && error.message === '请先登录'
            ? buildAuthRequiredDialogState(() => {
                router.push('/auth/login');
              })
            : {
                title: error instanceof Error ? error.message : copy.switchErrorFallback,
                actions: [{ label: copy.acknowledge, tone: 'primary' }],
              }
        );
      } finally {
        setBusyLedgerId('');
      }
    },
    [actions, router]
  );

  return (
    <>
      <Stack.Screen options={{ title: copy.title }} />
      <AccountingScreen>
        <SectionHeader title={copy.title} subtitle={copy.subtitle} />
        {isAuthenticated ? (
          <>
            <SurfaceCard style={styles.card}>
              <Text style={styles.label}>{copy.currentLedger}</Text>
              <Text style={styles.currentLedgerName}>{currentLedger?.name ?? user.ledgerName}</Text>
              <Text style={styles.currentLedgerMeta}>
                {currentLedger?.baseCurrency ?? user.currency} | {copy.activeLedger}
              </Text>
            </SurfaceCard>
            <SurfaceCard style={styles.card}>
              <Text style={styles.label}>{copy.createLedger}</Text>
              <FormField
                label={copy.ledgerName}
                value={draftName}
                onChangeText={setDraftName}
                placeholder={copy.ledgerNamePlaceholder}
                error={draftNameError || undefined}
              />
              <ActionButton
                label={copy.createLedger}
                onPress={() => void handleCreateLedger()}
                disabled={creating}
              />
            </SurfaceCard>
            <View style={styles.section}>
              <Text style={styles.label}>{copy.myLedgers}</Text>
              <View style={styles.rows}>
                {myLedgers.length === 0 ? (
                  <SurfaceCard>
                    <Text style={styles.emptyText}>{copy.noLedgers}</Text>
                  </SurfaceCard>
                ) : (
                  myLedgers.map((ledger) => {
                    const isCurrent = ledger.id === currentLedger?.id;

                    return (
                      <ManagementRow
                        key={ledger.id}
                        title={ledger.name}
                        subtitle={ledger.baseCurrency ?? user.currency}
                        meta={isCurrent ? copy.activeLedger : copy.switchLedger}
                        badge={isCurrent ? { label: copy.activeLedger, tone: 'neutral' } : null}
                        disabled={isCurrent || busyLedgerId === ledger.id}
                        onPress={() => void handleSwitchLedger(ledger.id)}
                      />
                    );
                  })
                )}
              </View>
            </View>
          </>
        ) : (
          <EmptyState
            title="请先登录"
            description="登录后才能查看和切换账本。"
            actionLabel="去登录"
            onActionPress={() => router.push('/auth/login')}
          />
        )}
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
    section: {
      gap: spacing.sm,
    },
    rows: {
      gap: spacing.sm,
    },
    label: {
      fontSize: typography.bodyLarge,
      fontWeight: '700',
      color: colors.text,
    },
    currentLedgerName: {
      fontSize: typography.title,
      fontWeight: '700',
      color: colors.text,
    },
    currentLedgerMeta: {
      fontSize: typography.body,
      color: colors.textSecondary,
    },
    emptyText: {
      fontSize: typography.body,
      color: colors.textSecondary,
    },
  });
}

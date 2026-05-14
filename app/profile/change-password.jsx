import React, { useMemo, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  AccountingScreen,
  FeedbackDialog,
  FormField,
  SectionHeader,
  SurfaceCard,
} from '@/components/accounting';
import {
  buildCapabilityNotice,
  getActionAvailability,
  validatePasswordChangeDraft,
} from '@/components/accounting/management-screen-support';
import { useAccountingTheme } from '@/components/accounting/use-accounting-theme';
import { useMockApp } from '@/providers/mock-app-provider';

const copy = {
  title: '\u4fee\u6539\u5bc6\u7801',
  subtitle: '\u66f4\u65b0\u5f53\u524d\u8d26\u53f7\u7684\u767b\u5f55\u5bc6\u7801',
  unavailableTitle: '\u5f53\u524d\u6682\u4e0d\u652f\u6301\u4fee\u6539\u5bc6\u7801',
  unavailableDescription: '\u8868\u5355\u53ef\u4ee5\u5148\u586b\u5199\uff0c\u63a5\u5165\u4fee\u6539\u80fd\u529b\u540e\u5373\u53ef\u63d0\u4ea4\u3002',
  submitError: '\u4fee\u6539\u5bc6\u7801\u5931\u8d25',
  currentPassword: '\u5f53\u524d\u5bc6\u7801',
  nextPassword: '\u65b0\u5bc6\u7801',
  confirmPassword: '\u786e\u8ba4\u65b0\u5bc6\u7801',
  currentPasswordError: '\u8bf7\u8f93\u5165\u5f53\u524d\u5bc6\u7801',
  nextPasswordError: '\u65b0\u5bc6\u7801\u81f3\u5c11 6 \u4f4d',
  confirmPasswordError: '\u4e24\u6b21\u8f93\u5165\u7684\u5bc6\u7801\u4e0d\u4e00\u81f4',
  cancel: '\u53d6\u6d88',
  submit: '\u66f4\u65b0\u5bc6\u7801',
  acknowledge: '知道了',
};

function PasswordButton({ label, onPress, disabled, secondary = false }) {
  const theme = useAccountingTheme();
  const styles = createButtonStyles(theme);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary ? styles.buttonSecondary : styles.buttonPrimary,
        disabled ? styles.buttonDisabled : null,
        pressed && !disabled ? styles.buttonPressed : null,
      ]}>
      <Text style={secondary ? styles.labelSecondary : styles.labelPrimary}>{label}</Text>
    </Pressable>
  );
}

function createButtonStyles({ colors, spacing, radius, typography }) {
  return StyleSheet.create({
    button: {
      flex: 1,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
    },
    buttonPrimary: {
      backgroundColor: colors.brand,
    },
    buttonSecondary: {
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonPressed: {
      opacity: 0.85,
    },
    labelPrimary: {
      fontSize: typography.body,
      fontWeight: '700',
      color: colors.textInverse,
    },
    labelSecondary: {
      fontSize: typography.body,
      fontWeight: '700',
      color: colors.text,
    },
  });
}

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { actions } = useMockApp();
  const theme = useAccountingTheme();
  const styles = createStyles(theme);
  const availability = useMemo(() => getActionAvailability(actions), [actions]);
  const [draft, setDraft] = useState({
    currentPassword: '',
    nextPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [dialogState, setDialogState] = useState(null);
  const capabilityNotice = buildCapabilityNotice('passwordChange', availability);

  React.useEffect(() => {
    if (!capabilityNotice) {
      return;
    }

    setDialogState((current) => current ?? {
      title: copy.unavailableTitle,
      description: copy.unavailableDescription,
      actions: [{ label: copy.acknowledge, tone: 'primary' }],
    });
  }, [capabilityNotice]);

  const handleChange = React.useCallback((field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  }, []);

  const handleSubmit = React.useCallback(async () => {
    const nextErrors = validatePasswordChangeDraft(draft);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || !availability.canChangePassword) {
      return;
    }

    try {
      await actions.changePassword?.(draft);
      router.back();
    } catch (error) {
      setDialogState({
        title: error instanceof Error ? error.message : copy.submitError,
        actions: [{ label: copy.acknowledge, tone: 'primary' }],
      });
    }
  }, [actions, availability.canChangePassword, draft, router]);

  return (
    <>
      <Stack.Screen options={{ title: copy.title }} />
      <AccountingScreen>
        <SectionHeader title={copy.title} subtitle={copy.subtitle} />
        <SurfaceCard style={styles.card}>
          <FormField
            label={copy.currentPassword}
            value={draft.currentPassword}
            onChangeText={(value) => handleChange('currentPassword', value)}
            error={errors.currentPassword ? copy.currentPasswordError : undefined}
            secureTextEntry
          />
          <FormField
            label={copy.nextPassword}
            value={draft.nextPassword}
            onChangeText={(value) => handleChange('nextPassword', value)}
            error={errors.nextPassword ? copy.nextPasswordError : undefined}
            secureTextEntry
          />
          <FormField
            label={copy.confirmPassword}
            value={draft.confirmPassword}
            onChangeText={(value) => handleChange('confirmPassword', value)}
            error={errors.confirmPassword ? copy.confirmPasswordError : undefined}
            secureTextEntry
          />
          <View style={styles.actions}>
            <PasswordButton label={copy.cancel} secondary onPress={() => router.back()} />
            <PasswordButton
              label={copy.submit}
              onPress={() => void handleSubmit()}
              disabled={!availability.canChangePassword}
            />
          </View>
        </SurfaceCard>
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

function createStyles({ spacing }) {
  return StyleSheet.create({
    card: {
      gap: spacing.md,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
  });
}

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
  buildProfileFormDraft,
  getActionAvailability,
  validateProfileFormDraft,
} from '@/components/accounting/management-screen-support';
import { useAccountingTheme } from '@/components/accounting/use-accounting-theme';
import { useMockApp } from '@/providers/mock-app-provider';

const copy = {
  title: '\u7f16\u8f91\u4e2a\u4eba\u4fe1\u606f',
  subtitle: '\u66f4\u65b0\u59d3\u540d\u3001\u90ae\u7bb1\u3001\u8d26\u672c\u548c\u65f6\u533a',
  unavailableTitle: '\u5f53\u524d\u6682\u4e0d\u652f\u6301\u4fee\u6539\u4e2a\u4eba\u4fe1\u606f',
  unavailableDescription: '\u4f60\u53ef\u4ee5\u5148\u67e5\u770b\u8fd9\u4e9b\u5b57\u6bb5\uff0c\u63a5\u5165\u66f4\u65b0\u80fd\u529b\u540e\u5373\u53ef\u4fdd\u5b58\u3002',
  submitError: '\u4fdd\u5b58\u4e2a\u4eba\u4fe1\u606f\u5931\u8d25',
  name: '\u59d3\u540d',
  email: '\u90ae\u7bb1',
  ledgerName: '\u8d26\u672c\u540d\u79f0',
  timezone: '\u65f6\u533a',
  cancel: '\u53d6\u6d88',
  save: '\u4fdd\u5b58\u4fee\u6539',
  nameError: '\u8bf7\u8f93\u5165\u59d3\u540d',
  emailError: '\u8bf7\u8f93\u5165\u6709\u6548\u7684\u90ae\u7bb1\u5730\u5740',
  ledgerNameError: '\u8bf7\u8f93\u5165\u8d26\u672c\u540d\u79f0',
  timezoneError: '\u8bf7\u8f93\u5165\u65f6\u533a',
  acknowledge: '知道了',
};

function ActionButton({ label, onPress, disabled, tone = 'primary' }) {
  const theme = useAccountingTheme();
  const styles = createButtonStyles(theme);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        tone === 'secondary' ? styles.buttonSecondary : styles.buttonPrimary,
        disabled ? styles.buttonDisabled : null,
        pressed && !disabled ? styles.buttonPressed : null,
      ]}>
      <Text
        style={[
          styles.buttonLabel,
          tone === 'secondary' ? styles.buttonLabelSecondary : styles.buttonLabelPrimary,
        ]}>
        {label}
      </Text>
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
    buttonLabel: {
      fontSize: typography.body,
      fontWeight: '700',
    },
    buttonLabelPrimary: {
      color: colors.textInverse,
    },
    buttonLabelSecondary: {
      color: colors.text,
    },
  });
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, actions } = useMockApp();
  const theme = useAccountingTheme();
  const styles = createStyles(theme);
  const availability = useMemo(() => getActionAvailability(actions), [actions]);
  const [draft, setDraft] = useState(() => buildProfileFormDraft(user));
  const [errors, setErrors] = useState({});
  const [dialogState, setDialogState] = useState(null);
  const capabilityNotice = buildCapabilityNotice('profileEdit', availability);

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
    const nextErrors = validateProfileFormDraft(draft);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || !availability.canUpdateProfile) {
      return;
    }

    try {
      await actions.updateProfile?.(draft);
      router.back();
    } catch (error) {
      setDialogState({
        title: error instanceof Error ? error.message : copy.submitError,
        actions: [{ label: copy.acknowledge, tone: 'primary' }],
      });
    }
  }, [actions, availability.canUpdateProfile, draft, router]);

  return (
    <>
      <Stack.Screen options={{ title: copy.title }} />
      <AccountingScreen>
        <SectionHeader title={copy.title} subtitle={copy.subtitle} />
        <SurfaceCard style={styles.card}>
          <FormField
            label={copy.name}
            value={draft.name}
            onChangeText={(value) => handleChange('name', value)}
            error={errors.name ? copy.nameError : undefined}
            autoCapitalize="words"
          />
          <FormField
            label={copy.email}
            value={draft.email}
            onChangeText={(value) => handleChange('email', value)}
            error={errors.email ? copy.emailError : undefined}
            keyboardType="email-address"
          />
          <FormField
            label={copy.ledgerName}
            value={draft.ledgerName}
            onChangeText={(value) => handleChange('ledgerName', value)}
            error={errors.ledgerName ? copy.ledgerNameError : undefined}
            autoCapitalize="words"
          />
          <FormField
            label={copy.timezone}
            value={draft.timezone}
            onChangeText={(value) => handleChange('timezone', value)}
            error={errors.timezone ? copy.timezoneError : undefined}
            placeholder="Asia/Shanghai"
          />
          <View style={styles.actions}>
            <ActionButton label={copy.cancel} tone="secondary" onPress={() => router.back()} />
            <ActionButton
              label={copy.save}
              onPress={() => void handleSubmit()}
              disabled={!availability.canUpdateProfile}
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

function createStyles({ colors, spacing, typography }) {
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

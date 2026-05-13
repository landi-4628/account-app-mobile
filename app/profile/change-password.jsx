import React, { useMemo, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  AccountingScreen,
  FormField,
  InfoBanner,
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
  const [submitError, setSubmitError] = useState('');
  const capabilityNotice = buildCapabilityNotice('passwordChange', availability);

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
      setSubmitError(error instanceof Error ? error.message : 'Unable to change password');
    }
  }, [actions, availability.canChangePassword, draft, router]);

  return (
    <>
      <Stack.Screen options={{ title: 'Change password' }} />
      <AccountingScreen>
        <SectionHeader
          title="Change password"
          subtitle="Prepared for a provider action that validates the current password server-side"
        />
        {capabilityNotice ? (
          <InfoBanner
            tone="warning"
            title="Password changes are not wired in the current provider"
            description="The form validates locally, but submit remains disabled until a changePassword action is added."
          />
        ) : null}
        {submitError ? <InfoBanner tone="warning" title={submitError} /> : null}
        <SurfaceCard style={styles.card}>
          <FormField
            label="Current password"
            value={draft.currentPassword}
            onChangeText={(value) => handleChange('currentPassword', value)}
            error={errors.currentPassword ? 'Enter your current password.' : undefined}
            secureTextEntry
          />
          <FormField
            label="New password"
            value={draft.nextPassword}
            onChangeText={(value) => handleChange('nextPassword', value)}
            error={errors.nextPassword ? 'Use at least 6 characters.' : undefined}
            secureTextEntry
          />
          <FormField
            label="Confirm new password"
            value={draft.confirmPassword}
            onChangeText={(value) => handleChange('confirmPassword', value)}
            error={errors.confirmPassword ? 'Passwords must match.' : undefined}
            secureTextEntry
          />
          <View style={styles.actions}>
            <PasswordButton label="Cancel" secondary onPress={() => router.back()} />
            <PasswordButton
              label="Update password"
              onPress={() => void handleSubmit()}
              disabled={!availability.canChangePassword}
            />
          </View>
        </SurfaceCard>
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

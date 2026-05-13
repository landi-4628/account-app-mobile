import React, { useMemo, useState } from 'react';
import { Link, Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  AccountingScreen,
  FormField,
  InfoBanner,
  SectionHeader,
  SurfaceCard,
} from '@/components/accounting';
import {
  buildAuthFormDraft,
  buildCapabilityNotice,
  getActionAvailability,
  validateAuthFormDraft,
} from '@/components/accounting/management-screen-support';
import { useAccountingTheme } from '@/components/accounting/use-accounting-theme';
import { useMockApp } from '@/providers/mock-app-provider';

function RegisterButton({ label, onPress, disabled, secondary = false }) {
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

export default function RegisterScreen() {
  const router = useRouter();
  const { actions } = useMockApp();
  const theme = useAccountingTheme();
  const styles = createStyles(theme);
  const availability = useMemo(() => getActionAvailability(actions), [actions]);
  const [draft, setDraft] = useState(() => buildAuthFormDraft('register'));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const capabilityNotice = buildCapabilityNotice('register', availability);

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
    const nextErrors = validateAuthFormDraft('register', draft);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || !availability.canRegister) {
      return;
    }

    try {
      await actions.register?.({
        name: draft.name.trim(),
        email: draft.email.trim(),
        password: draft.password,
      });
      router.replace('/(tabs)/profile');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to register');
    }
  }, [actions, availability.canRegister, draft, router]);

  return (
    <>
      <Stack.Screen options={{ title: 'Register' }} />
      <AccountingScreen>
        <SectionHeader
          title="Register"
          subtitle="A defensive sign-up form that waits for a provider action"
        />
        {capabilityNotice ? (
          <InfoBanner
            tone="warning"
            title="Registration is not available in the current provider"
            description="The route is ready, but submit stays disabled until a register action is exposed."
          />
        ) : null}
        {submitError ? <InfoBanner tone="warning" title={submitError} /> : null}
        <SurfaceCard style={styles.card}>
          <FormField
            label="Name"
            value={draft.name}
            onChangeText={(value) => handleChange('name', value)}
            error={errors.name ? 'Enter your name.' : undefined}
            autoCapitalize="words"
          />
          <FormField
            label="Email"
            value={draft.email}
            onChangeText={(value) => handleChange('email', value)}
            error={errors.email ? 'Enter a valid email.' : undefined}
            keyboardType="email-address"
          />
          <FormField
            label="Password"
            value={draft.password}
            onChangeText={(value) => handleChange('password', value)}
            error={errors.password ? 'Use at least 6 characters.' : undefined}
            secureTextEntry
          />
          <FormField
            label="Confirm password"
            value={draft.confirmPassword}
            onChangeText={(value) => handleChange('confirmPassword', value)}
            error={errors.confirmPassword ? 'Passwords must match.' : undefined}
            secureTextEntry
          />
          <View style={styles.actions}>
            <RegisterButton label="Back" secondary onPress={() => router.back()} />
            <RegisterButton
              label="Create account"
              onPress={() => void handleSubmit()}
              disabled={!availability.canRegister}
            />
          </View>
          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Link href="/auth/login" style={styles.footerLink}>
              Login
            </Link>
          </Text>
        </SurfaceCard>
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
    footerText: {
      fontSize: typography.body,
      color: colors.textSecondary,
    },
    footerLink: {
      color: colors.brand,
      fontWeight: '700',
    },
  });
}

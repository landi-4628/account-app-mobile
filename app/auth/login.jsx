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

function AuthButton({ label, onPress, disabled, secondary = false }) {
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

export default function LoginScreen() {
  const router = useRouter();
  const { actions } = useMockApp();
  const theme = useAccountingTheme();
  const styles = createStyles(theme);
  const availability = useMemo(() => getActionAvailability(actions), [actions]);
  const [draft, setDraft] = useState(() => buildAuthFormDraft('login'));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const capabilityNotice = buildCapabilityNotice('login', availability);

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
    const nextErrors = validateAuthFormDraft('login', draft);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || !availability.canLogin) {
      return;
    }

    try {
      await actions.login?.({
        email: draft.email.trim(),
        password: draft.password,
      });
      router.replace('/(tabs)/profile');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to sign in');
    }
  }, [actions, availability.canLogin, draft, router]);

  return (
    <>
      <Stack.Screen options={{ title: 'Login' }} />
      <AccountingScreen>
        <SectionHeader
          title="Login"
          subtitle="A ready screen for provider-backed authentication"
        />
        {capabilityNotice ? (
          <InfoBanner
            tone="warning"
            title="Login is not available in the current provider"
            description="The route is in place, but submit stays disabled until a login action is exposed."
          />
        ) : null}
        {submitError ? <InfoBanner tone="warning" title={submitError} /> : null}
        <SurfaceCard style={styles.card}>
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
            error={errors.password ? 'Enter your password.' : undefined}
            secureTextEntry
          />
          <View style={styles.actions}>
            <AuthButton label="Back" secondary onPress={() => router.back()} />
            <AuthButton
              label="Sign in"
              onPress={() => void handleSubmit()}
              disabled={!availability.canLogin}
            />
          </View>
          <Text style={styles.footerText}>
            Need an account?{' '}
            <Link href="/auth/register" style={styles.footerLink}>
              Register
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

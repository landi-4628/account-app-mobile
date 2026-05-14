import React, { useMemo, useState } from 'react';
import { Link, Stack, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

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

const copy = {
  title: '\u6ce8\u518c',
  subtitle: '\u521b\u5efa\u65b0\u8d26\u53f7\uff0c\u51c6\u5907\u5f00\u59cb\u540c\u6b65\u548c\u8bb0\u8d26',
  unavailableTitle: '\u5f53\u524d\u6682\u4e0d\u652f\u6301\u6ce8\u518c',
  unavailableDescription: '\u9875\u9762\u5df2\u7ecf\u51c6\u5907\u597d\uff0c\u63a5\u5165\u6ce8\u518c\u80fd\u529b\u540e\u5373\u53ef\u63d0\u4ea4\u3002',
  submitError: '\u6ce8\u518c\u5931\u8d25',
  name: '\u59d3\u540d',
  email: '\u90ae\u7bb1',
  password: '\u5bc6\u7801',
  confirmPassword: '\u786e\u8ba4\u5bc6\u7801',
  nameError: '\u8bf7\u8f93\u5165\u59d3\u540d',
  emailError: '\u8bf7\u8f93\u5165\u6709\u6548\u7684\u90ae\u7bb1\u5730\u5740',
  passwordError: '\u5bc6\u7801\u81f3\u5c11 6 \u4f4d',
  confirmPasswordError: '\u4e24\u6b21\u8f93\u5165\u7684\u5bc6\u7801\u4e0d\u4e00\u81f4',
  back: '\u8fd4\u56de',
  submit: '\u521b\u5efa\u8d26\u53f7',
  submitting: '\u6ce8\u518c\u4e2d\u2026',
  loginPrompt: '\u5df2\u6709\u8d26\u53f7\uff1f',
  loginLink: '\u53bb\u767b\u5f55',
};

function RegisterButton({ label, onPress, disabled, secondary = false, loading = false }) {
  const theme = useAccountingTheme();
  const styles = createButtonStyles(theme);
  const busy = Boolean(loading);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary ? styles.buttonSecondary : styles.buttonPrimary,
        disabled || busy ? styles.buttonDisabled : null,
        pressed && !(disabled || busy) ? styles.buttonPressed : null,
      ]}>
      {busy && !secondary ? (
        <ActivityIndicator color={theme.colors.textInverse} />
      ) : (
        <Text style={secondary ? styles.labelSecondary : styles.labelPrimary}>{label}</Text>
      )}
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
  const [submitting, setSubmitting] = useState(false);
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

    setSubmitting(true);
    setSubmitError('');
    try {
      await actions.register?.({
        name: draft.name.trim(),
        email: draft.email.trim(),
        password: draft.password,
      });
      router.replace('/(tabs)/profile');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : copy.submitError);
    } finally {
      setSubmitting(false);
    }
  }, [actions, availability.canRegister, draft, router]);

  return (
    <>
      <Stack.Screen options={{ title: copy.title }} />
      <AccountingScreen>
        <SectionHeader title={copy.title} subtitle={copy.subtitle} />
        {capabilityNotice ? (
          <InfoBanner
            tone="warning"
            title={copy.unavailableTitle}
            description={copy.unavailableDescription}
          />
        ) : null}
        {submitError ? <InfoBanner tone="warning" title={submitError} /> : null}
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
            label={copy.password}
            value={draft.password}
            onChangeText={(value) => handleChange('password', value)}
            error={errors.password ? copy.passwordError : undefined}
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
            <RegisterButton label={copy.back} secondary onPress={() => router.back()} disabled={submitting} />
            <RegisterButton
              label={submitting ? copy.submitting : copy.submit}
              onPress={() => void handleSubmit()}
              disabled={!availability.canRegister}
              loading={submitting}
            />
          </View>
          <Text style={styles.footerText}>
            {copy.loginPrompt}{' '}
            <Link href="/auth/login" style={styles.footerLink}>
              {copy.loginLink}
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

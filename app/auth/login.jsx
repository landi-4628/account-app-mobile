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
  title: '\u767b\u5f55',
  subtitle: '\u8fde\u63a5\u5df2\u6709\u8d26\u53f7\uff0c\u7ee7\u7eed\u540c\u6b65\u548c\u7ba1\u7406\u6570\u636e',
  unavailableTitle: '\u5f53\u524d\u6682\u4e0d\u652f\u6301\u767b\u5f55',
  unavailableDescription: '\u9875\u9762\u5df2\u7ecf\u51c6\u5907\u597d\uff0c\u63a5\u5165\u767b\u5f55\u80fd\u529b\u540e\u5373\u53ef\u63d0\u4ea4\u3002',
  submitError: '\u767b\u5f55\u5931\u8d25',
  email: '\u90ae\u7bb1',
  password: '\u5bc6\u7801',
  emailError: '\u8bf7\u8f93\u5165\u6709\u6548\u7684\u90ae\u7bb1\u5730\u5740',
  passwordError: '\u8bf7\u8f93\u5165\u5bc6\u7801',
  back: '\u8fd4\u56de',
  submit: '\u767b\u5f55',
  submitting: '\u767b\u5f55\u4e2d\u2026',
  registerPrompt: '\u8fd8\u6ca1\u6709\u8d26\u53f7\uff1f',
  registerLink: '\u53bb\u6ce8\u518c',
};

function AuthButton({ label, onPress, disabled, secondary = false, loading = false }) {
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

export default function LoginScreen() {
  const router = useRouter();
  const { actions } = useMockApp();
  const theme = useAccountingTheme();
  const styles = createStyles(theme);
  const availability = useMemo(() => getActionAvailability(actions), [actions]);
  const [draft, setDraft] = useState(() => buildAuthFormDraft('login'));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
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

    setSubmitting(true);
    setSubmitError('');
    try {
      await actions.login?.({
        email: draft.email.trim(),
        password: draft.password,
      });
      router.replace('/(tabs)/profile');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : copy.submitError);
    } finally {
      setSubmitting(false);
    }
  }, [actions, availability.canLogin, draft, router]);

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
          <View style={styles.actions}>
            <AuthButton label={copy.back} secondary onPress={() => router.back()} disabled={submitting} />
            <AuthButton
              label={submitting ? copy.submitting : copy.submit}
              onPress={() => void handleSubmit()}
              disabled={!availability.canLogin}
              loading={submitting}
            />
          </View>
          <Text style={styles.footerText}>
            {copy.registerPrompt}{' '}
            <Link href="/auth/register" style={styles.footerLink}>
              {copy.registerLink}
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

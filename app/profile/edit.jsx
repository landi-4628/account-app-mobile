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
  buildProfileFormDraft,
  getActionAvailability,
  validateProfileFormDraft,
} from '@/components/accounting/management-screen-support';
import { useAccountingTheme } from '@/components/accounting/use-accounting-theme';
import { useMockApp } from '@/providers/mock-app-provider';

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
  const { user, accountSummaries, actions } = useMockApp();
  const theme = useAccountingTheme();
  const styles = createStyles(theme);
  const availability = useMemo(() => getActionAvailability(actions), [actions]);
  const [draft, setDraft] = useState(() => buildProfileFormDraft(user));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const capabilityNotice = buildCapabilityNotice('profileEdit', availability);

  const defaultAccountName =
    accountSummaries.find((account) => account.id === draft.defaultAccountId)?.name ?? 'Unknown';

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
      setSubmitError(error instanceof Error ? error.message : 'Unable to save profile');
    }
  }, [actions, availability.canUpdateProfile, draft, router]);

  return (
    <>
      <Stack.Screen options={{ title: 'Edit profile' }} />
      <AccountingScreen>
        <SectionHeader
          title="Edit profile"
          subtitle="Keep the form ready for the provider method that updates user details"
        />
        {capabilityNotice ? (
          <InfoBanner
            tone="warning"
            title="Profile updates are not available in the current provider"
            description="You can review the fields here, but save stays disabled until an updateProfile or saveProfile action is exposed."
          />
        ) : null}
        {submitError ? <InfoBanner tone="warning" title={submitError} /> : null}
        <SurfaceCard style={styles.card}>
          <FormField
            label="Name"
            value={draft.name}
            onChangeText={(value) => handleChange('name', value)}
            error={errors.name ? 'Enter a name.' : undefined}
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
            label="Ledger name"
            value={draft.ledgerName}
            onChangeText={(value) => handleChange('ledgerName', value)}
            error={errors.ledgerName ? 'Enter a ledger name.' : undefined}
            autoCapitalize="words"
          />
          <FormField
            label="Timezone"
            value={draft.timezone}
            onChangeText={(value) => handleChange('timezone', value)}
            error={errors.timezone ? 'Enter a timezone.' : undefined}
            placeholder="Asia/Shanghai"
          />
          <FormField
            label="Default account ID"
            value={draft.defaultAccountId}
            onChangeText={(value) => handleChange('defaultAccountId', value)}
            error={errors.defaultAccountId ? 'Enter a default account ID.' : undefined}
            placeholder="acc-wechat"
          />
          <View style={styles.inlineNote}>
            <Text style={styles.inlineNoteLabel}>Current account</Text>
            <Text style={styles.inlineNoteValue}>{defaultAccountName}</Text>
          </View>
          <View style={styles.actions}>
            <ActionButton label="Cancel" tone="secondary" onPress={() => router.back()} />
            <ActionButton
              label="Save changes"
              onPress={() => void handleSubmit()}
              disabled={!availability.canUpdateProfile}
            />
          </View>
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
    inlineNote: {
      gap: 4,
    },
    inlineNoteLabel: {
      fontSize: typography.caption,
      color: colors.textMuted,
    },
    inlineNoteValue: {
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.text,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
  });
}

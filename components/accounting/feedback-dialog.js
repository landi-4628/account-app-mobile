import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAccountingTheme } from './use-accounting-theme';

/**
 * @param {{
 *   visible: boolean,
 *   title: string,
 *   description?: string | null | undefined,
 *   onClose: () => void,
 *   actions?: Array<{ label: string, onPress?: () => void, tone?: 'primary' | 'secondary' | 'danger' }>,
 * }} props
 */
export function FeedbackDialog({
  visible,
  title,
  description,
  onClose,
  actions = [{ label: '知道了', tone: 'primary' }],
}) {
  const theme = useAccountingTheme();
  const styles = createStyles(theme);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.scrim} />
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
          <View style={styles.actions}>
            {actions.map((action) => (
              <Pressable
                key={action.label}
                accessibilityRole="button"
                onPress={() => {
                  action.onPress?.();
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.button,
                  action.tone === 'secondary'
                    ? styles.secondaryButton
                    : action.tone === 'danger'
                      ? styles.dangerButton
                      : styles.primaryButton,
                  pressed ? styles.buttonPressed : null,
                ]}>
                <Text
                  style={[
                    styles.buttonLabel,
                    action.tone === 'secondary'
                      ? styles.secondaryButtonLabel
                      : styles.primaryButtonLabel,
                  ]}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles({ colors, spacing, radius, typography }) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'center',
      padding: spacing.lg,
    },
    scrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(15, 23, 42, 0.5)',
    },
    card: {
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      padding: spacing.lg,
      gap: spacing.md,
    },
    title: {
      fontSize: typography.title,
      fontWeight: '700',
      color: colors.text,
    },
    description: {
      fontSize: typography.body,
      lineHeight: 22,
      color: colors.textSecondary,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.sm,
    },
    button: {
      minWidth: 88,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
    },
    primaryButton: {
      backgroundColor: colors.brand,
    },
    dangerButton: {
      backgroundColor: colors.danger,
    },
    secondaryButton: {
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    buttonPressed: {
      opacity: 0.85,
    },
    buttonLabel: {
      fontSize: typography.body,
      fontWeight: '700',
    },
    primaryButtonLabel: {
      color: colors.textInverse,
    },
    secondaryButtonLabel: {
      color: colors.text,
    },
  });
}

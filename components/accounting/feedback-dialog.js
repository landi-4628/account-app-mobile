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
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            {description ? <Text style={styles.description}>{description}</Text> : null}
          </View>
          <View style={styles.actions}>
            {actions.map((action, index) => {
              const isPrimary = action.tone === 'primary';
              const isDanger = action.tone === 'danger';

              return (
                <Pressable
                  key={`${action.label}-${index}`}
                  accessibilityRole="button"
                  onPress={() => {
                    action.onPress?.();
                    onClose();
                  }}
                  style={({ pressed }) => [
                    styles.button,
                    index > 0 ? styles.buttonWithDivider : null,
                    pressed ? styles.buttonPressed : null,
                  ]}>
                  <Text
                    style={[
                      styles.buttonLabel,
                      isPrimary
                        ? styles.primaryButtonLabel
                        : isDanger
                          ? styles.dangerButtonLabel
                          : styles.secondaryButtonLabel,
                    ]}>
                    {action.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles({ colors, spacing, typography }) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
    },
    scrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(17, 24, 39, 0.56)',
    },
    card: {
      overflow: 'hidden',
      borderRadius: 24,
      backgroundColor: colors.surface,
    },
    content: {
      paddingTop: spacing.xl,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
    title: {
      fontSize: typography.title,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    description: {
      fontSize: typography.bodyLarge,
      lineHeight: 30,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    actions: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    button: {
      flex: 1,
      minHeight: 56,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.sm,
    },
    buttonWithDivider: {
      borderLeftWidth: 1,
      borderLeftColor: colors.border,
    },
    buttonPressed: {
      backgroundColor: colors.surfaceAlt,
    },
    buttonLabel: {
      fontSize: typography.title,
      fontWeight: '700',
    },
    primaryButtonLabel: {
      color: '#2f80ed',
    },
    secondaryButtonLabel: {
      color: colors.text,
    },
    dangerButtonLabel: {
      color: colors.danger,
    },
  });
}

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';

export type StatusVariant = 'idle' | 'success' | 'error' | 'amber' | 'purple';

interface StatusBannerProps {
  message: string;
  variant?: StatusVariant;
}

export function StatusBanner({ message, variant = 'idle' }: StatusBannerProps) {
  if (!message) {
    return <View style={styles.emptyContainer} />;
  }

  const variantStyles = {
    idle: styles.idle,
    success: styles.success,
    error: styles.error,
    amber: styles.amber,
    purple: styles.purple,
  }[variant];

  const textVariantStyles = {
    idle: styles.idleText,
    success: styles.successText,
    error: styles.errorText,
    amber: styles.amberText,
    purple: styles.purpleText,
  }[variant];

  return (
    <View style={[styles.container, variantStyles]}>
      <Text style={[styles.text, textVariantStyles]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    height: 40,
    marginBottom: 12,
  },
  container: {
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  idle: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  idleText: {
    color: colors.muted,
  },
  success: {
    backgroundColor: '#0d2818',
    borderColor: colors.emerald,
  },
  successText: {
    color: colors.emerald,
  },
  error: {
    backgroundColor: '#2d1214',
    borderColor: colors.red,
  },
  errorText: {
    color: colors.red,
  },
  amber: {
    backgroundColor: '#2a1f0a',
    borderColor: colors.amber,
  },
  amberText: {
    color: colors.amber,
  },
  purple: {
    backgroundColor: '#201633',
    borderColor: colors.purple,
  },
  purpleText: {
    color: colors.purple,
  },
});

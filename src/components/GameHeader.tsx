import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';

interface GameHeaderProps {
  title: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export function GameHeader({ title, soundEnabled, onToggleSound }: GameHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [
          styles.navButton,
          pressed && styles.buttonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <Text style={styles.navButtonText}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>{title}</Text>

      <Pressable
        onPress={onToggleSound}
        style={({ pressed }) => [
          styles.soundButton,
          pressed && styles.buttonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={soundEnabled ? 'Mute sound' : 'Unmute sound'}
      >
        <Text style={styles.soundButtonText}>
          {soundEnabled ? '🔊 Sound' : '🔇 Muted'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  navButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  buttonPressed: {
    opacity: 0.6,
  },
  navButtonText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '500',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  soundButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  soundButtonText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
});

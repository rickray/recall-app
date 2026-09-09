import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '@/theme/colors';

export interface SummaryStat {
  label: string;
  value: string | number;
  highlightColor?: string;
}

interface SummaryCardProps {
  title?: string;
  subtitle?: string;
  stats: SummaryStat[];
  actionLabel?: string;
  onAction: () => void;
  actionColor?: string;
}

export function SummaryCard({
  title = 'Round Ended',
  subtitle = 'Here is your performance summary:',
  stats,
  actionLabel = 'Play Again',
  onAction,
  actionColor = colors.emerald,
}: SummaryCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={styles.grid}>
        {stats.map((stat, idx) => (
          <View
            key={idx}
            style={[
              styles.item,
              stats.length > 2 ? styles.itemHalf : styles.itemFull,
            ]}
          >
            <Text style={styles.itemLabel}>{stat.label}</Text>
            <Text
              style={[
                styles.itemVal,
                stat.highlightColor ? { color: stat.highlightColor } : null,
              ]}
            >
              {stat.value}
            </Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={onAction}
        style={({ pressed }) => [
          styles.actionButton,
          { backgroundColor: actionColor },
          pressed && styles.buttonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
      >
        <Text style={styles.actionButtonText}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 16,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    gap: 10,
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  item: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  itemFull: {
    flex: 1,
  },
  itemHalf: {
    width: '48%',
  },
  itemLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  itemVal: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  actionButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
  actionButtonText: {
    color: '#0d1117',
    fontSize: 16,
    fontWeight: '700',
  },
});

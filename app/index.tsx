import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';

interface GameItem {
  id: string;
  title: string;
  tag: string;
  tagline: string;
  href: '/sequence' | '/n-back' | '/grid' | '/even-factors';
}

const GAMES: GameItem[] = [
  {
    id: 'sequence',
    title: 'Sequence',
    tag: 'Pattern Recall',
    tagline: 'Remember and repeat the growing tone & light sequence.',
    href: '/sequence',
  },
  {
    id: 'n-back',
    title: 'N-back',
    tag: 'Working Memory',
    tagline: 'Match the current stimulus to the one shown N steps back.',
    href: '/n-back',
  },
  {
    id: 'grid',
    title: 'Spatial Grid',
    tag: 'Spatial Memory',
    tagline: 'Memorize briefly flashing tile positions on a 4×4 grid.',
    href: '/grid',
  },
  {
    id: 'even-factors',
    title: 'Even Factors',
    tag: 'Mental Math',
    tagline: 'Mental multiplication where factors end in even digits, with at least one single digit (2, 4, 6, 8).',
    href: '/even-factors',
  },
];

export default function HubScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.header}>
          <Text style={styles.brandTitle}>Recall</Text>
          <Text style={styles.brandTagline}>
            Focused cognitive training and memory games.
          </Text>

          {/* Privacy Pill */}
          <View style={styles.privacyPill}>
            <Text style={styles.privacyPillText}>
              No accounts · No ads · Instant play
            </Text>
          </View>
        </View>

        {/* Game Cards */}
        <View style={styles.gameList}>
          {GAMES.map((game) => (
            <Link key={game.id} href={game.href} asChild>
              <Pressable
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.cardPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${game.title}: ${game.tagline}`}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{game.title}</Text>
                  <View style={styles.cardTagBadge}>
                    <Text style={styles.cardTagText}>{game.tag}</Text>
                  </View>
                </View>

                <Text style={styles.cardTagline}>{game.tagline}</Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.playActionText}>Play →</Text>
                </View>
              </Pressable>
            </Link>
          ))}
        </View>

        {/* Footer Principles */}
        <View style={styles.footer}>
          <View style={styles.principlesContainer}>
            <Text style={styles.principleItem}>Offline</Text>
            <Text style={styles.principleDivider}>·</Text>
            <Text style={styles.principleItem}>Zero tracking</Text>
            <Text style={styles.principleDivider}>·</Text>
            <Text style={styles.principleItem}>One-handed</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  brandTagline: {
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  privacyPill: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  privacyPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.emerald,
    letterSpacing: 0.3,
  },
  gameList: {
    gap: 16,
    marginBottom: 32,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 18,
  },
  cardPressed: {
    borderColor: colors.emerald,
    transform: [{ scale: 0.99 }],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  cardTagBadge: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardTagText: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '500',
  },
  cardTagline: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  playActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.emerald,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  principlesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  principleItem: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '500',
  },
  principleDivider: {
    fontSize: 12,
    color: colors.border,
  },
});

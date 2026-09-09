import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { GameHeader } from '@/components/GameHeader';
import { StatusBanner, StatusVariant } from '@/components/StatusBanner';
import {
  createInitialSequence,
  extendSequence,
  evaluatePress,
  stepSpeed,
  gapSpeed,
} from '@/games/sequence/engine';
import { PadIndex } from '@/games/sequence/types';
import { getInt, setInt } from '@/storage/asyncStore';
import { STORAGE_KEYS } from '@/storage/keys';
import { sound } from '@/audio/sound';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const PAD_CONFIG: {
  index: PadIndex;
  label: string;
  inactiveBg: string;
  inactiveBorder: string;
  activeBg: string;
  activeBorder: string;
}[] = [
  {
    index: 0,
    label: 'Cyan Pad (Top-Left)',
    inactiveBg: '#0d2538',
    inactiveBorder: '#174563',
    activeBg: '#38bdf8',
    activeBorder: '#bae6fd',
  },
  {
    index: 1,
    label: 'Purple Pad (Top-Right)',
    inactiveBg: '#271438',
    inactiveBorder: '#4c2270',
    activeBg: '#a855f7',
    activeBorder: '#e9d5ff',
  },
  {
    index: 2,
    label: 'Amber Pad (Bottom-Left)',
    inactiveBg: '#332308',
    inactiveBorder: '#5c3e0a',
    activeBg: '#fbbf24',
    activeBorder: '#fef08a',
  },
  {
    index: 3,
    label: 'Emerald Pad (Bottom-Right)',
    inactiveBg: '#0c2b1e',
    inactiveBorder: '#16533a',
    activeBg: '#34d399',
    activeBorder: '#a7f3d0',
  },
];

export default function SequenceScreen() {
  const [sequence, setSequence] = useState<PadIndex[]>([]);
  const [playerStep, setPlayerStep] = useState<number>(0);
  const [bestLength, setBestLength] = useState<number>(0);
  const [activePad, setActivePad] = useState<PadIndex | null>(null);
  const [isPlayingSequence, setIsPlayingSequence] = useState<boolean>(false);
  const [isGameActive, setIsGameActive] = useState<boolean>(false);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [status, setStatus] = useState<{ message: string; variant: StatusVariant }>({
    message: 'Press Start to begin',
    variant: 'idle',
  });

  const isMountedRef = useRef<boolean>(true);
  const activeRoundRef = useRef<number>(0);
  const activePadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    (async () => {
      const savedBest = await getInt(STORAGE_KEYS.sequenceBest, 0);
      await sound.load();
      if (isMountedRef.current) {
        setBestLength(savedBest);
        setSoundEnabled(sound.enabled);
      }
    })();

    return () => {
      isMountedRef.current = false;
      if (activePadTimeoutRef.current) {
        clearTimeout(activePadTimeoutRef.current);
      }
    };
  }, []);

  const handleToggleSound = async () => {
    const nextVal = await sound.toggle();
    setSoundEnabled(nextVal);
  };

  const playSequence = useCallback(async (seq: PadIndex[], roundId: number) => {
    setIsPlayingSequence(true);
    setStatus({ message: 'Watch sequence...', variant: 'amber' });

    await sleep(400);
    if (!isMountedRef.current || activeRoundRef.current !== roundId) return;

    const currentStepSpeed = stepSpeed(seq.length);
    const currentGapSpeed = gapSpeed(seq.length);

    for (let i = 0; i < seq.length; i++) {
      if (!isMountedRef.current || activeRoundRef.current !== roundId) return;
      const padIdx = seq[i];
      setActivePad(padIdx);
      sound.playTone(padIdx, currentStepSpeed / 1000);

      await sleep(currentStepSpeed);
      if (!isMountedRef.current || activeRoundRef.current !== roundId) return;
      setActivePad(null);

      await sleep(currentGapSpeed);
      if (!isMountedRef.current || activeRoundRef.current !== roundId) return;
    }

    if (!isMountedRef.current || activeRoundRef.current !== roundId) return;

    setIsPlayingSequence(false);
    setPlayerStep(0);
    setStatus({ message: `Your turn (1 of ${seq.length})`, variant: 'idle' });
  }, []);

  const startGame = useCallback(() => {
    sound.load();
    const newRoundId = activeRoundRef.current + 1;
    activeRoundRef.current = newRoundId;

    if (activePadTimeoutRef.current) {
      clearTimeout(activePadTimeoutRef.current);
      activePadTimeoutRef.current = null;
    }
    setActivePad(null);

    const initialSeq = createInitialSequence();
    setSequence(initialSeq);
    setPlayerStep(0);
    setIsGameActive(true);
    setShowSummary(false);

    playSequence(initialSeq, newRoundId);
  }, [playSequence]);

  const handlePadPress = async (padIndex: PadIndex) => {
    if (!isGameActive || isPlayingSequence) return;

    const roundId = activeRoundRef.current;

    setActivePad(padIndex);
    sound.playTone(padIndex, 0.2);

    if (activePadTimeoutRef.current) {
      clearTimeout(activePadTimeoutRef.current);
    }
    activePadTimeoutRef.current = setTimeout(() => {
      setActivePad(null);
    }, 200);

    const result = evaluatePress(sequence, playerStep, padIndex);

    if (result === 'continue') {
      const nextStep = playerStep + 1;
      setPlayerStep(nextStep);
      setStatus({
        message: `Your turn (${nextStep + 1} of ${sequence.length})`,
        variant: 'idle',
      });
    } else if (result === 'level-complete') {
      setIsPlayingSequence(true);
      setStatus({ message: 'Sequence matched!', variant: 'success' });
      sound.playSuccess();

      const completedLength = sequence.length;
      if (completedLength > bestLength) {
        setBestLength(completedLength);
        await setInt(STORAGE_KEYS.sequenceBest, completedLength);
      }

      await sleep(700);
      if (!isMountedRef.current || activeRoundRef.current !== roundId) return;

      const nextSeq = extendSequence(sequence);
      setSequence(nextSeq);
      playSequence(nextSeq, roundId);
    } else {
      setIsGameActive(false);
      setIsPlayingSequence(false);
      sound.playError();
      setStatus({ message: 'Incorrect sequence', variant: 'error' });

      await sleep(600);
      if (!isMountedRef.current || activeRoundRef.current !== roundId) return;

      setShowSummary(true);
    }
  };

  const isPadDisabled = !isGameActive || isPlayingSequence;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <GameHeader
        title="Sequence"
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Length</Text>
            <Text style={styles.statValue}>
              {sequence.length > 0 ? sequence.length : 1}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Best</Text>
            <Text style={styles.statValue}>{bestLength}</Text>
          </View>
        </View>

        {/* Status Banner */}
        <StatusBanner message={status.message} variant={status.variant} />

        {/* Sequence Board: 4-pad 2x2 grid */}
        <View style={styles.boardContainer}>
          <View style={styles.boardRow}>
            {[PAD_CONFIG[0], PAD_CONFIG[1]].map((cfg) => {
              const isActive = activePad === cfg.index;
              return (
                <Pressable
                  key={cfg.index}
                  onPress={() => handlePadPress(cfg.index)}
                  disabled={isPadDisabled}
                  style={({ pressed }) => [
                    styles.pad,
                    {
                      backgroundColor: isActive
                        ? cfg.activeBg
                        : cfg.inactiveBg,
                      borderColor: isActive
                        ? cfg.activeBorder
                        : cfg.inactiveBorder,
                    },
                    isActive && styles.padActiveGlow,
                    pressed && !isPadDisabled && styles.padPressed,
                    isPadDisabled && !isActive && styles.padDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={cfg.label}
                  accessibilityState={{ disabled: isPadDisabled }}
                />
              );
            })}
          </View>

          <View style={styles.boardRow}>
            {[PAD_CONFIG[2], PAD_CONFIG[3]].map((cfg) => {
              const isActive = activePad === cfg.index;
              return (
                <Pressable
                  key={cfg.index}
                  onPress={() => handlePadPress(cfg.index)}
                  disabled={isPadDisabled}
                  style={({ pressed }) => [
                    styles.pad,
                    {
                      backgroundColor: isActive
                        ? cfg.activeBg
                        : cfg.inactiveBg,
                      borderColor: isActive
                        ? cfg.activeBorder
                        : cfg.inactiveBorder,
                    },
                    isActive && styles.padActiveGlow,
                    pressed && !isPadDisabled && styles.padPressed,
                    isPadDisabled && !isActive && styles.padDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={cfg.label}
                  accessibilityState={{ disabled: isPadDisabled }}
                />
              );
            })}
          </View>
        </View>

        {/* Start Button / Summary Card */}
        {!isGameActive && !showSummary && (
          <View style={styles.actionArea}>
            <Pressable
              onPress={startGame}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Start Exercise"
            >
              <Text style={styles.primaryButtonText}>Start Exercise</Text>
            </Pressable>
          </View>
        )}

        {showSummary && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Round Ended</Text>
            <Text style={styles.summarySubtitle}>
              Here is your performance summary:
            </Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>Length Reached</Text>
                <Text style={styles.summaryItemVal}>{sequence.length}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>Personal Best</Text>
                <Text style={styles.summaryItemVal}>{bestLength}</Text>
              </View>
            </View>
            <Pressable
              onPress={startGame}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Play Again"
            >
              <Text style={styles.primaryButtonText}>Play Again</Text>
            </Pressable>
          </View>
        )}

        {/* How It Works Card */}
        <View style={styles.rulesCard}>
          <Text style={styles.rulesTitle}>How It Works</Text>
          <Text style={styles.rulesBody}>
            Watch the sequence of illuminated pads, then tap them back in the exact order. Each successful round extends the pattern by one step. A single misstep ends the exercise.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    width: '100%',
    maxWidth: 340,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  boardContainer: {
    width: '100%',
    maxWidth: 340,
    aspectRatio: 1,
    marginBottom: 20,
    gap: 12,
  },
  boardRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  pad: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  padPressed: {
    transform: [{ scale: 0.95 }],
  },
  padActiveGlow: {
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  padDisabled: {
    opacity: 0.85,
  },
  actionArea: {
    width: '100%',
    maxWidth: 340,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#38bdf8',
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
  primaryButtonText: {
    color: '#0d1117',
    fontSize: 16,
    fontWeight: '700',
  },
  summaryCard: {
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
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginBottom: 18,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  summaryItemLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryItemVal: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  rulesCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  rulesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  rulesBody: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
  },
});

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { GameHeader } from '@/components/GameHeader';
import { StatusBanner, StatusVariant } from '@/components/StatusBanner';
import {
  generateProblem,
} from '@/games/even-factors/generate';
import {
  EvenFactorsMode,
  EvenFactorsProblem,
  EvenFactorsState,
} from '@/games/even-factors/types';
import {
  createInitialState,
  onCorrect,
  onWrongOrSkip,
} from '@/games/even-factors/engine';
import { getInt, setInt } from '@/storage/asyncStore';
import { STORAGE_KEYS } from '@/storage/keys';
import { sound } from '@/audio/sound';

const MODES: { key: EvenFactorsMode; label: string }[] = [
  { key: 'mixed', label: 'Mixed' },
  { key: '1x2', label: '1×2' },
  { key: '1x1', label: '1×1' },
];

export default function EvenFactorsScreen() {
  const [mode, setMode] = useState<EvenFactorsMode>('mixed');
  const [problem, setProblem] = useState<EvenFactorsProblem>(() =>
    generateProblem('mixed')
  );
  const [input, setInput] = useState<string>('');
  const [revealedProduct, setRevealedProduct] = useState<number | null>(null);
  const [isSuccessLocked, setIsSuccessLocked] = useState<boolean>(false);
  const [status, setStatus] = useState<{ message: string; variant: StatusVariant }>({
    message: '',
    variant: 'idle',
  });
  const [state, setState] = useState<EvenFactorsState>(createInitialState());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const nextTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load persistence & sound on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const [solvedTotal, streakBest] = await Promise.all([
        getInt(STORAGE_KEYS.evenFactorsSolvedTotal, 0),
        getInt(STORAGE_KEYS.evenFactorsStreakBest, 0),
      ]);
      await sound.load();
      if (isMounted) {
        setState({
          solvedTotal,
          currentStreak: 0,
          bestStreak: streakBest,
        });
        setSoundEnabled(sound.enabled);
      }
    })();

    return () => {
      isMounted = false;
      if (nextTimerRef.current) {
        clearTimeout(nextTimerRef.current);
      }
    };
  }, []);

  const handleToggleSound = async () => {
    const nextVal = await sound.toggle();
    setSoundEnabled(nextVal);
  };

  const nextProblem = useCallback(
    (nextMode = mode) => {
      if (nextTimerRef.current) {
        clearTimeout(nextTimerRef.current);
        nextTimerRef.current = null;
      }
      setProblem(generateProblem(nextMode));
      setInput('');
      setRevealedProduct(null);
      setIsSuccessLocked(false);
      setStatus({ message: '', variant: 'idle' });
    },
    [mode]
  );

  const handleModeChange = (newMode: EvenFactorsMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    nextProblem(newMode);
  };

  const handleDigit = (d: string) => {
    if (isSuccessLocked) return;
    if (revealedProduct !== null) return;
    if (input.length >= 6) return;

    sound.playKey();
    if (input === '0') {
      setInput(d);
    } else {
      setInput((prev) => prev + d);
    }
  };

  const handleBackspace = () => {
    if (isSuccessLocked) return;
    if (revealedProduct !== null) return;
    if (input.length === 0) return;

    sound.playKey();
    setInput((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (isSuccessLocked) return;
    if (revealedProduct !== null) return;
    if (input.length === 0) return;

    sound.playKey();
    setInput('');
  };

  const handleCheck = async () => {
    if (isSuccessLocked) return;

    // If answer was already revealed via Skip, Check advances to next problem
    if (revealedProduct !== null) {
      nextProblem();
      return;
    }

    if (!input) {
      setStatus({
        message: 'Please enter an answer first',
        variant: 'amber',
      });
      return;
    }

    const val = parseInt(input, 10);
    if (val === problem.product) {
      // Correct answer
      sound.playSuccess();
      setIsSuccessLocked(true);
      const nextState = onCorrect(state);
      setState(nextState);

      // Persist totals & best
      await Promise.all([
        setInt(STORAGE_KEYS.evenFactorsSolvedTotal, nextState.solvedTotal),
        setInt(STORAGE_KEYS.evenFactorsStreakBest, nextState.bestStreak),
      ]);

      setStatus({
        message: `Correct! ${problem.a} × ${problem.b} = ${problem.product}`,
        variant: 'success',
      });

      nextTimerRef.current = setTimeout(() => {
        nextProblem();
      }, 1200);
    } else {
      // Wrong answer
      sound.playError();
      const nextState = onWrongOrSkip(state);
      setState(nextState);
      setInput('');
      setStatus({
        message: 'Not quite — try again',
        variant: 'error',
      });
    }
  };

  const handleSkip = () => {
    if (isSuccessLocked) return;

    if (revealedProduct !== null) {
      // Already skipped, pressing skip again advances
      nextProblem();
      return;
    }

    sound.playKey();
    const nextState = onWrongOrSkip(state);
    setState(nextState);
    setRevealedProduct(problem.product);
    setStatus({
      message: `${problem.a} × ${problem.b} = ${problem.product}`,
      variant: 'purple',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <GameHeader
        title="Even Factors"
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Mode Selector */}
        <View style={styles.modeRow}>
          {MODES.map((m) => {
            const isSelected = mode === m.key;
            return (
              <Pressable
                key={m.key}
                onPress={() => handleModeChange(m.key)}
                style={({ pressed }) => [
                  styles.modeButton,
                  isSelected && styles.modeButtonSelected,
                  pressed && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Mode: ${m.label}`}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    isSelected && styles.modeButtonTextSelected,
                  ]}
                >
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Solved</Text>
            <Text style={styles.statValue}>{state.solvedTotal}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Streak</Text>
            <Text style={styles.statValue}>{state.currentStreak}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Best</Text>
            <Text style={styles.statValue}>{state.bestStreak}</Text>
          </View>
        </View>

        {/* Status Banner */}
        <StatusBanner message={status.message} variant={status.variant} />

        {/* Problem & Answer Card */}
        <View
          style={[
            styles.problemCard,
            status.variant === 'success' && styles.problemCardSuccess,
          ]}
        >
          <Text style={styles.problemFactors}>
            {problem.a} × {problem.b}
          </Text>
          <View style={styles.answerRow}>
            <Text style={styles.equalsSign}>=</Text>
            <Text
              style={[
                styles.answerValue,
                revealedProduct !== null && styles.answerRevealed,
                status.variant === 'success' && styles.answerSuccess,
              ]}
            >
              {revealedProduct !== null
                ? revealedProduct
                : input.length > 0
                ? input
                : '?'}
            </Text>
          </View>
        </View>

        {/* Numpad */}
        <View style={styles.numpadContainer}>
          <View style={styles.numpadGrid}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <Pressable
                key={digit}
                onPress={() => handleDigit(String(digit))}
                style={({ pressed }) => [
                  styles.numKey,
                  pressed && styles.numKeyPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={String(digit)}
              >
                <Text style={styles.numKeyText}>{digit}</Text>
              </Pressable>
            ))}

            <Pressable
              onPress={handleClear}
              style={({ pressed }) => [
                styles.numKey,
                styles.actionKey,
                pressed && styles.numKeyPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Clear"
            >
              <Text style={styles.actionKeyText}>C</Text>
            </Pressable>

            <Pressable
              onPress={() => handleDigit('0')}
              style={({ pressed }) => [
                styles.numKey,
                pressed && styles.numKeyPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="0"
            >
              <Text style={styles.numKeyText}>0</Text>
            </Pressable>

            <Pressable
              onPress={handleBackspace}
              style={({ pressed }) => [
                styles.numKey,
                styles.actionKey,
                pressed && styles.numKeyPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Backspace"
            >
              <Text style={styles.actionKeyText}>⌫</Text>
            </Pressable>
          </View>

          {/* Action Row: Check & Skip */}
          <View style={styles.bottomActions}>
            <Pressable
              onPress={handleSkip}
              style={({ pressed }) => [
                styles.skipButton,
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={revealedProduct !== null ? 'Next Problem' : 'Skip Problem'}
            >
              <Text style={styles.skipButtonText}>
                {revealedProduct !== null ? 'Next →' : 'Skip'}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleCheck}
              style={({ pressed }) => [
                styles.checkButton,
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={revealedProduct !== null ? 'Next Problem' : 'Check Answer'}
            >
              <Text style={styles.checkButtonText}>
                {revealedProduct !== null ? 'Next →' : 'Check'}
              </Text>
            </Pressable>
          </View>
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
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    width: '100%',
    maxWidth: 360,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeButtonSelected: {
    backgroundColor: '#0f2418',
    borderColor: colors.emerald,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  modeButtonText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  modeButtonTextSelected: {
    color: colors.emerald,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    width: '100%',
    maxWidth: 360,
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
  problemCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  problemCardSuccess: {
    borderColor: colors.emerald,
  },
  problemFactors: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 1,
    marginBottom: 8,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  equalsSign: {
    fontSize: 28,
    color: colors.muted,
    fontWeight: '600',
  },
  answerValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 1,
  },
  answerRevealed: {
    color: colors.purple,
  },
  answerSuccess: {
    color: colors.emerald,
  },
  numpadContainer: {
    width: '100%',
    maxWidth: 360,
  },
  numpadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  numKey: {
    width: '30.5%',
    aspectRatio: 1.5,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numKeyPressed: {
    backgroundColor: '#21262d',
    borderColor: colors.emerald,
  },
  numKeyText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  actionKey: {
    backgroundColor: '#1b2028',
  },
  actionKeyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.muted,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: '600',
  },
  checkButton: {
    flex: 2,
    backgroundColor: colors.emerald,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonText: {
    color: '#0d1117',
    fontSize: 16,
    fontWeight: '700',
  },
});

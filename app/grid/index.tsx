import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { GameHeader } from '@/components/GameHeader';
import { StatusBanner, StatusVariant } from '@/components/StatusBanner';
import { SummaryCard } from '@/components/SummaryCard';
import {
  generateTargetPattern,
  flashDuration,
  evaluateSelection,
} from '@/games/grid/engine';
import { GridCellIndex, CellVisualState } from '@/games/grid/types';
import { getInt, setInt } from '@/storage/asyncStore';
import { STORAGE_KEYS } from '@/storage/keys';
import { sound } from '@/audio/sound';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function GridScreen() {
  const [currentLength, setCurrentLength] = useState<number>(3);
  const [bestLength, setBestLength] = useState<number>(0);
  const [cellStates, setCellStates] = useState<Record<GridCellIndex, CellVisualState>>(() => {
    const initial: Record<number, CellVisualState> = {};
    for (let i = 0; i < 16; i++) initial[i] = 'idle';
    return initial as Record<GridCellIndex, CellVisualState>;
  });
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isGameActive, setIsGameActive] = useState<boolean>(false);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [status, setStatus] = useState<{ message: string; variant: StatusVariant }>({
    message: 'Press Start to begin',
    variant: 'idle',
  });

  const isMountedRef = useRef<boolean>(true);
  const activeRoundRef = useRef<number>(0);

  // Mutable refs to track targets & selections during fast async transitions
  const targetCellsRef = useRef<Set<GridCellIndex>>(new Set());
  const selectedCellsRef = useRef<Set<GridCellIndex>>(new Set());
  const currentLengthRef = useRef<number>(3);
  const bestLengthRef = useRef<number>(0);

  currentLengthRef.current = currentLength;
  bestLengthRef.current = bestLength;

  useEffect(() => {
    isMountedRef.current = true;
    (async () => {
      const savedBest = await getInt(STORAGE_KEYS.gridBest, 0);
      await sound.load();
      if (isMountedRef.current) {
        setBestLength(savedBest);
        bestLengthRef.current = savedBest;
        setSoundEnabled(sound.enabled);
      }
    })();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleToggleSound = async () => {
    const nextVal = await sound.toggle();
    setSoundEnabled(nextVal);
  };

  const playRound = useCallback(async (length: number, roundId: number) => {
    setIsFlashing(true);
    setIsEvaluating(false);
    selectedCellsRef.current.clear();

    const targets = generateTargetPattern(length);
    targetCellsRef.current = targets;

    // Reset cell states to idle
    const idleStates: Record<number, CellVisualState> = {};
    for (let i = 0; i < 16; i++) idleStates[i] = 'idle';
    setCellStates(idleStates as Record<GridCellIndex, CellVisualState>);

    setStatus({
      message: `Memorize pattern (${length} cells)...`,
      variant: 'amber',
    });

    await sleep(400);
    if (!isMountedRef.current || activeRoundRef.current !== roundId) return;

    // Flash target cells
    const flashStates: Record<number, CellVisualState> = {};
    for (let i = 0; i < 16; i++) {
      flashStates[i] = targets.has(i as GridCellIndex) ? 'flash' : 'idle';
    }
    setCellStates(flashStates as Record<GridCellIndex, CellVisualState>);
    sound.playKey();

    const duration = flashDuration(length);
    await sleep(duration);
    if (!isMountedRef.current || activeRoundRef.current !== roundId) return;

    // Unflash
    setCellStates(idleStates as Record<GridCellIndex, CellVisualState>);
    setIsFlashing(false);
    setStatus({
      message: `Tap ${length} cells (0/${length} selected)`,
      variant: 'idle',
    });
  }, []);

  const startGame = useCallback(() => {
    sound.load();
    const newRoundId = activeRoundRef.current + 1;
    activeRoundRef.current = newRoundId;

    setCurrentLength(3);
    currentLengthRef.current = 3;
    setIsGameActive(true);
    setShowSummary(false);

    playRound(3, newRoundId);
  }, [playRound]);

  const handleCellPress = async (cellIdx: GridCellIndex) => {
    if (!isGameActive || isFlashing || isEvaluating) return;

    const roundId = activeRoundRef.current;
    const currentLen = currentLengthRef.current;
    const selected = selectedCellsRef.current;
    const targets = targetCellsRef.current;

    if (selected.has(cellIdx)) {
      // Deselect
      selected.delete(cellIdx);
      sound.playKey();
    } else {
      // Select
      if (selected.size >= currentLen) return;
      selected.add(cellIdx);
      sound.playKey();
    }

    // Update UI selected states
    const updatedStates: Record<number, CellVisualState> = {};
    for (let i = 0; i < 16; i++) {
      updatedStates[i] = selected.has(i as GridCellIndex) ? 'selected' : 'idle';
    }
    setCellStates(updatedStates as Record<GridCellIndex, CellVisualState>);
    setStatus({
      message: `Tap ${currentLen} cells (${selected.size}/${currentLen} selected)`,
      variant: 'idle',
    });

    // When full target count selected, evaluate pattern
    if (selected.size === currentLen) {
      setIsEvaluating(true);

      const isMatch = evaluateSelection(targets, selected);

      if (isMatch) {
        // Success: all selected cells turn emerald correct
        const matchStates: Record<number, CellVisualState> = {};
        for (let i = 0; i < 16; i++) {
          matchStates[i] = selected.has(i as GridCellIndex) ? 'correct' : 'idle';
        }
        setCellStates(matchStates as Record<GridCellIndex, CellVisualState>);
        sound.playSuccess();
        setStatus({ message: 'Pattern Matched!', variant: 'success' });

        if (currentLen > bestLengthRef.current) {
          setBestLength(currentLen);
          bestLengthRef.current = currentLen;
          await setInt(STORAGE_KEYS.gridBest, currentLen);
        }

        await sleep(850);
        if (!isMountedRef.current || activeRoundRef.current !== roundId) return;

        const nextLen = currentLen + 1;
        setCurrentLength(nextLen);
        currentLengthRef.current = nextLen;
        playRound(nextLen, roundId);
      } else {
        // Mistake / Fail: highlight correct, wrong, missed
        setIsGameActive(false);
        setIsEvaluating(false);
        sound.playError();
        setStatus({ message: 'Incorrect pattern', variant: 'error' });

        const failStates: Record<number, CellVisualState> = {};
        for (let i = 0; i < 16; i++) {
          const idx = i as GridCellIndex;
          if (selected.has(idx)) {
            failStates[idx] = targets.has(idx) ? 'correct' : 'wrong';
          } else if (targets.has(idx)) {
            failStates[idx] = 'missed';
          } else {
            failStates[idx] = 'idle';
          }
        }
        setCellStates(failStates as Record<GridCellIndex, CellVisualState>);

        await sleep(800);
        if (!isMountedRef.current || activeRoundRef.current !== roundId) return;

        setShowSummary(true);
      }
    }
  };

  const isBoardDisabled = !isGameActive || isFlashing || isEvaluating;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <GameHeader
        title="Spatial Grid"
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
            <Text style={styles.statLabel}>Cells</Text>
            <Text style={styles.statValue}>{currentLength}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Best</Text>
            <Text style={styles.statValue}>{bestLength}</Text>
          </View>
        </View>

        {/* Status Banner */}
        <StatusBanner message={status.message} variant={status.variant} />

        {/* 4x4 Grid Board */}
        <View style={styles.boardContainer}>
          {[0, 1, 2, 3].map((row) => (
            <View key={row} style={styles.boardRow}>
              {[0, 1, 2, 3].map((col) => {
                const cellIdx = (row * 4 + col) as GridCellIndex;
                const state = cellStates[cellIdx];

                return (
                  <Pressable
                    key={cellIdx}
                    onPress={() => handleCellPress(cellIdx)}
                    disabled={isBoardDisabled}
                    style={({ pressed }) => [
                      styles.cell,
                      state === 'idle' && styles.cellIdle,
                      state === 'flash' && styles.cellFlash,
                      state === 'selected' && styles.cellSelected,
                      state === 'correct' && styles.cellCorrect,
                      state === 'wrong' && styles.cellWrong,
                      state === 'missed' && styles.cellMissed,
                      pressed && !isBoardDisabled && styles.cellPressed,
                      isBoardDisabled && styles.cellDisabled,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Cell ${cellIdx + 1}, ${state}`}
                    accessibilityState={{ disabled: isBoardDisabled }}
                  />
                );
              })}
            </View>
          ))}
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
          <SummaryCard
            title="Round Ended"
            subtitle="Here is your performance summary:"
            stats={[
              { label: 'Cells Reached', value: currentLength, highlightColor: colors.amber },
              { label: 'Personal Best', value: bestLength },
            ]}
            actionLabel="Play Again"
            onAction={startGame}
            actionColor={colors.amber}
          />
        )}

        {/* How It Works Card */}
        <View style={styles.rulesCard}>
          <Text style={styles.rulesTitle}>How It Works</Text>
          <Text style={styles.rulesBody}>
            Memorize the highlighted amber tiles when they flash. Once they disappear, tap the grid to recall their exact positions. Each successful pattern increases the number of tiles by one.
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
    gap: 8,
  },
  boardRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  cell: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellIdle: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  cellFlash: {
    backgroundColor: colors.amber,
    borderColor: '#fef08a',
    shadowColor: colors.amber,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 8,
  },
  cellSelected: {
    backgroundColor: 'rgba(251, 191, 36, 0.28)',
    borderColor: colors.amber,
    shadowColor: colors.amber,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  cellCorrect: {
    backgroundColor: '#0d2818',
    borderColor: colors.emerald,
    shadowColor: colors.emerald,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  cellWrong: {
    backgroundColor: '#2d1214',
    borderColor: colors.red,
    shadowColor: colors.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  cellMissed: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderColor: colors.amber,
    borderStyle: 'dashed',
  },
  cellPressed: {
    transform: [{ scale: 0.94 }],
  },
  cellDisabled: {
    opacity: 0.9,
  },
  actionArea: {
    width: '100%',
    maxWidth: 340,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: colors.amber,
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
  amberValue: {
    color: colors.amber,
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

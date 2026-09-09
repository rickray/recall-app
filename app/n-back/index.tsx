import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { GameHeader } from '@/components/GameHeader';
import { StatusBanner, StatusVariant } from '@/components/StatusBanner';
import { SummaryCard } from '@/components/SummaryCard';
import { generateTrials } from '@/games/n-back/generate';
import { scoreRound, calculateLiveScores } from '@/games/n-back/score';
import {
  NBackLevel,
  CellIndex,
  TrialResponse,
  NBackScoreResult,
  LiveScores,
} from '@/games/n-back/types';
import { getInt, setInt } from '@/storage/asyncStore';
import { STORAGE_KEYS } from '@/storage/keys';
import { sound } from '@/audio/sound';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const N_LEVELS: { n: NBackLevel; label: string; trialsCount: number }[] = [
  { n: 1, label: '1-Back', trialsCount: 21 },
  { n: 2, label: '2-Back', trialsCount: 22 },
];

export default function NBackScreen() {
  const [nLevel, setNLevel] = useState<NBackLevel>(1);
  const [trials, setTrials] = useState<CellIndex[]>([]);
  const [currentTrialIdx, setCurrentTrialIdx] = useState<number>(-1);
  const [activeCell, setActiveCell] = useState<CellIndex | null>(null);
  const [isRoundActive, setIsRoundActive] = useState<boolean>(false);
  const [hasRespondedThisTrial, setHasRespondedThisTrial] = useState<boolean>(false);
  const [trialResponses, setTrialResponses] = useState<TrialResponse[]>([]);
  const [liveScores, setLiveScores] = useState<LiveScores>({ hits: 0, falseAlarms: 0 });
  const [bestAccuracy, setBestAccuracy] = useState<number | null>(null);
  const [summary, setSummary] = useState<NBackScoreResult | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [status, setStatus] = useState<{ message: string; variant: StatusVariant }>({
    message: 'Press Start Round to begin',
    variant: 'idle',
  });

  const totalTrials = 20 + nLevel;

  const isMountedRef = useRef<boolean>(true);
  const activeRoundRef = useRef<number>(0);
  const trialTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stimulusTimerRef = useRef<NodeJS.Timeout | null>(null);

  // References to keep state available in timeout callbacks
  const trialsRef = useRef<CellIndex[]>([]);
  const responsesRef = useRef<TrialResponse[]>([]);
  const hasRespondedRef = useRef<boolean>(false);
  const currentTrialIdxRef = useRef<number>(-1);
  const nLevelRef = useRef<NBackLevel>(1);

  trialsRef.current = trials;
  responsesRef.current = trialResponses;
  hasRespondedRef.current = hasRespondedThisTrial;
  currentTrialIdxRef.current = currentTrialIdx;
  nLevelRef.current = nLevel;

  const loadBestScoreForN = useCallback(async (n: NBackLevel) => {
    const saved = await getInt(STORAGE_KEYS.nbackBest(n), -1);
    if (isMountedRef.current) {
      setBestAccuracy(saved >= 0 ? saved : null);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    (async () => {
      await sound.load();
      if (isMountedRef.current) {
        setSoundEnabled(sound.enabled);
      }
      await loadBestScoreForN(1);
    })();

    return () => {
      isMountedRef.current = false;
      if (trialTimerRef.current) clearTimeout(trialTimerRef.current);
      if (stimulusTimerRef.current) clearTimeout(stimulusTimerRef.current);
    };
  }, [loadBestScoreForN]);

  const handleToggleSound = async () => {
    const nextVal = await sound.toggle();
    setSoundEnabled(nextVal);
  };

  const handleNChange = async (newN: NBackLevel) => {
    if (isRoundActive || newN === nLevel) return;
    setNLevel(newN);
    setSummary(null);
    setStatus({ message: 'Press Start Round to begin', variant: 'idle' });
    setLiveScores({ hits: 0, falseAlarms: 0 });
    setCurrentTrialIdx(-1);
    setActiveCell(null);
    await loadBestScoreForN(newN);
  };

  const finishRound = useCallback(
    async (roundId: number) => {
      if (!isMountedRef.current || activeRoundRef.current !== roundId) return;

      setIsRoundActive(false);
      setActiveCell(null);
      if (trialTimerRef.current) clearTimeout(trialTimerRef.current);
      if (stimulusTimerRef.current) clearTimeout(stimulusTimerRef.current);

      const currentTrials = trialsRef.current;
      const currentResponses = responsesRef.current;
      const currentN = nLevelRef.current;

      const result = scoreRound(currentN, currentTrials, currentResponses);
      setSummary(result);
      sound.playSuccess();

      setStatus({
        message: `Round Complete! Accuracy: ${result.accuracy}%`,
        variant: 'success',
      });

      // Update best accuracy if higher
      const currentBest = await getInt(STORAGE_KEYS.nbackBest(currentN), -1);
      if (result.accuracy > currentBest) {
        await setInt(STORAGE_KEYS.nbackBest(currentN), result.accuracy);
        setBestAccuracy(result.accuracy);
      }
    },
    []
  );

  const runTrial = useCallback(
    (trialIdx: number, roundId: number) => {
      if (!isMountedRef.current || activeRoundRef.current !== roundId) return;

      const currentTotalTrials = 20 + nLevelRef.current;
      if (trialIdx >= currentTotalTrials) {
        finishRound(roundId);
        return;
      }

      setCurrentTrialIdx(trialIdx);
      setHasRespondedThisTrial(false);
      hasRespondedRef.current = false;

      const cellIdx = trialsRef.current[trialIdx];
      setActiveCell(cellIdx);
      sound.playKey();

      if (trialIdx < nLevelRef.current) {
        setStatus({
          message: `Trial ${trialIdx + 1} of ${currentTotalTrials}: Memorize position...`,
          variant: 'purple',
        });
      } else {
        setStatus({
          message: `Trial ${trialIdx + 1} of ${currentTotalTrials}: Match or Different?`,
          variant: 'idle',
        });
      }

      // Stimulus 850ms visible
      stimulusTimerRef.current = setTimeout(() => {
        if (!isMountedRef.current || activeRoundRef.current !== roundId) return;
        setActiveCell(null);
      }, 850);

      // Interval 1500ms total per trial
      trialTimerRef.current = setTimeout(() => {
        if (!isMountedRef.current || activeRoundRef.current !== roundId) return;

        // If user didn't respond in evaluation trial, record null
        if (trialIdx >= nLevelRef.current && !hasRespondedRef.current) {
          responsesRef.current[trialIdx] = null;
          setTrialResponses([...responsesRef.current]);
        }

        runTrial(trialIdx + 1, roundId);
      }, 1500);
    },
    [finishRound]
  );

  const startRound = useCallback(async () => {
    sound.load();
    const newRoundId = activeRoundRef.current + 1;
    activeRoundRef.current = newRoundId;

    if (trialTimerRef.current) clearTimeout(trialTimerRef.current);
    if (stimulusTimerRef.current) clearTimeout(stimulusTimerRef.current);

    const generated = generateTrials(nLevel);
    const initialResponses: TrialResponse[] = new Array(20 + nLevel).fill(null);

    setTrials(generated);
    setTrialResponses(initialResponses);
    trialsRef.current = generated;
    responsesRef.current = initialResponses;

    setIsRoundActive(true);
    setSummary(null);
    setCurrentTrialIdx(-1);
    setActiveCell(null);
    setLiveScores({ hits: 0, falseAlarms: 0 });
    setHasRespondedThisTrial(false);

    setStatus({ message: 'Get ready...', variant: 'purple' });

    await sleep(800);
    if (!isMountedRef.current || activeRoundRef.current !== newRoundId) return;

    runTrial(0, newRoundId);
  }, [nLevel, runTrial]);

  const handleResponse = (isMatch: boolean) => {
    if (!isRoundActive || hasRespondedThisTrial || currentTrialIdx < nLevel) return;

    setHasRespondedThisTrial(true);
    hasRespondedRef.current = true;
    sound.playKey();

    responsesRef.current[currentTrialIdx] = isMatch;
    setTrialResponses([...responsesRef.current]);

    const updatedScores = calculateLiveScores(
      nLevel,
      trialsRef.current,
      responsesRef.current,
      currentTrialIdx
    );
    setLiveScores(updatedScores);
  };

  const isControlDisabled = !isRoundActive || hasRespondedThisTrial || currentTrialIdx < nLevel;
  const progressPercent =
    currentTrialIdx >= 0 ? Math.min(100, ((currentTrialIdx + 1) / totalTrials) * 100) : 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <GameHeader
        title="N-back"
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* N-Level Selector */}
        <View style={styles.levelRow}>
          {N_LEVELS.map((item) => {
            const isSelected = nLevel === item.n;
            return (
              <Pressable
                key={item.n}
                onPress={() => handleNChange(item.n)}
                disabled={isRoundActive}
                style={({ pressed }) => [
                  styles.levelButton,
                  isSelected && styles.levelButtonSelected,
                  isRoundActive && !isSelected && styles.levelButtonDisabled,
                  pressed && !isRoundActive && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${item.label} mode`}
                accessibilityState={{ selected: isSelected, disabled: isRoundActive }}
              >
                <Text
                  style={[
                    styles.levelButtonText,
                    isSelected && styles.levelButtonTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Trial</Text>
            <Text style={styles.statValue}>
              {currentTrialIdx >= 0 ? `${currentTrialIdx + 1}/${totalTrials}` : `0/${totalTrials}`}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Hits</Text>
            <Text style={[styles.statValue, styles.emeraldValue]}>{liveScores.hits}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>FA</Text>
            <Text style={[styles.statValue, styles.redValue]}>{liveScores.falseAlarms}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Best</Text>
            <Text style={styles.statValue}>
              {bestAccuracy !== null ? `${bestAccuracy}%` : '--'}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
        </View>

        {/* Status Banner */}
        <StatusBanner message={status.message} variant={status.variant} />

        {/* 3x3 Grid Board */}
        <View style={styles.boardContainer}>
          {[0, 1, 2].map((row) => (
            <View key={row} style={styles.boardRow}>
              {[0, 1, 2].map((col) => {
                const cellIdx = (row * 3 + col) as CellIndex;
                const isActive = activeCell === cellIdx;
                return (
                  <View
                    key={cellIdx}
                    style={[
                      styles.cell,
                      isActive && styles.cellActive,
                    ]}
                    accessibilityLabel={`Cell ${cellIdx + 1}`}
                  />
                );
              })}
            </View>
          ))}
        </View>

        {/* Action Controls: Match & No Match */}
        {isRoundActive && (
          <View style={styles.controlsRow}>
            <Pressable
              onPress={() => handleResponse(true)}
              disabled={isControlDisabled}
              style={({ pressed }) => [
                styles.matchButton,
                isControlDisabled && styles.controlButtonDisabled,
                pressed && !isControlDisabled && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Match position N steps back"
              accessibilityState={{ disabled: isControlDisabled }}
            >
              <Text style={styles.matchButtonText}>Match</Text>
              <Text style={styles.buttonSubtext}>
                {nLevel === 1 ? 'Same as 1 step back' : 'Same as 2 steps back'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleResponse(false)}
              disabled={isControlDisabled}
              style={({ pressed }) => [
                styles.noMatchButton,
                isControlDisabled && styles.controlButtonDisabled,
                pressed && !isControlDisabled && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="No Match position N steps back"
              accessibilityState={{ disabled: isControlDisabled }}
            >
              <Text style={styles.noMatchButtonText}>No Match</Text>
              <Text style={styles.buttonSubtext}>Different position</Text>
            </Pressable>
          </View>
        )}

        {/* Start Button */}
        {!isRoundActive && !summary && (
          <View style={styles.actionArea}>
            <Pressable
              onPress={startRound}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Start Round (${totalTrials} Trials)`}
            >
              <Text style={styles.primaryButtonText}>
                Start Round ({totalTrials} Trials)
              </Text>
            </Pressable>
          </View>
        )}

        {/* Summary Card */}
        {summary && (
          <SummaryCard
            title="Round Complete"
            subtitle={`Accuracy: ${summary.accuracy}% (20 test trials)`}
            stats={[
              { label: 'Accuracy', value: `${summary.accuracy}%`, highlightColor: colors.purple },
              { label: 'Hits', value: `${summary.hits}/${summary.totalTargets}`, highlightColor: colors.emerald },
              { label: 'False Alarms', value: summary.falseAlarms, highlightColor: colors.red },
              { label: 'Correct Rejections', value: `${summary.correctRejections}/${summary.totalNonTargets}` },
            ]}
            actionLabel="Play Again"
            onAction={startRound}
            actionColor={colors.purple}
          />
        )}

        {/* Rules Card */}
        <View style={styles.rulesCard}>
          <Text style={styles.rulesTitle}>How It Works</Text>
          <Text style={styles.rulesBody}>
            A cell lights up each trial. Tap{' '}
            <Text style={styles.rulesBold}>Match</Text> if the lit cell is in the exact
            same location as <Text style={styles.rulesBold}>{nLevel} step{nLevel > 1 ? 's' : ''} earlier</Text>.
            Tap <Text style={styles.rulesBold}>No Match</Text> if it is different. A standard round consists of 20 test trials following {nLevel} warmup trial{nLevel > 1 ? 's' : ''}.
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
  levelRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    width: '100%',
    maxWidth: 340,
  },
  levelButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  levelButtonSelected: {
    backgroundColor: '#201633',
    borderColor: colors.purple,
  },
  levelButtonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
  levelButtonText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  levelButtonTextSelected: {
    color: colors.purple,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
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
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  emeraldValue: {
    color: colors.emerald,
  },
  redValue: {
    color: colors.red,
  },
  purpleValue: {
    color: colors.purple,
  },
  progressTrack: {
    width: '100%',
    maxWidth: 340,
    height: 6,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.purple,
  },
  boardContainer: {
    width: '100%',
    maxWidth: 330,
    aspectRatio: 1,
    marginBottom: 20,
    gap: 10,
  },
  boardRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  cell: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1.5,
    borderRadius: 12,
  },
  cellActive: {
    backgroundColor: colors.purple,
    borderColor: '#d8b4fe',
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 14,
    elevation: 8,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    maxWidth: 340,
    marginBottom: 20,
  },
  matchButton: {
    flex: 1,
    minHeight: 58,
    backgroundColor: '#201633',
    borderColor: colors.purple,
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  matchButtonText: {
    color: '#f0f6fc',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  noMatchButton: {
    flex: 1,
    minHeight: 58,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  noMatchButtonText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  buttonSubtext: {
    fontSize: 11,
    color: colors.muted,
  },
  controlButtonDisabled: {
    opacity: 0.45,
  },
  actionArea: {
    width: '100%',
    maxWidth: 340,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: colors.purple,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
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
    flexWrap: 'wrap',
    width: '100%',
    gap: 10,
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  summaryItem: {
    width: '48%',
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  summaryItemLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryItemVal: {
    fontSize: 20,
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
  rulesBold: {
    fontWeight: '700',
    color: colors.text,
  },
});

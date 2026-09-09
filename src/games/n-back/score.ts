import {
  NBackLevel,
  CellIndex,
  TrialResponse,
  NBackScoreResult,
  LiveScores,
} from './types';

export function calculateLiveScores(
  n: NBackLevel,
  trials: CellIndex[],
  responses: TrialResponse[],
  currentTrialIdx: number
): LiveScores {
  let hits = 0;
  let falseAlarms = 0;

  for (let i = n; i <= currentTrialIdx; i++) {
    const resp = responses[i];
    if (resp === null) continue;

    const isTarget = trials[i] === trials[i - n];
    if (resp === true) {
      if (isTarget) {
        hits++;
      } else {
        falseAlarms++;
      }
    }
  }

  return { hits, falseAlarms };
}

export function scoreRound(
  n: NBackLevel,
  trials: CellIndex[],
  responses: TrialResponse[]
): NBackScoreResult {
  const totalTrials = 20 + n;
  let totalTargets = 0;
  let totalNonTargets = 0;
  let hits = 0;
  let falseAlarms = 0;
  let misses = 0;
  let correctRejections = 0;

  for (let i = n; i < totalTrials; i++) {
    const isTarget = trials[i] === trials[i - n];
    const resp = responses[i];

    if (isTarget) {
      totalTargets++;
      if (resp === true) {
        hits++;
      } else {
        misses++;
      }
    } else {
      totalNonTargets++;
      if (resp === true) {
        falseAlarms++;
      } else {
        correctRejections++;
      }
    }
  }

  const totalEvaluated = 20;
  const correctCount = hits + correctRejections;
  const accuracy = Math.round((correctCount / totalEvaluated) * 100);

  return {
    totalEvaluated,
    totalTargets,
    totalNonTargets,
    hits,
    falseAlarms,
    misses,
    correctRejections,
    accuracy,
  };
}

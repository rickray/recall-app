import { EvenFactorsState } from './types';

export { EvenFactorsState };

export function createInitialState(
  solvedTotal = 0,
  bestStreak = 0
): EvenFactorsState {
  return {
    solvedTotal,
    currentStreak: 0,
    bestStreak,
  };
}

export function onCorrect(s: EvenFactorsState): EvenFactorsState {
  const currentStreak = s.currentStreak + 1;
  return {
    solvedTotal: s.solvedTotal + 1,
    currentStreak,
    bestStreak: Math.max(s.bestStreak, currentStreak),
  };
}

export function onWrongOrSkip(s: EvenFactorsState): EvenFactorsState {
  return {
    ...s,
    currentStreak: 0,
  };
}

import { PadIndex, PressResult } from './types';

export { PadIndex, PressResult };

export function stepSpeed(len: number): number {
  return Math.max(220, 500 - len * 15);
}

export function gapSpeed(len: number): number {
  return Math.max(120, 250 - len * 8);
}

export function createInitialSequence(
  rng: () => number = Math.random
): PadIndex[] {
  return [Math.floor(rng() * 4) as PadIndex];
}

export function extendSequence(
  seq: PadIndex[],
  rng: () => number = Math.random
): PadIndex[] {
  return [...seq, Math.floor(rng() * 4) as PadIndex];
}

export function evaluatePress(
  sequence: PadIndex[],
  playerStep: number,
  padIndex: PadIndex
): PressResult {
  if (padIndex !== sequence[playerStep]) {
    return 'fail';
  }
  if (playerStep + 1 === sequence.length) {
    return 'level-complete';
  }
  return 'continue';
}

export function calculateNewBest(
  currentBest: number,
  completedLength: number
): number {
  return Math.max(currentBest, completedLength);
}

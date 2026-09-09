import { NBackLevel, CellIndex } from './types';

export function generateTrials(
  n: NBackLevel,
  rng: () => number = Math.random
): CellIndex[] {
  const list: CellIndex[] = [];
  const testTrialCount = 20;
  const targetMatchCount = Math.floor(testTrialCount * 0.33); // 6 matches
  let matchesCreated = 0;

  // Warmup trials (first N)
  for (let i = 0; i < n; i++) {
    list.push(Math.floor(rng() * 9) as CellIndex);
  }

  // Remaining 20 trials
  for (let i = n; i < 20 + n; i++) {
    const remainingTrials = 20 + n - i;
    const matchesNeeded = targetMatchCount - matchesCreated;
    const shouldMatch =
      matchesNeeded > 0 &&
      (rng() < (matchesNeeded / remainingTrials) * 1.5 ||
        remainingTrials <= matchesNeeded);

    if (shouldMatch) {
      list.push(list[i - n]);
      matchesCreated++;
    } else {
      let val: CellIndex;
      do {
        val = Math.floor(rng() * 9) as CellIndex;
      } while (val === list[i - n]);
      list.push(val);
    }
  }

  return list;
}

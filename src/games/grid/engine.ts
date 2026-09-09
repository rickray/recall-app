import { GridCellIndex } from './types';

export function generateTargetPattern(
  count: number,
  rng: () => number = Math.random
): Set<GridCellIndex> {
  const indices: GridCellIndex[] = [];
  while (indices.length < count) {
    const r = Math.floor(rng() * 16) as GridCellIndex;
    if (!indices.includes(r)) {
      indices.push(r);
    }
  }
  return new Set(indices);
}

export function flashDuration(length: number): number {
  return Math.min(1800, 750 + length * 120);
}

export function evaluateSelection(
  target: Set<GridCellIndex>,
  selected: Set<GridCellIndex>
): boolean {
  if (target.size !== selected.size) {
    return false;
  }
  for (const idx of selected) {
    if (!target.has(idx)) {
      return false;
    }
  }
  return true;
}

export function calculateNewBest(
  currentBest: number,
  completedLength: number
): number {
  return Math.max(currentBest, completedLength);
}

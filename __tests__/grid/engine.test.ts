import {
  generateTargetPattern,
  flashDuration,
  evaluateSelection,
  calculateNewBest,
} from '../../src/games/grid/engine';
import { GridCellIndex } from '../../src/games/grid/types';

describe('Spatial Grid engine', () => {
  describe('generateTargetPattern', () => {
    test('generates exact count of unique cell indices between 0 and 15', () => {
      for (const count of [3, 4, 5, 8, 12]) {
        const pattern = generateTargetPattern(count);
        expect(pattern.size).toBe(count);
        pattern.forEach((idx) => {
          expect(idx).toBeGreaterThanOrEqual(0);
          expect(idx).toBeLessThanOrEqual(15);
          expect(Number.isInteger(idx)).toBe(true);
        });
      }
    });

    test('supports custom deterministic RNG function', () => {
      let seed = 0.42;
      const deterministicRng = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };

      const p1 = generateTargetPattern(4, deterministicRng);
      seed = 0.42;
      const p2 = generateTargetPattern(4, deterministicRng);

      expect(Array.from(p1)).toEqual(Array.from(p2));
    });
  });

  describe('flashDuration', () => {
    test('calculates duration according to formula: Math.min(1800, 750 + length * 120)', () => {
      expect(flashDuration(3)).toBe(750 + 3 * 120); // 1110ms
      expect(flashDuration(4)).toBe(750 + 4 * 120); // 1230ms
      expect(flashDuration(8)).toBe(750 + 8 * 120); // 1710ms
      expect(flashDuration(9)).toBe(1800); // 750 + 1080 = 1830 -> 1800ms
      expect(flashDuration(15)).toBe(1800); // capped at 1800ms
    });
  });

  describe('evaluateSelection', () => {
    test('returns true when selected set matches target set exactly', () => {
      const target: Set<GridCellIndex> = new Set([0, 5, 10]);
      const selected: Set<GridCellIndex> = new Set([0, 5, 10]);

      expect(evaluateSelection(target, selected)).toBe(true);
    });

    test('returns false when selected set has different indices', () => {
      const target: Set<GridCellIndex> = new Set([0, 5, 10]);
      const selected: Set<GridCellIndex> = new Set([0, 5, 11]);

      expect(evaluateSelection(target, selected)).toBe(false);
    });

    test('returns false when selected set is different size than target set', () => {
      const target: Set<GridCellIndex> = new Set([0, 5, 10]);
      const selectedSubset: Set<GridCellIndex> = new Set([0, 5]);
      const selectedSuperset: Set<GridCellIndex> = new Set([0, 5, 10, 15]);

      expect(evaluateSelection(target, selectedSubset)).toBe(false);
      expect(evaluateSelection(target, selectedSuperset)).toBe(false);
    });
  });

  describe('calculateNewBest', () => {
    test('updates best when currentLength exceeds currentBest', () => {
      expect(calculateNewBest(0, 3)).toBe(3);
      expect(calculateNewBest(4, 5)).toBe(5);
      expect(calculateNewBest(5, 3)).toBe(5);
      expect(calculateNewBest(5, 5)).toBe(5);
    });
  });
});

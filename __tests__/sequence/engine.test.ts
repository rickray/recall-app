import {
  createInitialSequence,
  extendSequence,
  evaluatePress,
  stepSpeed,
  gapSpeed,
  calculateNewBest,
} from '../../src/games/sequence/engine';
import { PadIndex } from '../../src/games/sequence/types';

describe('Sequence engine', () => {
  describe('createInitialSequence', () => {
    test('creates a single-element sequence with pad index in 0..3', () => {
      const mockRng = () => 0.75; // floor(0.75 * 4) = 3
      const seq = createInitialSequence(mockRng);
      expect(seq).toEqual([3]);
    });

    test('works with default random generator', () => {
      for (let i = 0; i < 20; i++) {
        const seq = createInitialSequence();
        expect(seq.length).toBe(1);
        expect([0, 1, 2, 3]).toContain(seq[0]);
      }
    });
  });

  describe('extendSequence', () => {
    test('appends a new pad index to the sequence without mutating original', () => {
      const original: PadIndex[] = [0, 1];
      const mockRng = () => 0.5; // floor(0.5 * 4) = 2
      const next = extendSequence(original, mockRng);

      expect(next).toEqual([0, 1, 2]);
      expect(original).toEqual([0, 1]);
    });
  });

  describe('stepSpeed', () => {
    test('calculates speed based on length: Math.max(220, 500 - len * 15)', () => {
      expect(stepSpeed(1)).toBe(485);
      expect(stepSpeed(2)).toBe(470);
      expect(stepSpeed(10)).toBe(350);
      expect(stepSpeed(18)).toBe(230);
      expect(stepSpeed(20)).toBe(220); // 500 - 300 = 200, clamped to 220
      expect(stepSpeed(100)).toBe(220);
    });
  });

  describe('gapSpeed', () => {
    test('calculates gap speed based on length: Math.max(120, 250 - len * 8)', () => {
      expect(gapSpeed(1)).toBe(242);
      expect(gapSpeed(2)).toBe(234);
      expect(gapSpeed(10)).toBe(170);
      expect(gapSpeed(16)).toBe(122);
      expect(gapSpeed(20)).toBe(120); // 250 - 160 = 90, clamped to 120
      expect(gapSpeed(100)).toBe(120);
    });
  });

  describe('evaluatePress', () => {
    test('returns "continue" when matching an intermediate step', () => {
      const seq: PadIndex[] = [1, 2, 3];
      expect(evaluatePress(seq, 0, 1)).toBe('continue');
      expect(evaluatePress(seq, 1, 2)).toBe('continue');
    });

    test('returns "level-complete" when matching the final step of sequence', () => {
      const seq1: PadIndex[] = [0];
      expect(evaluatePress(seq1, 0, 0)).toBe('level-complete');

      const seq3: PadIndex[] = [1, 2, 3];
      expect(evaluatePress(seq3, 2, 3)).toBe('level-complete');
    });

    test('returns "fail" when pad index does not match the expected step', () => {
      const seq: PadIndex[] = [0, 1, 2];
      expect(evaluatePress(seq, 0, 1)).toBe('fail');
      expect(evaluatePress(seq, 0, 2)).toBe('fail');
      expect(evaluatePress(seq, 0, 3)).toBe('fail');
      expect(evaluatePress(seq, 1, 0)).toBe('fail');
    });
  });

  describe('calculateNewBest', () => {
    test('updates best when completedLength exceeds currentBest', () => {
      expect(calculateNewBest(0, 1)).toBe(1);
      expect(calculateNewBest(3, 5)).toBe(5);
      expect(calculateNewBest(5, 3)).toBe(5);
      expect(calculateNewBest(5, 5)).toBe(5);
    });
  });
});

import { generateTrials } from '../../src/games/n-back/generate';
import { NBackLevel } from '../../src/games/n-back/types';

describe('N-back generateTrials', () => {
  describe('sequence length', () => {
    test('generates exactly 20 + N trials for N=1 (21 trials)', () => {
      const trials = generateTrials(1);
      expect(trials).toHaveLength(21);
      trials.forEach((cell) => {
        expect(cell).toBeGreaterThanOrEqual(0);
        expect(cell).toBeLessThanOrEqual(8);
        expect(Number.isInteger(cell)).toBe(true);
      });
    });

    test('generates exactly 20 + N trials for N=2 (22 trials)', () => {
      const trials = generateTrials(2);
      expect(trials).toHaveLength(22);
      trials.forEach((cell) => {
        expect(cell).toBeGreaterThanOrEqual(0);
        expect(cell).toBeLessThanOrEqual(8);
        expect(Number.isInteger(cell)).toBe(true);
      });
    });
  });

  describe('warmup trials and non-match constraints', () => {
    test('non-matching test trials are never equal to trial[i - N]', () => {
      for (const n of [1, 2] as NBackLevel[]) {
        for (let run = 0; run < 30; run++) {
          const trials = generateTrials(n);
          for (let i = n; i < trials.length; i++) {
            const isMatch = trials[i] === trials[i - n];
            if (!isMatch) {
              expect(trials[i]).not.toBe(trials[i - n]);
            }
          }
        }
      }
    });

    test('generates approximately 30-35% matches over test trials (target ~6 matches per 20 test trials)', () => {
      let totalMatchesN1 = 0;
      let totalMatchesN2 = 0;
      const runs = 50;

      for (let r = 0; r < runs; r++) {
        const trials1 = generateTrials(1);
        for (let i = 1; i < 21; i++) {
          if (trials1[i] === trials1[i - 1]) totalMatchesN1++;
        }

        const trials2 = generateTrials(2);
        for (let i = 2; i < 22; i++) {
          if (trials2[i] === trials2[i - 2]) totalMatchesN2++;
        }
      }

      const avgMatchesN1 = totalMatchesN1 / runs;
      const avgMatchesN2 = totalMatchesN2 / runs;

      // Expect avg matches ~ 6 (between 5 and 7.5)
      expect(avgMatchesN1).toBeGreaterThanOrEqual(5);
      expect(avgMatchesN1).toBeLessThanOrEqual(7.5);

      expect(avgMatchesN2).toBeGreaterThanOrEqual(5);
      expect(avgMatchesN2).toBeLessThanOrEqual(7.5);
    });

    test('supports custom deterministic RNG function', () => {
      // Deterministic sequence
      let seed = 0.1;
      const deterministicRng = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };

      const trialsA = generateTrials(1, deterministicRng);
      seed = 0.1;
      const trialsB = generateTrials(1, deterministicRng);

      expect(trialsA).toEqual(trialsB);
    });
  });
});

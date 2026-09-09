import { scoreRound, calculateLiveScores } from '../../src/games/n-back/score';
import { NBackLevel, TrialResponse, CellIndex } from '../../src/games/n-back/types';

describe('N-back scoreRound', () => {
  test('calculates accuracy, hits, false alarms, misses, and correct rejections for N=1', () => {
    const n: NBackLevel = 1;
    // 21 trials: index 0 is warmup; test indices 1..20
    const trials: CellIndex[] = [
      0, // 0 warmup
      0, // 1 target (0===0)
      2, // 2 non-target (2!==0)
      2, // 3 target (2===2)
      4, // 4 non-target (4!==2)
      4, // 5 target (4===4)
      6, // 6 non-target (6!==4)
      6, // 7 target (6===6)
      8, // 8 non-target (8!==6)
      8, // 9 target (8===8)
      1, // 10 non-target (1!==8)
      1, // 11 target (1===1)
      3, // 12 non-target
      5, // 13 non-target
      7, // 14 non-target
      0, // 15 non-target
      2, // 16 non-target
      4, // 17 non-target
      6, // 18 non-target
      8, // 19 non-target
      1, // 20 non-target
    ];

    const responses: TrialResponse[] = [
      null, // 0 warmup
      true, // 1 -> hit (1)
      false, // 2 -> CR (1)
      true, // 3 -> hit (2)
      true, // 4 -> FA (1)
      null, // 5 -> miss (1)
      null, // 6 -> CR (2)
      false, // 7 -> miss (2)
      false, // 8 -> CR (3)
      true, // 9 -> hit (3)
      false, // 10 -> CR (4)
      true, // 11 -> hit (4)
      false, // 12 -> CR (5)
      false, // 13 -> CR (6)
      false, // 14 -> CR (7)
      false, // 15 -> CR (8)
      false, // 16 -> CR (9)
      false, // 17 -> CR (10)
      false, // 18 -> CR (11)
      false, // 19 -> CR (12)
      false, // 20 -> CR (13)
    ];

    const result = scoreRound(n, trials, responses);

    expect(result.totalEvaluated).toBe(20);
    expect(result.totalTargets).toBe(6);
    expect(result.totalNonTargets).toBe(14);
    expect(result.hits).toBe(4);
    expect(result.misses).toBe(2);
    expect(result.falseAlarms).toBe(1);
    expect(result.correctRejections).toBe(13);

    // correctCount = hits (4) + correctRejections (13) = 17
    // accuracy = round(17 / 20 * 100) = 85
    expect(result.accuracy).toBe(85);
  });

  test('perfect 100% round when all targets hit and non-targets rejected', () => {
    const n: NBackLevel = 2;
    // 22 trials: indices 0, 1 warmup; 2..21 test
    const trials: CellIndex[] = new Array(22).fill(0 as CellIndex);
    // Every trial is 0, so every test trial 2..21 (20 trials) is a target
    const responses: TrialResponse[] = new Array(22).fill(true);

    const result = scoreRound(n, trials, responses);
    expect(result.totalTargets).toBe(20);
    expect(result.totalNonTargets).toBe(0);
    expect(result.hits).toBe(20);
    expect(result.misses).toBe(0);
    expect(result.falseAlarms).toBe(0);
    expect(result.correctRejections).toBe(0);
    expect(result.accuracy).toBe(100);
  });

  test('0% accuracy when all targets missed and all non-targets false alarmed', () => {
    const n: NBackLevel = 1;
    // index 0: 0, index 1: 0 (target), index 2..20: 1..19 distinct (non-targets)
    const trials: CellIndex[] = [0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3];
    // 1 target (idx 1), 19 non-targets (idx 2..20)
    const responses: TrialResponse[] = [
      null,
      false,
      ...new Array(19).fill(true),
    ];

    const result = scoreRound(n, trials, responses);
    expect(result.hits).toBe(0);
    expect(result.misses).toBe(1);
    expect(result.falseAlarms).toBe(19);
    expect(result.correctRejections).toBe(0);
    expect(result.accuracy).toBe(0);
  });

  describe('calculateLiveScores', () => {
    test('computes live hits and false alarms up to currentTrialIdx for answered trials', () => {
      const n: NBackLevel = 1;
      const trials: CellIndex[] = [0, 0, 1, 1, 2];
      const responses: TrialResponse[] = [null, true, true, false, null];

      // at trialIdx 1: trial 1 is target (0===0), response true -> hit: 1, fa: 0
      expect(calculateLiveScores(n, trials, responses, 1)).toEqual({ hits: 1, falseAlarms: 0 });

      // at trialIdx 2: trial 2 is non-target (1!==0), response true -> hit: 1, fa: 1
      expect(calculateLiveScores(n, trials, responses, 2)).toEqual({ hits: 1, falseAlarms: 1 });

      // at trialIdx 3: trial 3 is target (1===1), response false -> hit: 1, fa: 1
      expect(calculateLiveScores(n, trials, responses, 3)).toEqual({ hits: 1, falseAlarms: 1 });

      // at trialIdx 4: trial 4 response is null -> still hit: 1, fa: 1
      expect(calculateLiveScores(n, trials, responses, 4)).toEqual({ hits: 1, falseAlarms: 1 });
    });
  });
});

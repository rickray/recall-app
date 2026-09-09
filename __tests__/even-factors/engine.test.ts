import {
  EvenFactorsState,
  onCorrect,
  onWrongOrSkip,
  createInitialState,
} from '../../src/games/even-factors/engine';

describe('Even Factors engine', () => {
  test('createInitialState sets initial defaults', () => {
    const s = createInitialState(10, 5);
    expect(s).toEqual({
      solvedTotal: 10,
      currentStreak: 0,
      bestStreak: 5,
    });
  });

  test('onCorrect increments solvedTotal, currentStreak, and updates bestStreak when exceeded', () => {
    const s0: EvenFactorsState = {
      solvedTotal: 0,
      currentStreak: 0,
      bestStreak: 2,
    };

    const s1 = onCorrect(s0);
    expect(s1).toEqual({
      solvedTotal: 1,
      currentStreak: 1,
      bestStreak: 2,
    });

    const s2 = onCorrect(s1);
    expect(s2).toEqual({
      solvedTotal: 2,
      currentStreak: 2,
      bestStreak: 2,
    });

    const s3 = onCorrect(s2);
    expect(s3).toEqual({
      solvedTotal: 3,
      currentStreak: 3,
      bestStreak: 3,
    });
  });

  test('onWrongOrSkip resets currentStreak to 0 while preserving solvedTotal and bestStreak', () => {
    const s0: EvenFactorsState = {
      solvedTotal: 5,
      currentStreak: 4,
      bestStreak: 8,
    };

    const s1 = onWrongOrSkip(s0);
    expect(s1).toEqual({
      solvedTotal: 5,
      currentStreak: 0,
      bestStreak: 8,
    });
  });
});

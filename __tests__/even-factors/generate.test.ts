import { generateProblem, isEvenEnding } from '../../src/games/even-factors/generate';

describe('Even Factors generateProblem', () => {
  test('isEvenEnding correctly identifies numbers ending in 0, 2, 4, 6, 8', () => {
    expect(isEvenEnding(0)).toBe(true);
    expect(isEvenEnding(2)).toBe(true);
    expect(isEvenEnding(14)).toBe(true);
    expect(isEvenEnding(20)).toBe(true);
    expect(isEvenEnding(98)).toBe(true);
    expect(isEvenEnding(1)).toBe(false);
    expect(isEvenEnding(13)).toBe(false);
    expect(isEvenEnding(99)).toBe(false);
  });

  test('both factors end in even digit across 50 mixed problems', () => {
    for (let i = 0; i < 50; i++) {
      const p = generateProblem('mixed');
      expect(isEvenEnding(p.a)).toBe(true);
      expect(isEvenEnding(p.b)).toBe(true);
      expect(p.product).toBe(p.a * p.b);
      expect(p.a).toBeGreaterThanOrEqual(1);
      expect(p.a).toBeLessThanOrEqual(99);
      expect(p.b).toBeGreaterThanOrEqual(1);
      expect(p.b).toBeLessThanOrEqual(99);
    }
  });

  test('1x1 uses only single digits 2, 4, 6, 8', () => {
    for (let i = 0; i < 30; i++) {
      const p = generateProblem('1x1');
      expect([2, 4, 6, 8]).toContain(p.a);
      expect([2, 4, 6, 8]).toContain(p.b);
      expect(p.product).toBe(p.a * p.b);
    }
  });

  test('mixed guarantees at least one single-digit factor', () => {
    for (let i = 0; i < 40; i++) {
      const p = generateProblem('mixed');
      expect(p.a < 10 || p.b < 10).toBe(true);
      expect(p.product).toBe(p.a * p.b);
    }
  });

  test('1x2 is one single and one double-digit', () => {
    for (let i = 0; i < 40; i++) {
      const p = generateProblem('1x2');
      const singles = [p.a, p.b].filter((n) => n < 10).length;
      const doubles = [p.a, p.b].filter((n) => n >= 10).length;
      expect(singles).toBe(1);
      expect(doubles).toBe(1);
      expect(p.product).toBe(p.a * p.b);
    }
  });

  test('custom deterministic RNG works properly', () => {
    const fakeRng = () => 0; // picks index 0
    const p = generateProblem('1x1', fakeRng);
    expect(p.a).toBe(2);
    expect(p.b).toBe(2);
    expect(p.product).toBe(4);
  });
});

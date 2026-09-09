import { EvenFactorsMode, EvenFactorsProblem } from './types';

export function isEvenEnding(n: number): boolean {
  return [0, 2, 4, 6, 8].includes(Math.abs(n) % 10);
}

function allEvenEndingFactors(): number[] {
  const out: number[] = [];
  for (let i = 1; i <= 99; i++) {
    if (isEvenEnding(i)) out.push(i);
  }
  return out;
}

const ALL = allEvenEndingFactors();
const SINGLES = ALL.filter((n) => n < 10); // 2, 4, 6, 8
const DOUBLES = ALL.filter((n) => n >= 10);

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function generateProblem(
  mode: EvenFactorsMode,
  rng: () => number = Math.random
): EvenFactorsProblem {
  let a: number;
  let b: number;

  if (mode === '1x1') {
    a = pick(SINGLES, rng);
    b = pick(SINGLES, rng);
  } else if (mode === '1x2') {
    if (rng() < 0.5) {
      a = pick(SINGLES, rng);
      b = pick(DOUBLES, rng);
    } else {
      a = pick(DOUBLES, rng);
      b = pick(SINGLES, rng);
    }
  } else {
    // 'mixed' mode: at least one single-digit factor; other from full set
    const single = pick(SINGLES, rng);
    const other = pick(ALL, rng);
    if (rng() < 0.5) {
      a = single;
      b = other;
    } else {
      a = other;
      b = single;
    }
  }

  return { a, b, product: a * b };
}

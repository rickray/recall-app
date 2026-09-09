export type EvenFactorsMode = 'mixed' | '1x1' | '1x2';

export interface EvenFactorsProblem {
  a: number;
  b: number;
  product: number;
}

export interface EvenFactorsState {
  solvedTotal: number;
  currentStreak: number;
  bestStreak: number;
}

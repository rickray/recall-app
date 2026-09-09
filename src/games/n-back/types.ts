export type NBackLevel = 1 | 2;

export type CellIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type TrialResponse = boolean | null;

export interface NBackScoreResult {
  totalEvaluated: number;
  totalTargets: number;
  totalNonTargets: number;
  hits: number;
  falseAlarms: number;
  misses: number;
  correctRejections: number;
  accuracy: number;
}

export interface LiveScores {
  hits: number;
  falseAlarms: number;
}

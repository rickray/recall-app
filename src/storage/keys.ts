export const STORAGE_KEYS = {
  soundEnabled: 'recall_sound_enabled',
  evenFactorsSolvedTotal: 'recall_evenfactors_solved_total',
  evenFactorsStreakBest: 'recall_evenfactors_streak_best',
  sequenceBest: 'recall_sequence_best',
  gridBest: 'recall_grid_best',
  nbackBest: (n: 1 | 2) => `recall_nback_n${n}_best` as const,
} as const;

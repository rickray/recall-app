export type GridCellIndex =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15;

export type CellVisualState =
  | 'idle'
  | 'flash'
  | 'selected'
  | 'correct'
  | 'wrong'
  | 'missed';

export interface GridState {
  currentLength: number;
  bestLength: number;
  targetCells: Set<GridCellIndex>;
  selectedCells: Set<GridCellIndex>;
  isFlashing: boolean;
  isGameActive: boolean;
}

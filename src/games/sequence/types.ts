export type PadIndex = 0 | 1 | 2 | 3;

export type PressResult = 'continue' | 'level-complete' | 'fail';

export interface SequenceState {
  sequence: PadIndex[];
  playerStep: number;
  bestLength: number;
  isPlayingSequence: boolean;
  isGameActive: boolean;
}

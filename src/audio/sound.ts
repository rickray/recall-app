import { getSoundEnabled, setSoundEnabled } from '../storage/asyncStore';

export interface SoundController {
  enabled: boolean;
  load(): Promise<void>;
  toggle(): Promise<boolean>;
  playKey(): Promise<void>;
  playSuccess(): Promise<void>;
  playError(): Promise<void>;
  playTone(index: number, seconds?: number): Promise<void>;
}

export function createSoundController(): SoundController {
  let isEnabled = true;

  return {
    get enabled() {
      return isEnabled;
    },
    async load() {
      try {
        isEnabled = await getSoundEnabled();
      } catch {
        isEnabled = true;
      }
    },
    async toggle() {
      isEnabled = !isEnabled;
      try {
        await setSoundEnabled(isEnabled);
      } catch {
        // Soft fail
      }
      return isEnabled;
    },
    async playKey() {
      if (!isEnabled) return;
      // Audio playback is soft-fail / best-effort in v1 (plan-allowed)
    },
    async playSuccess() {
      if (!isEnabled) return;
      // Audio playback is soft-fail / best-effort in v1 (plan-allowed)
    },
    async playError() {
      if (!isEnabled) return;
      // Audio playback is soft-fail / best-effort in v1 (plan-allowed)
    },
    async playTone(_index: number, _seconds?: number) {
      if (!isEnabled) return;
      // Audio playback is soft-fail / best-effort in v1 (plan-allowed)
    },
  };
}

export const sound = createSoundController();

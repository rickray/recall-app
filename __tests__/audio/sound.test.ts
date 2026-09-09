import { createSoundController } from '../../src/audio/sound';
import { STORAGE_KEYS } from '../../src/storage/keys';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    getItem: jest.fn(async (key: string) => store[key] ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      store[key] = value;
    }),
    clear: jest.fn(async () => {
      for (const k of Object.keys(store)) {
        delete store[k];
      }
    }),
  };
});

describe('SoundController', () => {
  beforeEach(async () => {
    await (AsyncStorage as any).clear();
    jest.clearAllMocks();
  });

  test('initializes default enabled and loads persisted state', async () => {
    const controller = createSoundController();
    expect(controller.enabled).toBe(true);

    await AsyncStorage.setItem(STORAGE_KEYS.soundEnabled, 'false');
    await controller.load();
    expect(controller.enabled).toBe(false);
  });

  test('toggle flips state and persists', async () => {
    const controller = createSoundController();
    expect(controller.enabled).toBe(true);

    const toggled1 = await controller.toggle();
    expect(toggled1).toBe(false);
    expect(controller.enabled).toBe(false);
    expect(await AsyncStorage.getItem(STORAGE_KEYS.soundEnabled)).toBe('false');

    const toggled2 = await controller.toggle();
    expect(toggled2).toBe(true);
    expect(controller.enabled).toBe(true);
    expect(await AsyncStorage.getItem(STORAGE_KEYS.soundEnabled)).toBe('true');
  });

  test('playback methods soft-fail / complete cleanly without throwing', async () => {
    const controller = createSoundController();
    await expect(controller.playKey()).resolves.toBeUndefined();
    await expect(controller.playSuccess()).resolves.toBeUndefined();
    await expect(controller.playError()).resolves.toBeUndefined();
    await expect(controller.playTone(0, 0.5)).resolves.toBeUndefined();

    // When disabled
    await controller.toggle();
    await expect(controller.playKey()).resolves.toBeUndefined();
    await expect(controller.playSuccess()).resolves.toBeUndefined();
    await expect(controller.playError()).resolves.toBeUndefined();
    await expect(controller.playTone(1, 0.5)).resolves.toBeUndefined();
  });
});

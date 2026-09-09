import {
  parseSoundEnabled,
  parseStoredInt,
  getInt,
  setInt,
  getSoundEnabled,
  setSoundEnabled,
  getString,
  setString,
} from '../../src/storage/asyncStore';
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

describe('pure parsing helpers', () => {
  describe('parseSoundEnabled', () => {
    test('returns true when null (default on)', () => {
      expect(parseSoundEnabled(null)).toBe(true);
    });

    test('returns true when "true"', () => {
      expect(parseSoundEnabled('true')).toBe(true);
    });

    test('returns false when exactly "false"', () => {
      expect(parseSoundEnabled('false')).toBe(false);
    });

    test('returns true for any other string', () => {
      expect(parseSoundEnabled('1')).toBe(true);
      expect(parseSoundEnabled('random')).toBe(true);
    });
  });

  describe('parseStoredInt', () => {
    test('returns fallback on null', () => {
      expect(parseStoredInt(null, 0)).toBe(0);
      expect(parseStoredInt(null, 42)).toBe(42);
    });

    test('parses valid integer strings', () => {
      expect(parseStoredInt('15', 0)).toBe(15);
      expect(parseStoredInt('0', 10)).toBe(0);
      expect(parseStoredInt('-5', 0)).toBe(-5);
    });

    test('returns fallback on invalid integer string', () => {
      expect(parseStoredInt('invalid', 100)).toBe(100);
      expect(parseStoredInt('', 5)).toBe(5);
    });
  });
});

describe('AsyncStorage wrappers', () => {
  beforeEach(async () => {
    await (AsyncStorage as any).clear();
    jest.clearAllMocks();
  });

  test('getInt and setInt work with fallback and updates', () => {
    return Promise.resolve()
      .then(async () => {
        const initial = await getInt('test_key', 10);
        expect(initial).toBe(10);

        await setInt('test_key', 25);
        const updated = await getInt('test_key', 10);
        expect(updated).toBe(25);
      });
  });

  test('getString and setString work', async () => {
    const initial = await getString('str_key');
    expect(initial).toBeNull();

    await setString('str_key', 'hello');
    const updated = await getString('str_key');
    expect(updated).toBe('hello');
  });

  test('getSoundEnabled and setSoundEnabled behave correctly', async () => {
    // Default enabled
    const initial = await getSoundEnabled();
    expect(initial).toBe(true);

    // Disable
    await setSoundEnabled(false);
    expect(await getSoundEnabled()).toBe(false);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.soundEnabled, 'false');

    // Enable
    await setSoundEnabled(true);
    expect(await getSoundEnabled()).toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.soundEnabled, 'true');
  });
});

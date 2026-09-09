import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './keys';

export function parseSoundEnabled(raw: string | null): boolean {
  return raw !== 'false';
}

export function parseStoredInt(raw: string | null, fallback = 0): number {
  if (raw === null) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

export async function getString(key: string): Promise<string | null> {
  return AsyncStorage.getItem(key);
}

export async function setString(key: string, value: string): Promise<void> {
  await AsyncStorage.setItem(key, value);
}

export async function getInt(key: string, fallback = 0): Promise<number> {
  const v = await AsyncStorage.getItem(key);
  return parseStoredInt(v, fallback);
}

export async function setInt(key: string, value: number): Promise<void> {
  await AsyncStorage.setItem(key, String(value));
}

export async function getSoundEnabled(): Promise<boolean> {
  const v = await AsyncStorage.getItem(STORAGE_KEYS.soundEnabled);
  return parseSoundEnabled(v);
}

export async function setSoundEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.soundEnabled, enabled ? 'true' : 'false');
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getWeekNumber } from './astro';

export const KEYS = {
  USER_SIGN: 'user_sign',
  USER_NAME: 'user_name',
  USER_BIRTH: 'user_birth',
  USER_BIRTH_TIME: 'user_birth_time',
  USER_BIRTH_PLACE: 'user_birth_place',
  FAVORITES: 'favorites',
  NOTIF_HOUR: 'notif_hour',
  NOTIF_MIN: 'notif_min',
  JOURNAL: 'journal_entries',
  DREAMS: 'dream_entries',
  MOON_NOTIF: 'moon_notif_enabled',
};

export async function save(key, value) {
  try {
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    await AsyncStorage.setItem(key, str);
  } catch (e) {
    console.log('save error', e);
  }
}

export async function load(key) {
  try {
    const val = await AsyncStorage.getItem(key);
    if (val === null) return null;
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  } catch (e) {
    console.log('load error', e);
    return null;
  }
}

export async function remove(key) {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {}
}

// ─── Czyszczenie starego cache AI ──────────────────────────────────────────
// HomeScreen/CosmosScreen tworzą nowy klucz cache co dzień/tydzień/miesiąc
// (np. horoscope_v5_..._{data}), ale nigdy nie sprzątały starych wpisów —
// po miesiącach codziennego użycia AsyncStorage rósł bez ograniczeń setkami
// osieroconych kluczy. Ta funkcja usuwa wpisy, które nie są już "aktualnym
// okresem" — bezpieczna, bo dotyka wyłącznie kluczy cache AI, nigdy danych
// użytkownika (ulubione, dziennik, profil, ustawienia).
export async function cleanupOldAiCache() {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const now = new Date();
    const todaySuffix = now.toDateString();
    const monthSuffix = now.toLocaleDateString('pl-PL', { month: 'numeric', year: 'numeric' });
    const weekSuffix = `${now.getFullYear()}_${getWeekNumber(now)}`;

    const staleKeys = allKeys.filter((key) => {
      // Kolejność sprawdzania ma znaczenie: 'cosmos_week2_' też zaczyna się
      // od 'cosmos_', więc musi być sprawdzone jako pierwsze.
      if (key.startsWith('cosmos_week2_')) return !key.endsWith(weekSuffix);
      if (key.startsWith('horoscope_v5_') || key.startsWith('recipe_v2_')) return !key.endsWith(todaySuffix);
      if (key.startsWith('cosmos_')) return !key.endsWith(monthSuffix);
      return false;
    });

    if (staleKeys.length > 0) {
      await AsyncStorage.multiRemove(staleKeys);
      console.log(`cleanupOldAiCache: usunięto ${staleKeys.length} nieaktualnych wpisów cache`);
    }
  } catch (e) {
    console.log('cleanupOldAiCache error', e);
  }
}
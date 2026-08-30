import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import pl from './pl';
import en from './en';

const i18n = new I18n({ pl, en });

// Domyślnie użyj języka systemu, ale pozwól na ręczną zmianę
i18n.defaultLocale = 'pl';
i18n.locale = Localization.getLocales()[0]?.languageCode === 'en' ? 'en' : 'pl';
i18n.enableFallback = true;

export const LANG_KEY = 'app_language';

export async function loadLanguage() {
  try {
    const saved = await AsyncStorage.getItem(LANG_KEY);
    if (saved) i18n.locale = saved;
  } catch {}
}

export async function setLanguage(lang) {
  i18n.locale = lang;
  try {
    await AsyncStorage.setItem(LANG_KEY, lang);
  } catch {}
}

export function getLanguage() {
  return i18n.locale;
}

export default i18n;

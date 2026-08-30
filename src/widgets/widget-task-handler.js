import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HoroscopeWidget } from './HoroscopeWidget';

// Klucz cache pisany przez HomeScreen.js po każdym udanym pobraniu/odświeżeniu
// horoskopu dnia. Widget CELOWO nie robi własnego zapytania do Groq — czyta
// tylko to, co aplikacja już pobrała i zapisała. Dzięki temu widget nigdy nie
// zużywa dodatkowych requestów do AI i działa nawet offline (pokazuje ostatnie
// znane dane).
const WIDGET_CACHE_KEY = 'widget_daily_snippet';

const FALLBACK = {
  sign: 'Gwiezdny Przewodnik',
  emoji: '✨',
  text: 'Otwórz aplikację, aby zobaczyć dzisiejszy horoskop.',
};

function trim(text, max = 120) {
  if (!text) return '';
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + '…';
}

async function readSnippet() {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_CACHE_KEY);
    if (!raw) return FALLBACK;
    const data = JSON.parse(raw);
    if (!data || !data.text) return FALLBACK;
    return data;
  } catch {
    return FALLBACK;
  }
}

// Handler wywoływany przez natywny kod react-native-android-widget w
// tle (headless JS) — musi być zarejestrowany w index.js przez
// registerWidgetTaskHandler, inaczej Android nie będzie wiedział, co
// narysować, gdy użytkownik doda/odświeży widget.
export default async function widgetTaskHandler(props) {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const snippet = await readSnippet();
      props.renderWidget(
        <HoroscopeWidget
          sign={snippet.sign}
          emoji={snippet.emoji}
          text={trim(snippet.text)}
        />
      );
      break;
    }
    case 'WIDGET_CLICK':
      // clickAction="OPEN_APP" w HoroscopeWidget już otwiera aplikację —
      // ta gałąź zostaje pusta na wypadek przyszłych, bardziej złożonych akcji.
      break;
    case 'WIDGET_DELETED':
    default:
      break;
  }
}

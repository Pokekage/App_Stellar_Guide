import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { load, save, remove } from './storage';
import { getMoonPhase } from './astro';

// Jak powiadomienie ma wyglądać gdy aplikacja jest otwarta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Treści powiadomień — losowane każdego dnia
const MESSAGES_PL = [
  { title: '✨ Gwiezdny Przewodnik', body: 'Twój codzienny horoskop czeka. Gwiazdy mają dla Ciebie wiadomość...' },
  { title: '🌙 Kosmos przemawia', body: 'Sprawdź co dziś zapisały dla Ciebie gwiazdy.' },
  { title: '♈ Horoskop dnia', body: 'Nowy dzień, nowa energia kosmiczna. Otwórz aplikację i odkryj swój horoskop.' },
  { title: '🔮 Wróżba poranna', body: 'Zanim zaczniesz dzień — sprawdź co mówi Twój znak zodiaku.' },
  { title: '⭐ Energia dnia', body: 'Gwiazdy ułożyły się w wyjątkowy wzór. Sprawdź co to oznacza dla Ciebie.' },
];

const MESSAGES_EN = [
  { title: '✨ Stellar Guide', body: 'Your daily horoscope is ready. The stars have a message for you...' },
  { title: '🌙 The cosmos speaks', body: 'See what the stars have written for you today.' },
  { title: '♈ Daily Horoscope', body: 'A new day, new cosmic energy. Open the app and discover your horoscope.' },
  { title: '🔮 Morning reading', body: 'Before you start your day — check what your zodiac sign says.' },
  { title: '⭐ Energy of the day', body: 'The stars have aligned in a special pattern. See what it means for you.' },
];

function getRandomMessage(lang) {
  const messages = lang === 'en' ? MESSAGES_EN : MESSAGES_PL;
  const seed = new Date().toDateString().split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return messages[seed % messages.length];
}

function getPersonalizedMessage(lang, signName, userName = null) {
  const seed = new Date().toDateString().split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  if (!signName) return getRandomMessage(lang);
  // Imię + znak = najbardziej spersonalizowane
  const greeting = userName ? (lang === 'en' ? `${userName},` : `${userName},`) : null;
  const templates = lang === 'en' ? [
    { title: `✨ ${greeting ? greeting + ' ' : ''}your ${signName} stars are ready`, body: 'The cosmos has aligned just for you. Open the app to read your daily message.' },
    { title: `🔮 ${signName} · Daily Reading`, body: `${greeting ? greeting + ' t' : 'T'}he stars have something to tell you today. Don\'t keep them waiting...` },
    { title: `🌙 Good morning${greeting ? ', ' + userName : ''}`, body: `A new cosmic cycle begins for ${signName}. Your horoscope is waiting.` },
    { title: `⭐ ${signName} energy report`, body: `${greeting ? greeting + ' t' : 'T'}he universe shaped today\'s energies with you in mind.` },
    { title: `✦ ${signName} · Stars whisper`, body: `${greeting ? greeting + ' a' : 'A'}ncient star patterns carry a message for you today.` },
  ] : [
    { title: `✨ ${greeting ? greeting + ' ' : ''}gwiazdy ${signName} czekają`, body: 'Kosmos ułożył się specjalnie dla Ciebie. Otwórz aplikację i przeczytaj swoją wiadomość.' },
    { title: `🔮 ${signName} · Wróżba dnia`, body: `${greeting ? greeting + ' g' : 'G'}wiazdy mają dziś coś do powiedzenia. Nie każ im czekać...` },
    { title: `🌙 Dzień dobry${greeting ? ', ' + userName : ''}`, body: `Nowy cykl kosmiczny zaczyna się dla ${signName}. Twój horoskop czeka.` },
    { title: `⭐ Raport energii ${signName}`, body: `${greeting ? greeting + ' w' : 'W'}szechświat ukształtował dzisiejsze energie z myślą o Tobie.` },
    { title: `✦ ${signName} · Gwiazdy szepczą`, body: `${greeting ? greeting + ' s' : 'S'}tarożytne układy gwiezdne niosą dziś wiadomość dla Ciebie.` },
  ];
  return templates[seed % templates.length];
}

// ─── Rejestr identyfikatorów zaplanowanych powiadomień ─────────────────────
// Wcześniej cancelDailyNotification() wołało cancelAllScheduledNotificationsAsync(),
// czyli kasowało DOSŁOWNIE WSZYSTKIE zaplanowane powiadomienia w aplikacji —
// bezpieczne dopóki istniał tylko jeden typ powiadomienia, ale miną dla
// każdej kolejnej funkcji, która doda własne (np. powiadomienie o pełni
// księżyca poniżej). Teraz każdy typ powiadomienia ma swój identyfikator
// zapisany w AsyncStorage i anulowany osobno.
const NOTIF_ID_PREFIX = 'notif_id_';

async function saveNotifId(type, id) {
  await save(NOTIF_ID_PREFIX + type, id);
}

async function cancelNotifById(type) {
  try {
    const id = await load(NOTIF_ID_PREFIX + type);
    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
      await remove(NOTIF_ID_PREFIX + type);
    }
  } catch (e) {
    console.error(`Błąd anulowania powiadomienia (${type}):`, e);
  }
}

// Poproś o uprawnienia do powiadomień
export async function requestNotificationPermission() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Zaplanuj codzienne powiadomienie o podanej godzinie
export async function scheduleDailyNotification(hour, lang = 'pl', userSign = null, userName = null) {
  try {
    await cancelDailyNotification();
    const granted = await requestNotificationPermission();
    if (!granted) return false;

    const signName = userSign
      ? (lang === 'en' ? (userSign.nameEn || userSign.name) : userSign.name)
      : null;

    const message = getPersonalizedMessage(lang, signName, userName);

    const trigger = Platform.OS === 'android'
      ? { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute: 0, channelId: 'horoscope' }
      : { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute: 0 };

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: message.title,
        body: message.body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger,
    });
    await saveNotifId('daily', id);
    console.log('Notification scheduled:', id, 'at hour:', hour);
    return true;
  } catch (e) {
    console.error('Błąd planowania powiadomienia:', e);
    return false;
  }
}

// Anuluj TYLKO codzienne powiadomienie o horoskopie (nie rusza innych typów,
// np. powiadomienia o pełni księżyca poniżej).
export async function cancelDailyNotification() {
  await cancelNotifById('daily');
}

// ─── Powiadomienie o pełni / nowiu księżyca (rozbudowa) ────────────────────
// Wykorzystuje istniejące już obliczenie fazy księżyca z astro.js — appka
// i tak liczy fazę księżyca codziennie na ekranie głównym i w zakładce
// Księżyc, więc to praktycznie darmowy dodatek na już istniejącej logice.
function findNextPhaseInDays(targetPhaseName, maxDays = 30) {
  const now = new Date();
  for (let i = 0; i <= maxDays; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    d.setHours(12, 0, 0, 0); // południe — unika niejednoznaczności przy zmianie fazy w nocy
    const phase = getMoonPhase(d);
    if (phase.name === targetPhaseName) return i;
  }
  return null;
}

export async function scheduleMoonPhaseNotification(lang = 'pl') {
  try {
    await cancelMoonPhaseNotification();
    const granted = await requestNotificationPermission();
    if (!granted) return false;

    const fullMoonDays = findNextPhaseInDays('Pełnia');
    const newMoonDays = findNextPhaseInDays('Nów');

    let targetDays = null;
    let isFullMoon = true;
    if (fullMoonDays !== null && (newMoonDays === null || fullMoonDays <= newMoonDays)) {
      targetDays = fullMoonDays;
      isFullMoon = true;
    } else if (newMoonDays !== null) {
      targetDays = newMoonDays;
      isFullMoon = false;
    }
    if (targetDays === null) return false;

    const fireDate = new Date();
    fireDate.setDate(fireDate.getDate() + targetDays);
    fireDate.setHours(9, 0, 0, 0);
    if (fireDate.getTime() <= Date.now()) fireDate.setDate(fireDate.getDate() + 1);

    const title = isFullMoon
      ? (lang === 'en' ? '🌕 Full Moon tonight' : '🌕 Dziś Pełnia Księżyca')
      : (lang === 'en' ? '🌑 New Moon today' : '🌑 Dziś Nów Księżyca');
    const body = isFullMoon
      ? (lang === 'en' ? 'Peak lunar energy — see what it means for you.' : 'Szczyt energii księżycowej — sprawdź co to oznacza dla Ciebie.')
      : (lang === 'en' ? 'A new lunar cycle begins — a good time to set intentions.' : 'Zaczyna się nowy cykl księżycowy — dobry czas na nowe intencje.');

    const trigger = Platform.OS === 'android'
      ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireDate, channelId: 'horoscope' }
      : { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireDate };

    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true, priority: Notifications.AndroidNotificationPriority.HIGH },
      trigger,
    });
    await saveNotifId('moon', id);
    return true;
  } catch (e) {
    console.error('Błąd planowania powiadomienia księżycowego:', e);
    return false;
  }
}

export async function cancelMoonPhaseNotification() {
  await cancelNotifById('moon');
}

// Ustaw kanał powiadomień dla Androida (wymagane dla Android 8+)
export async function setupAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('horoscope', {
      name: 'Horoskop dzienny',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#d4af37',
      sound: true,
    });
  }
}

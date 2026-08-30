// ─── Klient AI (Groq) ─────────────────────────────────────────────────────
// UWAGA BEZPIECZEŃSTWA: klucz EXPO_PUBLIC_* zawsze trafia do bundla klienta
// (Expo wpina go na sztywno przy buildzie) — nawet trzymany w EAS Secrets
// jest odczytywalny przez każdego, kto rozpakuje APK/IPA. Docelowo najlepiej
// przenieść te wywołania za własny backend-proxy (patrz server/groq-proxy
// i SECURITY.md w katalogu głównym projektu). Jeśli ustawiona jest zmienna
// EXPO_PUBLIC_LLM_PROXY_URL, wszystkie wywołania idą przez ten proxy zamiast
// bezpośrednio do Groq, więc prawdziwy klucz nie musi w ogóle trafiać do apki.
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const PROXY_URL = process.env.EXPO_PUBLIC_LLM_PROXY_URL;

let missingKeyWarned = false;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Jeden, wspólny klient LLM — zastępuje 3 niezależne kopie (astro.js,
// CosmosScreen.js, ProfileScreen.js), które istniały wcześniej i miały
// niespójną obsługę błędów.
//
// UWAGA (2026-08-29): dodana CICHA, AUTOMATYCZNA PONOWNA PRÓBA. Zgłoszony
// realny objaw: tarot działał dopiero za 3. razem (1. próba — błąd sieci,
// 2. próba — ucięta/"pogubiona" odpowiedź, dopiero 3. się udawała). Modele
// reasoningowe (gpt-oss) potrafią sporadycznie: (a) dostać chwilowy błąd
// z Groq, albo (b) zwrócić pustą treść, gdy cały budżet max_tokens
// "zjadły" tokeny myślenia zanim model zdążył napisać właściwą odpowiedź.
// Zamiast zmuszać użytkownika do ręcznego odświeżania po 2-3 razy, robimy
// to raz automatycznie i bez pokazywania błędu — user w ogóle tego nie widzi.
async function callLLM(prompt, { model = 'openai/gpt-oss-20b', maxTokens = 600, reasoningEffort, retries = 1 } = {}) {
  const useProxy = !!PROXY_URL;

  if (!useProxy && !GROQ_API_KEY) {
    if (!missingKeyWarned) {
      console.error('Brak klucza EXPO_PUBLIC_GROQ_KEY (ani EXPO_PUBLIC_LLM_PROXY_URL) — ustaw go w .env / EAS env. Patrz SECURITY.md.');
      missingKeyWarned = true;
    }
    return null;
  }

  const body = { model, messages: [{ role: 'user', content: prompt }], max_tokens: maxTokens };
  if (reasoningEffort) body.reasoning_effort = reasoningEffort;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(useProxy ? PROXY_URL : GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(useProxy ? {} : { Authorization: `Bearer ${GROQ_API_KEY}` }),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        console.error('AI zwróciło błąd:', res.status, errorText);
        if (attempt < retries) { await sleep(400); continue; }
        return null;
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      // Pusta treść zwykle oznacza, że model "wygadał" cały budżet tokenów
      // na wewnętrzne rozumowanie i zabrakło mu miejsca na właściwą odpowiedź —
      // ponowna próba (ten sam prompt) zwykle po prostu się udaje.
      if (content) return content;
      if (attempt < retries) { await sleep(300); continue; }
      return null;
    } catch (error) {
      console.error('Błąd sieciowy podczas połączenia z AI:', error);
      if (attempt < retries) { await sleep(400); continue; }
      return null;
    }
  }
  return null;
}

// Model "standardowy" — dłuższe, bardziej mistyczne treści (dawne callGroq)
// UWAGA (2026-08-29): wcześniej był tu 'qwen/qwen3.6-27b' — to model PREVIEW
// na Groq, oficjalnie "may be discontinued at short notice" (może zniknąć
// bez zapowiedzi). Podmienione na produkcyjny openai/gpt-oss-120b, który jest
// stabilny, tańszy i szybszy. Modele gpt-oss NIE obsługują reasoning_effort:
// 'none' (tylko low/medium/high) — dla treści kreatywnych 'low' wystarcza
// i nie dokłada zbędnych "myślących" tokenów, które spowalniałyby odpowiedź.
function callStandard(prompt, maxTokens = 2000) {
  return callLLM(prompt, { model: 'openai/gpt-oss-120b', maxTokens, reasoningEffort: 'low' });
}

// Model "szybki" — krótsze odpowiedzi (dawne callGroqFast). Wcześniej NIE
// ustawiał reasoning_effort wcale, więc model dobierał je sam (zwykle
// 'medium') — to właśnie zwiększało ryzyko zjedzenia budżetu max_tokens
// przez "myślenie" i puste/ucięte odpowiedzi opisane wyżej. 'low' wystarcza
// w zupełności do krótkich, kreatywnych treści (odczyty tarota).
function callFast(prompt, maxTokens = 350) {
  return callLLM(prompt, { model: 'openai/gpt-oss-20b', maxTokens, reasoningEffort: 'low' });
}

function connectionFallback(lang) {
  return lang === 'en' ? 'Connection problem...' : 'Problem z połączeniem...';
}

// ─── Wspólny parser JSON z odpowiedzi LLM ──────────────────────────────────
// Zastępuje ten sam fragment kodu (odetnij ```json, wyciągnij {...} regexem,
// JSON.parse) wklejony wcześniej osobno w HomeScreen, MoonTarotScreen,
// CosmosScreen i ProfileScreen.
export function parseJsonFromLlmText(text, fallback = null) {
  if (!text) return fallback;
  try {
    let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) clean = match[0];
    return JSON.parse(clean);
  } catch (e) {
    console.error('Błąd parsowania JSON z odpowiedzi AI:', e.message);
    return fallback;
  }
}

// Wywołuje LLM oczekując JSON-a; jeśli parsowanie się nie uda (ucięta albo
// "pogubiona" odpowiedź modelu reasoningowego — patrz komentarz przy callLLM),
// próbuje RAZ JESZCZE z tym samym promptem, zanim odda null wywołującemu.
// Używane przez fetchWeeklyEnergy/fetchCosmicEvents/fetchCosmicProfile, które
// wszystkie miały ten sam wzorzec "callLLM + parseJsonFromLlmText + throw".
async function callLLMForJson(prompt, opts) {
  let parsed = parseJsonFromLlmText(await callLLM(prompt, opts));
  if (!parsed) parsed = parseJsonFromLlmText(await callLLM(prompt, opts));
  return parsed;
}

// ─── Znaki zodiaku ──────────────────────────────────────────────────────────

export const SIGNS = [
  { key: 'aries',       name: 'Baran',      nameEn: 'Aries',       emoji: '♈', dates: '21.03–19.04' },
  { key: 'taurus',      name: 'Byk',        nameEn: 'Taurus',      emoji: '♉', dates: '20.04–20.05' },
  { key: 'gemini',      name: 'Bliźnięta',  nameEn: 'Gemini',      emoji: '♊', dates: '21.05–20.06' },
  { key: 'cancer',      name: 'Rak',        nameEn: 'Cancer',      emoji: '♋', dates: '21.06–22.07' },
  { key: 'leo',         name: 'Lew',        nameEn: 'Leo',         emoji: '♌', dates: '23.07–22.08' },
  { key: 'virgo',       name: 'Panna',      nameEn: 'Virgo',       emoji: '♍', dates: '23.08–22.09' },
  { key: 'libra',       name: 'Waga',       nameEn: 'Libra',       emoji: '♎', dates: '23.09–22.10' },
  { key: 'scorpio',     name: 'Skorpion',   nameEn: 'Scorpio',     emoji: '♏', dates: '23.10–21.11' },
  { key: 'sagittarius', name: 'Strzelec',   nameEn: 'Sagittarius', emoji: '♐', dates: '22.11–21.12' },
  { key: 'capricorn',   name: 'Koziorożec', nameEn: 'Capricorn',   emoji: '♑', dates: '22.12–19.01' },
  { key: 'aquarius',    name: 'Wodnik',     nameEn: 'Aquarius',    emoji: '♒', dates: '20.01–18.02' },
  { key: 'pisces',      name: 'Ryby',       nameEn: 'Pisces',      emoji: '♓', dates: '19.02–20.03' },
];

// Wspólna logika wyznaczania znaku z dnia/miesiąca urodzenia — wcześniej
// wklejona osobno (i lekko rozjechana) w OnboardingScreen.js i CompatScreen.js.
export function getSignFromDayMonth(day, month) {
  if (!day || !month || isNaN(day) || isNaN(month) || day < 1 || day > 31 || month < 1 || month > 12) return null;
  const md = month * 100 + day;
  if (md >= 321 && md <= 419) return SIGNS.find(s => s.key === 'aries');
  if (md >= 420 && md <= 520) return SIGNS.find(s => s.key === 'taurus');
  if (md >= 521 && md <= 620) return SIGNS.find(s => s.key === 'gemini');
  if (md >= 621 && md <= 722) return SIGNS.find(s => s.key === 'cancer');
  if (md >= 723 && md <= 822) return SIGNS.find(s => s.key === 'leo');
  if (md >= 823 && md <= 922) return SIGNS.find(s => s.key === 'virgo');
  if (md >= 923 && md <= 1022) return SIGNS.find(s => s.key === 'libra');
  if (md >= 1023 && md <= 1121) return SIGNS.find(s => s.key === 'scorpio');
  if (md >= 1122 && md <= 1221) return SIGNS.find(s => s.key === 'sagittarius');
  if ((md >= 1222 && md <= 1231) || (md >= 101 && md <= 119)) return SIGNS.find(s => s.key === 'capricorn');
  if (md >= 120 && md <= 218) return SIGNS.find(s => s.key === 'aquarius');
  if (md >= 219 && md <= 320) return SIGNS.find(s => s.key === 'pisces');
  return null;
}

// Wygodny wariant przyjmujący string "DD.MM.RRRR" (lub "DD.MM")
export function getSignFromDateStr(input) {
  if (!input) return null;
  const parts = input.trim().split('.');
  if (parts.length < 2) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  return getSignFromDayMonth(day, month);
}

// ─── Faza księżyca ──────────────────────────────────────────────────────────

export function getMoonPhase(date = new Date()) {
  const phases = [
    { name: 'Nów',                  nameEn: 'New Moon',        emoji: '🌑' },
    { name: 'Przybywający Sierp',   nameEn: 'Waxing Crescent', emoji: '🌒' },
    { name: 'Pierwsza Kwadra',      nameEn: 'First Quarter',   emoji: '🌓' },
    { name: 'Gibbous Przybywający', nameEn: 'Waxing Gibbous',  emoji: '🌔' },
    { name: 'Pełnia',               nameEn: 'Full Moon',       emoji: '🌕' },
    { name: 'Gibbous Ubywający',    nameEn: 'Waning Gibbous',  emoji: '🌖' },
    { name: 'Ostatnia Kwadra',      nameEn: 'Last Quarter',    emoji: '🌗' },
    { name: 'Ubywający Sierp',      nameEn: 'Waning Crescent', emoji: '🌘' },
  ];
  const known = new Date(2025, 3, 27);
  const cycle = 29.53058867;
  const diff = (date - known) / (1000 * 60 * 60 * 24);
  const pos = ((diff % cycle) + cycle) % cycle;
  const idx = Math.floor((pos / cycle) * 8);
  return { ...phases[idx], day: Math.round(pos) + 1 };
}

export function calcAscendant(birthDateStr, birthTimeStr) {
  try {
    if (!birthDateStr || !birthTimeStr) return null;
    const dp = birthDateStr.split('.');
    const tp = birthTimeStr.split(':');
    if (dp.length < 3 || tp.length < 2) return null;
    const day   = parseInt(dp[0], 10);
    const month = parseInt(dp[1], 10);
    const year  = parseInt(dp[2], 10);
    const hour  = parseInt(tp[0], 10);
    const min   = parseInt(tp[1], 10);
    if (isNaN(day)||isNaN(month)||isNaN(year)||isNaN(hour)||isNaN(min)) return null;

    const birthTime = hour + min / 60;

    const daysPerMonth = [0,31,28,31,30,31,30,31,31,30,31,30,31];
    let dayOfYear = day;
    for (let i = 1; i < month; i++) dayOfYear += daysPerMonth[i];
    // Poprawna reguła roku przestępnego (Gregoriański) — poprzednia wersja
    // (year % 4 === 0) myliła się dla lat 1900/2100.
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    if (isLeapYear && month > 2) dayOfYear += 1;

    const vernalEquinox = 80;
    const sunDeg = ((dayOfYear - vernalEquinox) * (360/365.25) + 360) % 360;
    const ascDeg = (sunDeg + 180 + birthTime * 15 + 360) % 360;
    const ascIdx = Math.floor(ascDeg / 30);

    const SIGN_KEYS = ['aries','taurus','gemini','cancer','leo','virgo',
                       'libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
    const key = SIGN_KEYS[ascIdx];
    return SIGNS.find(s => s.key === key) || null;
  } catch {
    return null;
  }
}

// ─── Horoskop / przepis / tarot / zgodność / sennik / dziennik ────────────

export async function fetchHoroscope(signName, customPrompt = null, lang = 'pl') {
  const today = new Date().toLocaleDateString(lang === 'en' ? 'en-GB' : 'pl-PL');
  const prompt = customPrompt || (lang === 'en'
    ? `You are a mystical astrologer. Respond in English only. Write a daily horoscope for ${signName} for ${today}. 4-5 sentences, mysterious and inspiring. Start with a cosmic phrase.`
    : `Jesteś mistycznym astrologiem. Napisz dzienny horoskop dla znaku ${signName} na dzień ${today}. Po polsku, 4-5 zdań, tajemniczy i inspirujący. Zacznij od frazy związanej z kosmosem.`);
  const text = await callStandard(prompt);
  return text || connectionFallback(lang);
}

export async function fetchRecipe(signName, customPrompt = null, lang = 'pl') {
  const prompt = customPrompt || (lang === 'en'
    ? `You are an astrological chef. Respond in English only. Suggest one recipe matching the zodiac sign ${signName}. Provide: dish name, short description (2 sentences) why it suits this sign, ingredients (list) and preparation (3-4 steps).`
    : `Jesteś astrologicznym kucharzem. Zaproponuj jeden przepis kulinarny pasujący do znaku zodiaku ${signName}. Napisz po polsku: nazwę dania, krótki opis (2 zdania) dlaczego pasuje do tego znaku, składniki (lista) i sposób przygotowania (3-4 kroki).`);
  const text = await callStandard(prompt);
  return text || connectionFallback(lang);
}

// Uwaga: wcześniej ta funkcja miała podwójne znaczenie drugiego argumentu
// (kod języka ALBO gotowy prompt, rozróżniane heurystyką "length > 5"),
// a jedyne realne wywołanie w apce zawsze przekazywało gotowy prompt —
// druga gałąź była martwym kodem. Uproszczone do jednego, jawnego kształtu.
export async function fetchTarotReading(prompt, maxTokens = 700) {
  const text = await callFast(prompt, maxTokens);
  return text || connectionFallback('pl');
}

// relationType: 'love' | 'work' | 'friendship' — pozwala CompatScreen.js
// pytać o tę samą parę znaków w różnych kontekstach zamiast tylko romantycznym.
export async function fetchCompatibility(sign1, sign2, percent, lang = 'pl', relationType = 'love') {
  const CONTEXT = {
    love:       { en: 'romantic relationship', pl: 'związku romantycznym' },
    work:       { en: 'professional / work collaboration', pl: 'współpracy zawodowej' },
    friendship: { en: 'friendship', pl: 'przyjaźni' },
  };
  const ctx = CONTEXT[relationType] || CONTEXT.love;
  const prompt = lang === 'en'
    ? `You are an astrologer. Compatibility between ${sign1} and ${sign2} in a ${ctx.en} context is ${percent}%. Describe this pair in English in 4-5 sentences — what connects them, challenges and strengths specifically in a ${ctx.en}. Be poetic. Do NOT mention percentages.`
    : `Jesteś astrologiem. Zgodność między znakiem ${sign1} a ${sign2} w kontekście ${ctx.pl} wynosi ${percent}%. Opisz po polsku tę parę w 4-5 zdaniach — co ich łączy, jakie są wyzwania i mocne strony konkretnie w ${ctx.pl}. Bądź poetycki. NIE podawaj procentów.`;
  const text = await callStandard(prompt);
  return text || connectionFallback(lang);
}

// Bazowy % z COMPAT_TABLE (CompatScreen.js) jest pomyślany pod kątem miłosnym.
// Dla pracy/przyjaźni dodajemy deterministyczne, powtarzalne przesunięcie
// (ten sam wzorzec co istniejący calcSynastry w CompatScreen.js), żeby te
// trzy tryby nie pokazywały identycznej liczby dla każdej pary znaków.
export function adjustCompatPercentForType(basePercent, sign1Key, sign2Key, relationType) {
  if (relationType === 'love' || !relationType) return basePercent;
  const hash = (sign1Key + sign2Key + relationType).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const offset = (hash % 15) - 7; // -7..+7
  return Math.min(98, Math.max(35, basePercent + offset));
}

export async function fetchDreamInterpretation(dream, lang = 'pl') {
  const prompt = lang === 'en'
    ? `You are a mystical dream interpreter. The user's dream: "${dream}". Interpret it in English in 4-5 sentences. Be poetic and deep.`
    : `Jesteś mistycznym sennikiem. Sen użytkownika: "${dream}". Zinterpretuj go po polsku w 4-5 zdaniach. Bądź poetycki i głęboki.`;
  const text = await callStandard(prompt);
  return text || connectionFallback(lang);
}

export async function fetchJournalComment(text, mood, lang = 'pl') {
  const prompt = lang === 'en'
    ? `You are a cosmic guide. The user wrote: "${text}". Mood: ${mood}. Write a short (3 sentences) comment from the stars in English — inspiring and poetic.`
    : `Jesteś kosmicznym przewodnikiem. Użytkownik zapisał: "${text}". Nastrój: ${mood}. Napisz po polsku krótki (3 zdania) komentarz od gwiazd — inspirujący i poetycki.`;
  const result = await callStandard(prompt);
  return result || connectionFallback(lang);
}

// ─── Retrogradacje — dane statyczne, nie zgadywane przez AI ───────────────
// WAŻNE: wcześniej pole "retrograde" w energii tygodnia było wymyślane przez
// LLM ("Be accurate for ${weekRange}") — model nie ma dostępu do żadnej
// efemerydy i potrafił z pełnym przekonaniem podać błędną planetę. Poniższa
// tabela to realne, zweryfikowane daty stacji retrogradacji na 2026 rok
// (Merkury: 3 okresy, Wenus: 1 okres; Mars w 2026 nie cofa się wcale) —
// źródła: cafeastrology.com/retrogrades.html i astrostyle.com (sierpień 2026).
// Wymaga ręcznej aktualizacji na kolejne lata (dane są publikowane z dużym
// wyprzedzeniem, to nie jest informacja, która się "psuje" jak ceny czy newsy).
const RETROGRADES_2026 = [
  { planet: 'Merkury', planetEn: 'Mercury', start: '2026-02-26', end: '2026-03-20' },
  { planet: 'Merkury', planetEn: 'Mercury', start: '2026-06-29', end: '2026-07-23' },
  { planet: 'Wenus',   planetEn: 'Venus',   start: '2026-10-03', end: '2026-11-13' },
  { planet: 'Merkury', planetEn: 'Mercury', start: '2026-10-24', end: '2026-11-13' },
];

// Zwraca string z planetami, których retrogradacja pokrywa się (choćby
// częściowo) z podanym zakresem dat — albo "Brak"/"None", gdy żadna nie pasuje.
export function getRetrogradesInRange(rangeStart, rangeEnd, lang = 'pl') {
  const s = rangeStart.getTime();
  const e = rangeEnd.getTime();
  const active = RETROGRADES_2026.filter((r) => {
    const rs = new Date(r.start + 'T00:00:00').getTime();
    const re = new Date(r.end + 'T23:59:59').getTime();
    return rs <= e && re >= s; // zakresy się przecinają
  });
  if (active.length === 0) return lang === 'en' ? 'None' : 'Brak';
  const names = [...new Set(active.map(r => (lang === 'en' ? r.planetEn : r.planet)))];
  return names.join(', ');
}

// Numer tygodnia ISO — wspólny helper (wcześniej zdefiniowany osobno tylko
// w CosmosScreen.js; potrzebny też do cache'a i do liczenia retrogradacji).
export function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// ─── Energia tygodnia / miesiąca (przeniesione z CosmosScreen.js) ─────────
// Wcześniej CosmosScreen.js miał własny, niezależny fetch() bez sprawdzania
// res.ok — przeniesione tutaj i ujednolicone przez callLLM.

export async function fetchWeeklyEnergy(lang) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const fmt = (d) => d.toLocaleDateString(lang === 'en' ? 'en-GB' : 'pl-PL', { day: 'numeric', month: 'long' });
  const weekRange = `${fmt(weekStart)} – ${fmt(weekEnd)}`;

  // Retrogradacja NIE jest już częścią zapytania do AI — patrz komentarz przy
  // RETROGRADES_2026 powyżej. Liczymy ją lokalnie, deterministycznie.
  const prompt = lang === 'en'
    ? `You are an expert astrologer. For the week of ${weekRange}, provide a brief astrological overview. Return ONLY raw JSON (no markdown):
{
  "title": "short poetic title for the week (max 5 words)",
  "energy": "2-3 sentences about the overall astrological energy this week",
  "focus": "one word or short phrase — the main theme (e.g. Communication, Transformation, Love)",
  "tip": "one practical cosmic tip for the week (1 sentence)"
}`
    : `Jesteś doświadczonym astrologiem. Dla tygodnia ${weekRange} podaj krótki przegląd astrologiczny. Zwróć TYLKO surowy JSON (bez markdown):
{
  "title": "krótki poetycki tytuł tygodnia (max 5 słów)",
  "energy": "2-3 zdania o ogólnej energii astrologicznej tego tygodnia",
  "focus": "jedno słowo lub krótka fraza — główny motyw (np. Komunikacja, Transformacja, Miłość)",
  "tip": "jedna praktyczna kosmiczna rada na ten tydzień (1 zdanie)"
}`;

  // 'llama-3.1-8b-instant' zostało wycofane przez Groq 16.08.2026 (patrz
  // console.groq.com/docs/deprecations) — ta funkcja realnie nie działała
  // od dwóch tygodni. Zamiennik zgodny z oficjalną rekomendacją Groq.
  const parsed = await callLLMForJson(prompt, { model: 'openai/gpt-oss-20b', maxTokens: 400, reasoningEffort: 'low' });
  if (!parsed) throw new Error('Nie udało się odczytać energii tygodnia');
  parsed.retrograde = getRetrogradesInRange(weekStart, weekEnd, lang);
  return parsed;
}

export async function fetchCosmicEvents(lang) {
  const month = new Date().toLocaleDateString(lang === 'en' ? 'en-GB' : 'pl-PL', { month: 'long', year: 'numeric' });
  const prompt = lang === 'en'
    ? `You are an astrologer. Describe 5 astrological energies for ${month}. Do NOT give specific dates. Format: ONLY JSON: {"events":[{"name":"...","date":"whole month / beginning / mid / end of month","emoji":"...","type":"Energy/Transit/Season/Portal/Cycle","astronomy":"2 sentences","astrology":"2-3 sentences","intensity":"low/medium/high/very high"}]}`
    : `Jesteś astrologiem. Opisz 5 astrologicznych energii na ${month}. NIE podawaj konkretnych dat. Format: TYLKO JSON: {"events":[{"name":"...","date":"cały miesiąc / początek / połowa / koniec miesiąca","emoji":"...","type":"Energia/Tranzyt/Sezon/Portal/Cykl","astronomy":"2 zdania","astrology":"2-3 zdania","intensity":"niska/średnia/wysoka/bardzo wysoka"}]}`;

  // 'llama-3.3-70b-versatile' zostało wycofane przez Groq 16.08.2026 (patrz
  // console.groq.com/docs/deprecations) — ta funkcja realnie nie działała
  // od dwóch tygodni. Zamiennik zgodny z oficjalną rekomendacją Groq.
  const parsed = await callLLMForJson(prompt, { model: 'openai/gpt-oss-120b', maxTokens: 1500, reasoningEffort: 'low' });
  if (!parsed) throw new Error('Nie udało się odczytać energii miesiąca');
  return parsed;
}

// ─── Profil kosmiczny (przeniesione z ProfileScreen.js) ───────────────────

export async function fetchCosmicProfile(signName, moonPhaseName, ascName, lang) {
  const prompt = lang === 'en'
    ? `You are an expert astrologer. Create a short cosmic profile for a person with:
- Sun sign: ${signName}
- Birth moon phase: ${moonPhaseName}
- Ascendant: ${ascName || 'unknown'}

Return ONLY raw JSON (no markdown):
{
  "sun": "2-3 sentences about personality, life purpose and core identity of ${signName}",
  "moon": "2-3 sentences about emotional nature, intuition and inner world shaped by ${moonPhaseName} moon",
  "ascendant": "${ascName ? `2-3 sentences about outer personality, first impression and social mask of ${ascName} ascendant` : 'Not calculated yet — birth time needed'}",
  "synthesis": "1 poetic sentence combining all three elements into a unique cosmic identity"
}`
    : `Jesteś doświadczonym astrologiem. Stwórz krótki profil kosmiczny dla osoby z:
- Znak Słońca: ${signName}
- Faza Księżyca urodzenia: ${moonPhaseName}
- Ascendent: ${ascName || 'nieznany'}

Zwróć TYLKO surowy JSON (bez markdown):
{
  "sun": "2-3 zdania o osobowości, celu życiowym i rdzennej tożsamości znaku ${signName}",
  "moon": "2-3 zdania o naturze emocjonalnej, intuicji i wewnętrznym świecie ukształtowanym przez Księżyc ${moonPhaseName}",
  "ascendant": "${ascName ? `2-3 zdania o zewnętrznej osobowości, pierwszym wrażeniu i masce społecznej ascendentu ${ascName}` : 'Nie obliczono — potrzebna godzina urodzenia'}",
  "synthesis": "1 poetyckie zdanie łączące wszystkie trzy elementy w unikalną kosmiczną tożsamość"
}`;

  // 'llama-3.1-8b-instant' zostało wycofane przez Groq 16.08.2026 (patrz
  // console.groq.com/docs/deprecations) — ta funkcja realnie nie działała
  // od dwóch tygodni. Zamiennik zgodny z oficjalną rekomendacją Groq.
  const parsed = await callLLMForJson(prompt, { model: 'openai/gpt-oss-20b', maxTokens: 500, reasoningEffort: 'low' });
  if (!parsed) throw new Error('Nie udało się wygenerować profilu kosmicznego');
  return parsed;
}

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, ImageBackground, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { load, save } from '../utils/storage';
import AdBanner from '../components/AdBanner';
import i18n from '../utils/i18n';
import { fetchWeeklyEnergy, fetchCosmicEvents, getWeekNumber } from '../utils/astro';

// ─── Pomocnicze ─────────────────────────────────────────────────────────────

// Planeta dnia — klasyczny system 7 planet (pon=Księżyc, wt=Mars, śr=Merkury...)
const PLANETS_PL = [
  { name: 'Słońce',   emoji: '☀️', day: 'Niedziela', color: '#f4d03f', desc: 'Dzień energii, siły woli i wyrażania siebie. Świeć swoim światłem.' },
  { name: 'Księżyc',  emoji: '🌙', day: 'Poniedziałek', color: '#aab7b8', desc: 'Dzień intuicji, emocji i wewnętrznego świata. Słuchaj serca.' },
  { name: 'Mars',     emoji: '♂️', day: 'Wtorek', color: '#e74c3c', desc: 'Dzień działania, odwagi i determinacji. Działaj zdecydowanie.' },
  { name: 'Merkury',  emoji: '☿', day: 'Środa', color: '#3498db', desc: 'Dzień komunikacji, myślenia i nauki. Wyrażaj myśli jasno.' },
  { name: 'Jowisz',   emoji: '♃', day: 'Czwartek', color: '#9b59b6', desc: 'Dzień obfitości, mądrości i ekspansji. Myśl szeroko.' },
  { name: 'Wenus',    emoji: '♀️', day: 'Piątek', color: '#fd79a8', desc: 'Dzień miłości, piękna i harmonii. Otwórz serce.' },
  { name: 'Saturn',   emoji: '♄', day: 'Sobota', color: '#7f8c8d', desc: 'Dzień struktury, dyscypliny i odpowiedzialności. Buduj fundamenty.' },
];

const PLANETS_EN = [
  { name: 'Sun',     emoji: '☀️', day: 'Sunday',    color: '#f4d03f', desc: 'Day of energy, willpower and self-expression. Let your light shine.' },
  { name: 'Moon',    emoji: '🌙', day: 'Monday',    color: '#aab7b8', desc: 'Day of intuition, emotions and inner world. Listen to your heart.' },
  { name: 'Mars',    emoji: '♂️', day: 'Tuesday',   color: '#e74c3c', desc: 'Day of action, courage and determination. Act decisively.' },
  { name: 'Mercury', emoji: '☿', day: 'Wednesday', color: '#3498db', desc: 'Day of communication, thinking and learning. Express thoughts clearly.' },
  { name: 'Jupiter', emoji: '♃', day: 'Thursday',  color: '#9b59b6', desc: 'Day of abundance, wisdom and expansion. Think big.' },
  { name: 'Venus',   emoji: '♀️', day: 'Friday',    color: '#fd79a8', desc: 'Day of love, beauty and harmony. Open your heart.' },
  { name: 'Saturn',  emoji: '♄', day: 'Saturday',  color: '#7f8c8d', desc: 'Day of structure, discipline and responsibility. Build foundations.' },
];

function getPlanetOfDay(lang) {
  const dow = new Date().getDay(); // 0=Sun, 1=Mon...
  const planets = lang === 'en' ? PLANETS_EN : PLANETS_PL;
  return planets[dow];
}

// Afirmacje — deterministyczne, seed z daty (0 API calls)
const AFFIRMATIONS_PL = [
  'Jestem połączony z mądrością wszechświata.',
  'Kosmiczne energie wspierają każdy mój krok.',
  'Otwieram się na obfitość, która płynie ku mnie.',
  'Moje serce jest zsynchronizowane z rytmem gwiazd.',
  'Jestem gotowy na transformację, którą niesie dzień.',
  'Wszechświat prowadzi mnie ku mojemu przeznaczeniu.',
  'Każda chwila jest darem kosmicznej energii.',
  'Jestem w harmonii z cyklami księżyca i słońca.',
  'Moja intuicja jest połączona z wyższą mądrością.',
  'Przyciągam do siebie to, czego naprawdę potrzebuję.',
  'Gwiazdy oświetlają moją drogę ku spełnieniu.',
  'Jestem częścią nieskończonej kosmicznej tkaniny.',
  'Z każdym oddechem wchłaniam kosmiczną energię.',
  'Moje marzenia są odzwierciedleniem mojego przeznaczenia.',
  'Jestem gotowy przyjąć cuda, które czekają na mnie.',
  'Kosmos wspiera mój wzrost i ewolucję.',
  'Jestem otwarty na sygnały, które wysyła mi wszechświat.',
  'Moja dusza zna drogę — ufam jej prowadzeniu.',
  'Każdy dzień przynosi nowe kosmiczne możliwości.',
  'Jestem zestrojony z energią tego wyjątkowego dnia.',
  'Wszechświat sprzyja odważnym i otwartym sercem.',
  'Płynę z kosmicznym nurtem, nie walczę z nim.',
  'Moje myśli kształtują moją kosmiczną rzeczywistość.',
  'Jestem wdzięczny za każdą gwiazdę na moim niebie.',
  'Kosmiczna mądrość przemawia przez moją intuicję.',
  'Jestem bezpieczny w objęciach wszechświata.',
  'Nowe energie przynoszą nowe, piękne możliwości.',
  'Moje serce bije w rytmie kosmicznej harmonii.',
  'Zaufałem procesowi — wszechświat ma plan.',
  'Każda planeta wspiera mój unikalny cel na ziemi.',
];

const AFFIRMATIONS_EN = [
  'I am connected to the wisdom of the universe.',
  'Cosmic energies support my every step.',
  'I open myself to the abundance flowing toward me.',
  'My heart is synchronized with the rhythm of the stars.',
  'I am ready for the transformation this day brings.',
  'The universe guides me toward my destiny.',
  'Every moment is a gift of cosmic energy.',
  'I am in harmony with the cycles of the moon and sun.',
  'My intuition is connected to higher wisdom.',
  'I attract what I truly need into my life.',
  'Stars illuminate my path toward fulfillment.',
  'I am part of the infinite cosmic tapestry.',
  'With every breath I absorb cosmic energy.',
  'My dreams reflect my true destiny.',
  'I am ready to receive the miracles waiting for me.',
  'The cosmos supports my growth and evolution.',
  'I am open to signals the universe sends me.',
  'My soul knows the way — I trust its guidance.',
  'Every day brings new cosmic possibilities.',
  'I am attuned to the energy of this unique day.',
  'The universe favors the brave and open-hearted.',
  'I flow with the cosmic current, not against it.',
  'My thoughts shape my cosmic reality.',
  'I am grateful for every star in my sky.',
  'Cosmic wisdom speaks through my intuition.',
  'I am safe in the embrace of the universe.',
  'New energies bring beautiful new possibilities.',
  'My heart beats in rhythm with cosmic harmony.',
  'I trust the process — the universe has a plan.',
  'Every planet supports my unique purpose on earth.',
];

function getDailyAffirmation(lang) {
  const dateStr = new Date().toDateString();
  const seed = dateStr.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const list = lang === 'en' ? AFFIRMATIONS_EN : AFFIRMATIONS_PL;
  return list[seed % list.length];
}

// Fetch dla energii tygodnia/miesiąca oraz klient AI mieszkają teraz
// w utils/astro.js (fetchWeeklyEnergy / fetchCosmicEvents) — wcześniej
// ten ekran miał własną, niezależną (i mniej odporną na błędy) kopię
// tego samego kodu sieciowego.

const INTENSITY_COLOR = {
  'niska': '#3498db', 'średnia': '#d4af37', 'wysoka': '#e67e22', 'bardzo wysoka': '#e74c3c',
  'low': '#3498db', 'medium': '#d4af37', 'high': '#e67e22', 'very high': '#e74c3c',
};

// ─── Komponenty ─────────────────────────────────────────────────────────────

function PulsingDot({ color }) {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
    ])).start();
  }, []);
  return <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, opacity: anim }} />;
}

function IntensityBar({ intensity }) {
  const color = INTENSITY_COLOR[intensity] || '#d4af37';
  const levels = { 'niska': 1, 'low': 1, 'średnia': 2, 'medium': 2, 'wysoka': 3, 'high': 3, 'bardzo wysoka': 4, 'very high': 4 };
  const level = levels[intensity] || 2;
  return (
    <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
      {[1, 2, 3, 4].map(i => (
        <View key={i} style={{
          width: 18, height: 5, borderRadius: 3,
          backgroundColor: i <= level ? color : 'rgba(255,255,255,0.08)',
        }} />
      ))}
    </View>
  );
}

// ─── Główny komponent ────────────────────────────────────────────────────────

export default function CosmosScreen() {
  const [events, setEvents] = useState([]);
  const [weeklyEnergy, setWeeklyEnergy] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [weeklyError, setWeeklyError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const t = (key) => i18n.t(key);
  const lang = i18n.locale;
  const month = new Date().toLocaleDateString(lang === 'en' ? 'en-GB' : 'pl-PL', { month: 'long', year: 'numeric' });
  const monthCacheKey = `cosmos_${lang}_${new Date().toLocaleDateString('pl-PL', { month: 'numeric', year: 'numeric' })}`;
  const weekCacheKey = `cosmos_week2_${lang}_${new Date().getFullYear()}_${getWeekNumber(new Date())}`;

  const planet = getPlanetOfDay(lang);
  const affirmation = getDailyAffirmation(lang);

  useEffect(() => {
    loadAll();
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  const loadAll = async () => {
    loadEvents();
    loadWeeklyEnergy();
  };

  const loadEvents = async () => {
    setLoadingEvents(true); setError('');
    try {
      const cached = await load(monthCacheKey);
      if (cached && cached.events) { setEvents(cached.events); setLoadingEvents(false); return; }
      const data = await fetchCosmicEvents(lang);
      await save(monthCacheKey, data);
      setEvents(data.events || []);
    } catch { setError(t('cosmos.error')); }
    setLoadingEvents(false);
  };

  const loadWeeklyEnergy = async () => {
    setLoadingWeekly(true); setWeeklyError('');
    try {
      const cached = await load(weekCacheKey);
      if (cached && cached.energy) { setWeeklyEnergy(cached); setLoadingWeekly(false); return; }
      const data = await fetchWeeklyEnergy(lang);
      await save(weekCacheKey, data);
      setWeeklyEnergy(data);
    } catch { setWeeklyError(lang === 'en' ? 'Could not load weekly energy.' : 'Nie udało się załadować energii tygodnia.'); }
    setLoadingWeekly(false);
  };

  const refresh = async () => {
    setLoadingEvents(true); setError(''); setSelected(null);
    try {
      const data = await fetchCosmicEvents(lang);
      await save(monthCacheKey, data);
      setEvents(data.events || []);
    } catch { setError(t('cosmos.error')); }
    setLoadingEvents(false);
  };

  const refreshWeekly = async () => {
    setLoadingWeekly(true); setWeeklyError('');
    try {
      const data = await fetchWeeklyEnergy(lang);
      await save(weekCacheKey, data);
      setWeeklyEnergy(data);
    } catch { setWeeklyError(lang === 'en' ? 'Could not load weekly energy.' : 'Nie udało się załadować energii tygodnia.'); }
    setLoadingWeekly(false);
  };

  const getIntensityLabel = (intensity) => {
    const map = {
      'niska': t('cosmos.intensity.low'), 'średnia': t('cosmos.intensity.medium'),
      'wysoka': t('cosmos.intensity.high'), 'bardzo wysoka': t('cosmos.intensity.veryHigh'),
      'low': t('cosmos.intensity.low'), 'medium': t('cosmos.intensity.medium'),
      'high': t('cosmos.intensity.high'), 'very high': t('cosmos.intensity.veryHigh'),
    };
    return map[intensity] || t('cosmos.intensity.medium');
  };

  const hasRetrograde = weeklyEnergy?.retrograde &&
    typeof weeklyEnergy.retrograde === 'string' &&
    weeklyEnergy.retrograde.trim() !== '' &&
    weeklyEnergy.retrograde.toLowerCase() !== 'none' &&
    weeklyEnergy.retrograde.toLowerCase() !== 'brak';

  return (
    <ImageBackground source={require('../../assets/bg.png')} style={{ flex: 1 }} resizeMode="cover">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim, width: '100%', alignItems: 'center' }}>

            {/* NAGŁÓWEK */}
            <View style={styles.headerBlock}>
              <Text style={styles.pageTitle}>✦ {t('cosmos.title')} ✦</Text>
              <View style={styles.divider} />
              <Text style={styles.pageSubtitle}>{t('cosmos.subtitle')}{month}</Text>
            </View>

            {/* Zastrzeżenie interpretacyjne — przeniesione na samą górę i
                odchudzone do zwykłego podpisu (bez ramki/tła), bo jako pełna
                karta w środku scrolla wyglądało jak kolejna treść, a nie jak
                nota prawna dotycząca całego ekranu. */}
            <Text style={styles.disclaimerCaption}>{t('cosmos.disclaimer')}</Text>

            {/* ═══ SEKCJA: DZIŚ ═══ */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                ☀️ {lang === 'en' ? 'TODAY' : 'DZIŚ'}
              </Text>
            </View>

            {/* PLANETA DNIA */}
            <View style={styles.planetCard}>
              <LinearGradient
                colors={[planet.color + '18', 'transparent']}
                style={styles.planetGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <View style={styles.planetLeft}>
                  <View style={[styles.planetEmojiBox, { borderColor: planet.color + '60' }]}>
                    <Text style={styles.planetEmoji}>{planet.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planetLabel}>
                      {lang === 'en' ? 'Planet of the Day' : 'Planeta Dnia'}
                    </Text>
                    <Text style={[styles.planetName, { color: planet.color }]}>{planet.name}</Text>
                    <Text style={styles.planetDay}>{planet.day}</Text>
                  </View>
                  <PulsingDot color={planet.color} />
                </View>
                <Text style={styles.planetDesc}>{planet.desc}</Text>
              </LinearGradient>
            </View>

            {/* AFIRMACJA DNIA */}
            <View style={styles.affirmationCard}>
              <View style={styles.affirmationHeader}>
                <Text style={styles.affirmationLabel}>
                  ✨ {lang === 'en' ? 'Cosmic Affirmation' : 'Afirmacja Kosmiczna'}
                </Text>
              </View>
              <Text style={styles.affirmationText}>„{affirmation}"</Text>
            </View>

            {/* ═══ SEKCJA: TYDZIEŃ ═══ */}
            <View style={[styles.sectionHeader, { marginTop: 8 }]}>
              <Text style={styles.sectionTitle}>
                🪐 {lang === 'en' ? 'THIS WEEK' : 'TYDZIEŃ'}
              </Text>
            </View>

            {loadingWeekly && (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#d4af37" size="small" />
                <Text style={styles.loadingLabel}>
                  {lang === 'en' ? 'Reading weekly energies...' : 'Odczytuję energie tygodnia...'}
                </Text>
              </View>
            )}

            {weeklyError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{weeklyError}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={refreshWeekly}>
                  <Text style={styles.retryBtnText}>{t('cosmos.retry')}</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {weeklyEnergy && !loadingWeekly && (
              <View style={styles.weeklyCard}>
                <View style={styles.weeklyTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.weeklyTitle}>{weeklyEnergy.title}</Text>
                    <View style={styles.focusBadge}>
                      <Text style={styles.focusText}>
                        {lang === 'en' ? 'Focus: ' : 'Motyw: '}{weeklyEnergy.focus}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.weeklyDivider} />
                <Text style={styles.weeklyEnergy}>{weeklyEnergy.energy}</Text>

                {hasRetrograde && (
                  <View style={styles.retrogradeBox}>
                    <Text style={styles.retrogradeIcon}>⚠️</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.retrogradeTitle}>
                        {lang === 'en' ? 'Retrograde' : 'Retrograda'}
                      </Text>
                      <Text style={styles.retrogradeText}>{weeklyEnergy.retrograde}</Text>
                    </View>
                  </View>
                )}

                <View style={styles.tipBox}>
                  <Text style={styles.tipIcon}>💡</Text>
                  <Text style={styles.tipText}>{weeklyEnergy.tip}</Text>
                </View>

                <TouchableOpacity style={styles.refreshWeeklyBtn} onPress={refreshWeekly}>
                  <Text style={styles.refreshWeeklyText}>
                    ↻ {lang === 'en' ? 'Refresh week' : 'Odśwież tydzień'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ═══ SEKCJA: MIESIĄC ═══ */}
            <View style={[styles.sectionHeader, { marginTop: 8 }]}>
              <Text style={styles.sectionTitle}>
                🌌 {lang === 'en' ? 'THIS MONTH' : 'MIESIĄC'}
              </Text>
            </View>

            {loadingEvents && (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#d4af37" size="large" />
                <Text style={styles.loadingLabel}>{t('cosmos.loading')}</Text>
                <Text style={styles.loadingHint}>{t('cosmos.loadingHint')}</Text>
              </View>
            )}

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={loadEvents}>
                  <Text style={styles.retryBtnText}>{t('cosmos.retry')}</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {events.map((event, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.eventCard, selected === i && styles.eventCardActive]}
                onPress={() => setSelected(selected === i ? null : i)}
                activeOpacity={0.85}
              >
                <View style={styles.eventHeader}>
                  <View style={styles.eventEmojiBox}>
                    <Text style={styles.eventEmoji}>{event.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.eventName}>{event.name}</Text>
                    <Text style={styles.eventDate}>🗓  {event.date}</Text>
                  </View>
                  <View style={[styles.intensityBadge, { borderColor: INTENSITY_COLOR[event.intensity] || '#d4af37' }]}>
                    <Text style={[styles.intensityText, { color: INTENSITY_COLOR[event.intensity] || '#d4af37' }]}>{event.type}</Text>
                  </View>
                </View>

                <View style={styles.energyRow}>
                  <PulsingDot color={INTENSITY_COLOR[event.intensity] || '#d4af37'} />
                  <Text style={[styles.energyLabel, { color: INTENSITY_COLOR[event.intensity] || '#d4af37' }]}>
                    {getIntensityLabel(event.intensity)}
                  </Text>
                  <IntensityBar intensity={event.intensity} />
                </View>

                {selected === i && (
                  <View style={styles.eventExpanded}>
                    <View style={styles.expandDivider} />
                    <View style={styles.expandSection}>
                      <Text style={styles.expandLabel}>{t('cosmos.astroEnergy')}</Text>
                      <Text style={styles.expandText}>{event.astronomy}</Text>
                    </View>
                    <View style={styles.expandSection}>
                      <Text style={styles.expandLabel}>{t('cosmos.meaning')}</Text>
                      <Text style={styles.expandText}>{event.astrology}</Text>
                    </View>
                  </View>
                )}

                <Text style={styles.tapHint}>{selected === i ? t('cosmos.collapse') : t('cosmos.expand')}</Text>
              </TouchableOpacity>
            ))}

            {events.length > 0 && !loadingEvents && (
              <TouchableOpacity style={styles.refreshBtn} onPress={refresh}>
                <Text style={styles.refreshText}>{t('cosmos.refresh')}</Text>
              </TouchableOpacity>
            )}

            <AdBanner />
            <View style={{ height: 16 }} />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center' },

  // Nagłówek
  headerBlock: { alignItems: 'center', marginTop: 8, marginBottom: 20, width: '100%' },
  pageTitle: { fontFamily: 'Cinzel_700Bold', fontSize: 18, color: '#d4af37', letterSpacing: 3 },
  divider: { width: 50, height: 1, backgroundColor: 'rgba(212,175,55,0.4)', marginVertical: 10 },
  pageSubtitle: { fontFamily: 'Raleway_300Light', color: '#ffffff', fontSize: 12, fontStyle: 'italic', letterSpacing: 0.5, textTransform: 'capitalize' },

  // Planeta dnia
  planetCard: { width: '100%', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)', overflow: 'hidden', marginBottom: 14 },
  planetGradient: { padding: 18 },
  planetLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  planetEmojiBox: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  planetEmoji: { fontSize: 26 },
  planetLabel: { fontFamily: 'Raleway_400Regular', color: '#ffffff', fontSize: 10, letterSpacing: 1.5, marginBottom: 2 },
  planetName: { fontFamily: 'Cinzel_700Bold', fontSize: 18, letterSpacing: 2 },
  planetDay: { fontFamily: 'Raleway_300Light', color: '#ffffff', fontSize: 11, marginTop: 2 },
  planetDesc: { fontFamily: 'Raleway_400Regular', color: '#ffffff', fontSize: 13, lineHeight: 21, letterSpacing: 0.3 },

  // Afirmacja
  affirmationCard: { width: '100%', backgroundColor: 'rgba(212,175,55,0.05)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)', padding: 18, marginBottom: 20 },
  affirmationHeader: { marginBottom: 10 },
  affirmationLabel: { fontFamily: 'Cinzel_600SemiBold', color: '#d4af37', fontSize: 10, letterSpacing: 2 },
  affirmationText: { fontFamily: 'Raleway_300Light', color: '#ffffff', fontSize: 15, lineHeight: 26, fontStyle: 'italic', letterSpacing: 0.4 },

  // Sekcja
  sectionHeader: { alignSelf: 'flex-start', marginBottom: 12 },
  sectionTitle: { fontFamily: 'Cinzel_700Bold', color: '#d4af37', fontSize: 13, letterSpacing: 2 },

  // Energia tygodnia
  weeklyCard: { width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)', marginBottom: 16 },
  weeklyTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  weeklyTitle: { fontFamily: 'Cinzel_700Bold', color: '#fff', fontSize: 15, letterSpacing: 1, marginBottom: 8 },
  focusBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(212,175,55,0.12)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)' },
  focusText: { fontFamily: 'Raleway_600SemiBold', color: '#d4af37', fontSize: 11, letterSpacing: 0.5 },
  weeklyDivider: { height: 1, backgroundColor: 'rgba(212,175,55,0.12)', marginVertical: 14 },
  weeklyEnergy: { fontFamily: 'Raleway_400Regular', color: '#ffffff', fontSize: 14, lineHeight: 24, letterSpacing: 0.3, marginBottom: 14 },
  retrogradeBox: { flexDirection: 'row', gap: 10, backgroundColor: 'rgba(231,76,60,0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(231,76,60,0.25)', padding: 12, marginBottom: 12, alignItems: 'flex-start' },
  retrogradeIcon: { fontSize: 16 },
  retrogradeTitle: { fontFamily: 'Cinzel_700Bold', color: '#e74c3c', fontSize: 10, letterSpacing: 1.5, marginBottom: 4 },
  retrogradeText: { fontFamily: 'Raleway_400Regular', color: '#ffffff', fontSize: 13, lineHeight: 20 },
  tipBox: { flexDirection: 'row', gap: 10, backgroundColor: 'rgba(212,175,55,0.06)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.15)', padding: 12, alignItems: 'flex-start' },
  tipIcon: { fontSize: 14 },
  tipText: { fontFamily: 'Raleway_300Light', flex: 1, color: '#ffffff', fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
  refreshWeeklyBtn: { alignSelf: 'center', marginTop: 14, paddingHorizontal: 20, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)' },
  refreshWeeklyText: { fontFamily: 'Raleway_600SemiBold', color: '#d4af37', fontSize: 11, letterSpacing: 1 },

  // Info — dawny "infoBox" (pełna karta z ramką) zastąpiony małym podpisem
  // pod nagłówkiem ekranu, żeby nota prawna nie wyglądała jak kolejna treść
  // wciśnięta w środek scrolla.
  infoBox: { backgroundColor: 'rgba(212,175,55,0.06)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(212,175,55,0.15)', padding: 14, width: '100%', marginBottom: 20 },
  infoText: { fontFamily: 'Raleway_300Light', color: '#ffffff', fontSize: 12, lineHeight: 20, fontStyle: 'italic', letterSpacing: 0.3 },
  disclaimerCaption: { fontFamily: 'Raleway_300Light', color: '#9c8fb5', fontSize: 10, lineHeight: 15, fontStyle: 'italic', letterSpacing: 0.2, textAlign: 'center', width: '100%', marginBottom: 18, paddingHorizontal: 8 },

  // Loading / error
  loadingBox: { alignItems: 'center', paddingVertical: 30, gap: 12 },
  loadingLabel: { fontFamily: 'Cinzel_600SemiBold', color: '#d4af37', fontSize: 13, letterSpacing: 1 },
  loadingHint: { fontFamily: 'Raleway_300Light', color: '#ffffff', fontSize: 11, fontStyle: 'italic' },
  errorBox: { alignItems: 'center', paddingVertical: 20, gap: 12 },
  errorText: { fontFamily: 'Raleway_400Regular', color: '#e74c3c', fontSize: 13, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(212,175,55,0.4)' },
  retryBtnText: { fontFamily: 'Raleway_600SemiBold', color: '#d4af37', fontSize: 12, letterSpacing: 1 },

  // Karty energii
  eventCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 18, width: '100%', borderWidth: 1, borderColor: 'rgba(212,175,55,0.15)', marginBottom: 12 },
  eventCardActive: { borderColor: 'rgba(212,175,55,0.4)', backgroundColor: 'rgba(255,255,255,0.06)' },
  eventHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  eventEmojiBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(212,175,55,0.08)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)', justifyContent: 'center', alignItems: 'center' },
  eventEmoji: { fontSize: 24 },
  eventName: { fontFamily: 'Cinzel_600SemiBold', color: '#fff', fontSize: 13, letterSpacing: 0.5, marginBottom: 3 },
  eventDate: { fontFamily: 'Raleway_300Light', color: '#ffffff', fontSize: 11, letterSpacing: 0.3 },
  intensityBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  intensityText: { fontFamily: 'Raleway_700Bold', fontSize: 10, letterSpacing: 0.5 },
  energyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  energyLabel: { fontFamily: 'Raleway_600SemiBold', fontSize: 11, letterSpacing: 0.5, flex: 1 },
  eventExpanded: { marginTop: 4 },
  expandDivider: { height: 1, backgroundColor: 'rgba(212,175,55,0.12)', marginBottom: 14 },
  expandSection: { marginBottom: 14 },
  expandLabel: { fontFamily: 'Cinzel_700Bold', color: '#d4af37', fontSize: 10, letterSpacing: 1.5, marginBottom: 6 },
  expandText: { fontFamily: 'Raleway_400Regular', color: '#ffffff', fontSize: 14, lineHeight: 24, letterSpacing: 0.3 },
  tapHint: { fontFamily: 'Raleway_300Light', color: '#ffffff', fontSize: 10, fontStyle: 'italic', textAlign: 'right', marginTop: 4, letterSpacing: 0.3 },
  refreshBtn: { paddingVertical: 12, paddingHorizontal: 32, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)', marginTop: 8 },
  refreshText: { fontFamily: 'Raleway_600SemiBold', color: '#d4af37', fontSize: 12, letterSpacing: 1.5 },
});

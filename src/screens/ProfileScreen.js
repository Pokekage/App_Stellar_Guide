import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Switch, Linking, Alert,
  TextInput, ImageBackground, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { load, save, remove, KEYS } from '../utils/storage';
import { calcAscendant, getMoonPhase, fetchCosmicProfile } from '../utils/astro';
import { SIGNS } from '../utils/astro';
import AdBanner from '../components/AdBanner';
import i18n, { setLanguage, getLanguage } from '../utils/i18n';
import {
  scheduleDailyNotification, cancelDailyNotification, requestNotificationPermission,
  scheduleMoonPhaseNotification, cancelMoonPhaseNotification,
} from '../utils/notifications';
import { openConsentSettings } from '../utils/consent';
import { showRewardedAd } from '../utils/ads';
import { getLifePathFromDateStr, getLifePathMeaning } from '../utils/numerology';

const SOCIALS = [
  { label: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61589331091991', bg: '#1877F2', icon: 'f', iconColor: '#fff' },
  { label: 'Instagram', url: 'https://www.instagram.com/gwiezdnyprzewodnik/', gradientColors: ['#f09433', '#e6683c', '#dc2743', '#cc2366', '#bc1888'], icon: '📷', isGradient: true },
  { label: 'TikTok', url: 'https://www.tiktok.com/@gwiezdnyprzewodnikpl', bg: '#000', icon: '♪', iconColor: '#fff', hasBorder: true },
];

function SocialIcon({ social }) {
  if (social.isGradient) {
    return (
      <LinearGradient colors={social.gradientColors} style={styles.socialIconBox} start={{ x: 0.2, y: 0.8 }} end={{ x: 0.8, y: 0.2 }}>
        <Text style={styles.socialIconEmoji}>{social.icon}</Text>
      </LinearGradient>
    );
  }
  return (
    <View style={[styles.socialIconBox, { backgroundColor: social.bg }, social.hasBorder && { borderWidth: 1.5, borderColor: '#69C9D0' }]}>
      <Text style={[styles.socialIconText, { color: social.iconColor }]}>{social.icon}</Text>
    </View>
  );
}

function isValidDate(str) {
  if (!str) return false;
  const parts = str.split('.');
  if (parts.length !== 3) return false;
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const y = parseInt(parts[2], 10);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return false;
  if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > 2099) return false;
  return true;
}

// fetchCosmicProfile mieszka teraz w utils/astro.js razem z resztą klienta AI
// (wcześniej ten ekran miał własną, trzecią kopię tego samego kodu sieciowego,
// bez sprawdzania res.ok — patrz astro.js).

// ─── Karta profilu kosmicznego ───────────────────────────────────────────────
function CosmicProfileCard({ userSign, birthDate, ascendant, lang }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('sun');

  const hasBirthDate = isValidDate(birthDate);
  const birthMoon = hasBirthDate ? getMoonPhase((() => {
    const p = birthDate.split('.');
    return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
  })()) : null;

  const signName = lang === 'en' ? (userSign.nameEn || userSign.name) : userSign.name;
  const moonName = birthMoon ? (lang === 'en' ? birthMoon.nameEn : birthMoon.name) : null;
  const ascName = ascendant ? (lang === 'en' ? ascendant.nameEn : ascendant.name) : null;

  const cacheKey = `cosmic_profile_${userSign.key}_${birthDate || 'nodate'}_${ascendant?.key || 'noacc'}_${lang}`;

  useEffect(() => {
    loadProfile();
  }, [userSign.key, birthDate, ascendant?.key, lang]);

  const loadProfile = async () => {
    try {
      const cached = await load(cacheKey);
      if (cached && cached.sun) { setProfile(cached); return; }
      if (!hasBirthDate) return; // nie generuj bez daty
      generateProfile();
    } catch {}
  };

  const generateProfile = async () => {
    if (!hasBirthDate) return;
    setLoading(true); setError('');
    try {
      const data = await fetchCosmicProfile(signName, moonName || '?', ascName, lang);
      await save(cacheKey, data);
      setProfile(data);
    } catch {
      setError(lang === 'en' ? 'Could not generate profile.' : 'Nie udało się wygenerować profilu.');
    }
    setLoading(false);
  };

  // Ręczne "Wygeneruj ponownie" (gdy profil już istnieje) jest teraz za
  // reklamą nagradzaną — pierwsze wygenerowanie profilu (loadProfile/
  // generateProfile powyżej) zostaje darmowe, płatne "obejrzeniem reklamy"
  // jest tylko dodatkowe odświeżenie już posiadanego profilu.
  const handleRegeneratePress = () => {
    showRewardedAd(
      () => generateProfile(),
      () => Alert.alert(
        lang === 'en' ? 'Ad loading' : 'Reklama się ładuje',
        lang === 'en' ? "The ad isn't ready yet — try again in a moment." : 'Reklama nie jest jeszcze gotowa — spróbuj za chwilę.'
      )
    );
  };

  const TABS = [
    { id: 'sun',        icon: '☀️', label: lang === 'en' ? 'Sun' : 'Słońce',      color: '#f4d03f', sign: userSign },
    { id: 'moon',       icon: '🌙', label: lang === 'en' ? 'Moon' : 'Księżyc',    color: '#aab7b8', sign: null },
    { id: 'ascendant',  icon: '⬆️', label: lang === 'en' ? 'Ascendant' : 'Asc',  color: '#9b59b6', sign: ascendant },
  ];

  const activeTabData = TABS.find(t => t.id === activeTab);
  const activeColor = activeTabData?.color || '#d4af37';

  return (
    <View style={styles.cosmicCard}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardIcon}>🔮</Text>
        <Text style={styles.cardTitle}>{lang === 'en' ? 'COSMIC PROFILE' : 'PROFIL KOSMICZNY'}</Text>
      </View>
      <View style={styles.cardDivider} />

      {/* Trzy zakładki */}
      <View style={styles.cosmicTabs}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.cosmicTab, activeTab === tab.id && { borderColor: tab.color, backgroundColor: tab.color + '18' }]}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.cosmicTabIcon}>{tab.icon}</Text>
            <Text style={[styles.cosmicTabLabel, activeTab === tab.id && { color: tab.color }]}>{tab.label}</Text>
            {tab.sign && (
              <Text style={styles.cosmicTabSign}>{tab.sign.emoji}</Text>
            )}
            {tab.id === 'moon' && birthMoon && (
              <Text style={styles.cosmicTabSign}>{birthMoon.emoji}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Zawartość aktywnej zakładki */}
      {loading && (
        <View style={styles.cosmicLoading}>
          <ActivityIndicator color="#d4af37" size="small" />
          <Text style={styles.cosmicLoadingText}>
            {lang === 'en' ? 'Reading your cosmic blueprint...' : 'Odczytuję Twój kosmiczny plan...'}
          </Text>
        </View>
      )}

      {error ? (
        <View style={styles.cosmicError}>
          <Text style={styles.cosmicErrorText}>{error}</Text>
          <TouchableOpacity style={styles.cosmicRetryBtn} onPress={generateProfile}>
            <Text style={styles.cosmicRetryText}>{lang === 'en' ? 'Try again' : 'Spróbuj ponownie'}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!loading && !error && (
        <View style={styles.cosmicContent}>

          {/* SŁOŃCE */}
          {activeTab === 'sun' && (
            <View>
              <View style={styles.cosmicSignRow}>
                <Text style={{ fontSize: 36 }}>{userSign.emoji}</Text>
                <View>
                  <Text style={[styles.cosmicSignName, { color: '#f4d03f' }]}>{signName}</Text>
                  <Text style={styles.cosmicSignSub}>{userSign.dates}</Text>
                </View>
              </View>
              <Text style={styles.cosmicDesc}>
                {profile?.sun || (lang === 'en'
                  ? 'Your Sun sign defines your core identity, life purpose and the essence of who you are at your deepest level.'
                  : 'Twój znak Słońca definiuje rdzenną tożsamość, cel życiowy i istotę tego, kim jesteś na najgłębszym poziomie.')}
              </Text>
            </View>
          )}

          {/* KSIĘŻYC */}
          {activeTab === 'moon' && (
            <View>
              {!hasBirthDate ? (
                <View style={styles.cosmicMissingBox}>
                  <Text style={styles.cosmicMissingIcon}>📅</Text>
                  <Text style={styles.cosmicMissingText}>
                    {lang === 'en'
                      ? 'Enter your date of birth above to discover your birth moon phase.'
                      : 'Podaj datę urodzenia powyżej aby odkryć fazę Księżyca Twoich narodzin.'}
                  </Text>
                </View>
              ) : (
                <View>
                  <View style={styles.cosmicSignRow}>
                    <Text style={{ fontSize: 36 }}>{birthMoon?.emoji}</Text>
                    <View>
                      <Text style={[styles.cosmicSignName, { color: '#aab7b8' }]}>{moonName}</Text>
                      <Text style={styles.cosmicSignSub}>{lang === 'en' ? 'Birth Moon Phase' : 'Faza Księżyca Urodzenia'}</Text>
                    </View>
                  </View>
                  <Text style={styles.cosmicDesc}>
                    {profile?.moon || (lang === 'en'
                      ? 'Your birth moon phase shapes your emotional world, intuition and subconscious patterns.'
                      : 'Faza Księżyca Twoich narodzin kształtuje Twój świat emocjonalny, intuicję i podświadome wzorce.')}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ASCENDENT */}
          {activeTab === 'ascendant' && (
            <View>
              {!ascendant ? (
                <View style={styles.cosmicMissingBox}>
                  <Text style={styles.cosmicMissingIcon}>{!hasBirthDate ? '📅' : '🕐'}</Text>
                  <Text style={styles.cosmicMissingText}>
                    {!hasBirthDate
                      ? (lang === 'en' ? 'Enter date of birth first.' : 'Najpierw podaj datę urodzenia.')
                      : (lang === 'en' ? 'Enter birth time above to calculate your Ascendant.' : 'Podaj godzinę urodzenia powyżej aby obliczyć Ascendent.')}
                  </Text>
                </View>
              ) : (
                <View>
                  <View style={styles.cosmicSignRow}>
                    <Text style={{ fontSize: 36 }}>{ascendant.emoji}</Text>
                    <View>
                      <Text style={[styles.cosmicSignName, { color: '#9b59b6' }]}>{ascName}</Text>
                      <Text style={styles.cosmicSignSub}>{lang === 'en' ? 'Your Rising Sign' : 'Twój Znak Wschodzący'}</Text>
                    </View>
                  </View>
                  <Text style={styles.cosmicDesc}>
                    {profile?.ascendant || (lang === 'en'
                      ? 'Your Ascendant is the mask you show the world — how others perceive you before they truly know you.'
                      : 'Twój Ascendent to maska, którą pokazujesz światu — to jak inni Cię postrzegają zanim naprawdę Cię poznają.')}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Synteza — pokazuj gdy mamy profil i wszystkie dane */}
          {profile?.synthesis && hasBirthDate && (
            <View style={styles.synthBox}>
              <Text style={styles.synthLabel}>✦</Text>
              <Text style={styles.synthText}>{profile.synthesis}</Text>
            </View>
          )}

          {/* Przycisk generowania — gdy mamy datę ale brak profilu */}
          {!profile && !loading && hasBirthDate && (
            <TouchableOpacity style={styles.generateBtn} onPress={generateProfile} activeOpacity={0.85}>
              <Text style={styles.generateBtnText}>
                {lang === 'en' ? 'Generate Cosmic Profile  ✦' : 'Generuj Profil Kosmiczny  ✦'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Przycisk odświeżenia gdy profil istnieje — za reklamą nagradzaną */}
          {profile && !loading && (
            <TouchableOpacity style={styles.regenerateBtn} onPress={handleRegeneratePress}>
              <Text style={styles.regenerateBtnText}>📺 ↻ {lang === 'en' ? 'Regenerate' : 'Wygeneruj ponownie'}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Karta numerologii ──────────────────────────────────────────────────────
// Nowa, w pełni lokalna funkcja (bez wywołań AI, bez kosztu) — liczy liczbę
// drogi życia na podstawie już posiadanej daty urodzenia i pokazuje jej
// znaczenie. Widoczna tylko gdy użytkownik ma zapisaną poprawną datę.
function NumerologyCard({ birthDate, lang }) {
  const lifePath = getLifePathFromDateStr(birthDate);
  if (!lifePath) return null;
  const meaning = getLifePathMeaning(lifePath, lang);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardIcon}>🔢</Text>
        <Text style={styles.cardTitle}>{lang === 'en' ? 'NUMEROLOGY' : 'NUMEROLOGIA'}</Text>
      </View>
      <View style={styles.cardDivider} />
      <View style={styles.numerologyRow}>
        <View style={styles.numerologyBadge}>
          <Text style={styles.numerologyNumber}>{lifePath}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.numerologyTitle}>{meaning?.title}</Text>
          <Text style={styles.numerologySub}>{lang === 'en' ? 'Your Life Path Number' : 'Twoja Liczba Drogi Życia'}</Text>
        </View>
      </View>
      <Text style={styles.cosmicDesc}>{meaning?.text}</Text>
    </View>
  );
}

// ─── Główny ekran ────────────────────────────────────────────────────────────
export default function ProfileScreen({ userSign, onSignChange, onAscendantChange }) {
  const [favorites, setFavorites] = useState([]);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifHour, setNotifHour] = useState(8);
  const [moonNotifEnabled, setMoonNotifEnabled] = useState(false);
  const [showSignPicker, setShowSignPicker] = useState(false);
  const [currentLang, setCurrentLang] = useState(getLanguage());
  const [userName, setUserName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const [birthDate, setBirthDate] = useState('');
  const [birthDateInput, setBirthDateInput] = useState('');
  const [editingBirthDate, setEditingBirthDate] = useState(false);
  const [birthDateError, setBirthDateError] = useState('');

  const [birthTime, setBirthTime] = useState('');
  const [birthTimeInput, setBirthTimeInput] = useState('');
  const [editingBirthTime, setEditingBirthTime] = useState(false);
  const [birthTimeError, setBirthTimeError] = useState('');

  const [birthPlace, setBirthPlace] = useState('');
  const [birthPlaceInput, setBirthPlaceInput] = useState('');
  const [editingBirthPlace, setEditingBirthPlace] = useState(false);

  const [ascendant, setAscendant] = useState(null);

  const t = (key) => i18n.t(key);
  const lang = currentLang;

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const favs = await load(KEYS.FAVORITES) || [];
    setFavorites(favs);
    const h = await load(KEYS.NOTIF_HOUR);
    if (h !== null) { setNotifHour(h); setNotifEnabled(true); }
    const name = await load(KEYS.USER_NAME);
    if (name) setUserName(name);
    const bd = await load(KEYS.USER_BIRTH);
    if (bd) setBirthDate(bd);
    const bt = await load(KEYS.USER_BIRTH_TIME);
    if (bt) setBirthTime(bt);
    const bp = await load(KEYS.USER_BIRTH_PLACE);
    if (bp) setBirthPlace(bp);
    const moonOn = await load(KEYS.MOON_NOTIF);
    setMoonNotifEnabled(!!moonOn);
    if (bd && bt) {
      const asc = calcAscendant(bd, bt);
      setAscendant(asc);
    }
  };

  const recalcAscendant = (date, time) => {
    const newAsc = (date && time) ? calcAscendant(date, time) : null;
    setAscendant(newAsc);
    if (onAscendantChange) onAscendantChange(newAsc, date);
    return newAsc;
  };

  const saveBirthDate = async () => {
    const trimmed = birthDateInput.trim();
    setBirthDateError('');
    if (!isValidDate(trimmed)) {
      setBirthDateError(lang === 'en' ? 'Invalid date (DD.MM.YYYY)' : 'Nieprawidłowa data (DD.MM.RRRR)');
      return;
    }
    await save(KEYS.USER_BIRTH, trimmed);
    setBirthDate(trimmed);
    setEditingBirthDate(false);
    recalcAscendant(trimmed, birthTime);
  };

  const saveBirthTime = async () => {
    const trimmed = birthTimeInput.trim();
    setBirthTimeError('');
    if (!trimmed || !/^\d{1,2}:\d{2}$/.test(trimmed)) {
      setBirthTimeError(lang === 'en' ? 'Invalid time (HH:MM)' : 'Nieprawidłowa godzina (GG:MM)');
      return;
    }
    await save(KEYS.USER_BIRTH_TIME, trimmed);
    setBirthTime(trimmed);
    setEditingBirthTime(false);
    recalcAscendant(birthDate, trimmed);
  };

  const saveBirthPlace = async () => {
    const trimmed = birthPlaceInput.trim();
    if (!trimmed) return;
    await save(KEYS.USER_BIRTH_PLACE, trimmed);
    setBirthPlace(trimmed);
    setEditingBirthPlace(false);
  };

  const saveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    await save(KEYS.USER_NAME, trimmed);
    setUserName(trimmed);
    setEditingName(false);
    if (notifEnabled) await scheduleDailyNotification(notifHour, lang, userSign, trimmed);
  };

  const toggleNotif = async (val) => {
    if (val) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          lang === 'pl' ? 'Brak uprawnień' : 'Permission denied',
          lang === 'pl' ? 'Włącz powiadomienia w ustawieniach telefonu.' : 'Enable notifications in your phone settings.',
          [{ text: 'OK' }]
        );
        return;
      }
      const success = await scheduleDailyNotification(notifHour, lang, userSign);
      if (success) { setNotifEnabled(true); await save(KEYS.NOTIF_HOUR, notifHour); }
    } else {
      await cancelDailyNotification();
      await remove(KEYS.NOTIF_HOUR);
      setNotifEnabled(false);
    }
  };

  const scheduleNotif = async (hour) => {
    setNotifHour(hour);
    await save(KEYS.NOTIF_HOUR, hour);
    if (notifEnabled) await scheduleDailyNotification(hour, lang, userSign, userName);
  };

  const changeSign = async (sign) => { await save(KEYS.USER_SIGN, sign); onSignChange(sign); setShowSignPicker(false); };
  const removeFav = async (index) => { const updated = favorites.filter((_, i) => i !== index); await save(KEYS.FAVORITES, updated); setFavorites(updated); };

  const handleLangChange = async (l) => {
    await setLanguage(l);
    setCurrentLang(l);
    if (notifEnabled) await scheduleDailyNotification(notifHour, l, userSign, userName);
    if (moonNotifEnabled) await scheduleMoonPhaseNotification(l);
  };

  // Powiadomienia o pełni/nowiu — nowa funkcja (rozbudowa). Wykorzystuje
  // już istniejące obliczenia fazy księżyca (astro.js) i naprawiony
  // notifications.js, który potrafi teraz anulować pojedyncze powiadomienie
  // po jego własnym identyfikatorze zamiast kasować wszystkie naraz.
  const toggleMoonNotif = async (val) => {
    if (val) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          lang === 'pl' ? 'Brak uprawnień' : 'Permission denied',
          lang === 'pl' ? 'Włącz powiadomienia w ustawieniach telefonu.' : 'Enable notifications in your phone settings.',
          [{ text: 'OK' }]
        );
        return;
      }
      const ok = await scheduleMoonPhaseNotification(lang);
      if (ok) { setMoonNotifEnabled(true); await save(KEYS.MOON_NOTIF, true); }
    } else {
      await cancelMoonPhaseNotification();
      await save(KEYS.MOON_NOTIF, false);
      setMoonNotifEnabled(false);
    }
  };

  // Zarządzanie zgodą RODO na reklamy spersonalizowane (wymóg polityki
  // Google — użytkownik musi mieć stały sposób na zmianę zgody, wcześniej
  // takiej opcji nigdzie w aplikacji nie było).
  const handleOpenConsent = async () => {
    const ok = await openConsentSettings();
    if (!ok) {
      Alert.alert(
        lang === 'pl' ? 'Niedostępne' : 'Unavailable',
        lang === 'pl'
          ? 'Nie można teraz otworzyć ustawień zgody na reklamy. Spróbuj ponownie później.'
          : 'Could not open ad consent settings right now. Try again later.'
      );
    }
  };

  return (
    <ImageBackground source={require('../../assets/bg.png')} style={{ flex: 1 }} resizeMode="cover">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

          <View style={styles.headerBlock}>
            <Text style={styles.pageTitle}>✦ {t('profile.title')} ✦</Text>
            <View style={styles.divider} />
          </View>

          {/* ═══ SEKCJA: TWÓJ PROFIL ═══ */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              👤 {lang === 'en' ? 'YOUR PROFILE' : 'TWÓJ PROFIL'}
            </Text>
          </View>

          {/* JĘZYK */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardIcon}>🌍</Text>
              <Text style={styles.cardTitle}>{lang === 'pl' ? 'Język / Language' : 'Language / Język'}</Text>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.langRow}>
              <TouchableOpacity style={[styles.langBtn, lang === 'pl' && styles.langBtnActive]} onPress={() => handleLangChange('pl')} activeOpacity={0.8}>
                <Text style={styles.langFlag}>🇵🇱</Text>
                <Text style={[styles.langText, lang === 'pl' && styles.langTextActive]}>Polski</Text>
                {lang === 'pl' && <Text style={styles.langCheck}>✓</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.langBtn, lang === 'en' && styles.langBtnActive]} onPress={() => handleLangChange('en')} activeOpacity={0.8}>
                <Text style={styles.langFlag}>🇬🇧</Text>
                <Text style={[styles.langText, lang === 'en' && styles.langTextActive]}>English</Text>
                {lang === 'en' && <Text style={styles.langCheck}>✓</Text>}
              </TouchableOpacity>
            </View>
            <Text style={styles.langNote}>
              {lang === 'pl' ? '⚠️ Zmiana języka wymaga ponownego uruchomienia aplikacji' : '⚠️ Language change requires app restart'}
            </Text>
          </View>

          {/* IMIĘ */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardIcon}>✨</Text>
              <Text style={styles.cardTitle}>{lang === 'en' ? 'YOUR NAME' : 'TWOJE IMIĘ'}</Text>
            </View>
            <View style={styles.cardDivider} />
            {editingName ? (
              <View style={styles.nameEditRow}>
                <TextInput style={styles.nameInput} value={nameInput} onChangeText={setNameInput} placeholder={lang === 'en' ? 'Enter your name...' : 'Wpisz swoje imię...'} placeholderTextColor="rgba(255,255,255,0.25)" autoFocus maxLength={30} />
                <TouchableOpacity style={styles.nameSaveBtn} onPress={saveName}><Text style={styles.nameEditBtnText}>✓</Text></TouchableOpacity>
                <TouchableOpacity style={styles.nameCancelBtn} onPress={() => setEditingName(false)}><Text style={styles.nameEditBtnText}>✕</Text></TouchableOpacity>
              </View>
            ) : (
              <View style={styles.nameRow}>
                <Text style={styles.nameDisplay}>{userName || (lang === 'en' ? 'Not set' : 'Nie ustawiono')}</Text>
                <TouchableOpacity style={styles.nameEditBtn} onPress={() => { setNameInput(userName); setEditingName(true); }}>
                  <Text style={styles.nameEditBtnText}>{lang === 'en' ? '✎ Edit' : '✎ Zmień'}</Text>
                </TouchableOpacity>
              </View>
            )}
            {userName ? <Text style={styles.nameHint}>{lang === 'en' ? `Notifications personalized for ${userName} ✦` : `Powiadomienia spersonalizowane dla ${userName} ✦`}</Text> : null}
          </View>

          {/* DANE URODZENIA */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardIcon}>⬆️</Text>
              <Text style={styles.cardTitle}>{lang === 'en' ? 'BIRTH DATA & ASCENDANT' : 'DANE URODZENIA I ASCENDENT'}</Text>
            </View>
            <View style={styles.cardDivider} />

            {/* Data urodzenia */}
            <Text style={styles.birthFieldLabel}>{lang === 'en' ? 'Date of birth' : 'Data urodzenia'}</Text>
            {editingBirthDate ? (
              <View style={{ width: '100%' }}>
                <View style={styles.nameEditRow}>
                  <TextInput style={styles.nameInput} value={birthDateInput} onChangeText={(v) => {
                      const clean = v.replace(/[^0-9]/g, '');
                      let formatted = clean;
                      if (clean.length >= 3) formatted = clean.slice(0, 2) + '.' + clean.slice(2);
                      if (clean.length >= 5) formatted = clean.slice(0, 2) + '.' + clean.slice(2, 4) + '.' + clean.slice(4, 8);
                      setBirthDateInput(formatted);
                      setBirthDateError('');
                    }} placeholder={lang === 'en' ? 'DD.MM.YYYY' : 'DD.MM.RRRR'} placeholderTextColor="rgba(255,255,255,0.25)" keyboardType="number-pad" maxLength={10} autoFocus />
                  <TouchableOpacity style={styles.nameSaveBtn} onPress={saveBirthDate}><Text style={styles.nameEditBtnText}>✓</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.nameCancelBtn} onPress={() => { setEditingBirthDate(false); setBirthDateError(''); }}><Text style={styles.nameEditBtnText}>✕</Text></TouchableOpacity>
                </View>
                {birthDateError ? <Text style={styles.fieldError}>{birthDateError}</Text> : null}
              </View>
            ) : (
              <View style={styles.nameRow}>
                <Text style={styles.nameDisplay}>{birthDate || (lang === 'en' ? 'Not set' : 'Nie ustawiono')}</Text>
                <TouchableOpacity style={styles.nameEditBtn} onPress={() => { setBirthDateInput(birthDate); setEditingBirthDate(true); }}>
                  <Text style={styles.nameEditBtnText}>✎ {lang === 'en' ? 'Edit' : 'Zmień'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Godzina urodzenia */}
            <Text style={[styles.birthFieldLabel, { marginTop: 14 }]}>{lang === 'en' ? 'Birth time' : 'Godzina urodzenia'}</Text>
            {editingBirthTime ? (
              <View style={{ width: '100%' }}>
                <View style={styles.nameEditRow}>
                  <TextInput style={styles.nameInput} value={birthTimeInput} onChangeText={(v) => {
                      const clean = v.replace(/[^0-9]/g, '');
                      let formatted = clean;
                      if (clean.length >= 3) formatted = clean.slice(0, 2) + ':' + clean.slice(2, 4);
                      setBirthTimeInput(formatted);
                      setBirthTimeError('');
                    }} placeholder="HH:MM" placeholderTextColor="rgba(255,255,255,0.25)" keyboardType="number-pad" maxLength={5} autoFocus />
                  <TouchableOpacity style={styles.nameSaveBtn} onPress={saveBirthTime}><Text style={styles.nameEditBtnText}>✓</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.nameCancelBtn} onPress={() => { setEditingBirthTime(false); setBirthTimeError(''); }}><Text style={styles.nameEditBtnText}>✕</Text></TouchableOpacity>
                </View>
                {birthTimeError ? <Text style={styles.fieldError}>{birthTimeError}</Text> : null}
              </View>
            ) : (
              <View style={styles.nameRow}>
                <Text style={styles.nameDisplay}>{birthTime || (lang === 'en' ? 'Not set' : 'Nie ustawiono')}</Text>
                <TouchableOpacity style={styles.nameEditBtn} onPress={() => { setBirthTimeInput(birthTime); setEditingBirthTime(true); }}>
                  <Text style={styles.nameEditBtnText}>✎ {lang === 'en' ? 'Edit' : 'Zmień'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Miejsce urodzenia */}
            <Text style={[styles.birthFieldLabel, { marginTop: 14 }]}>{lang === 'en' ? 'Birth place' : 'Miejsce urodzenia'}</Text>
            {editingBirthPlace ? (
              <View style={styles.nameEditRow}>
                <TextInput style={styles.nameInput} value={birthPlaceInput} onChangeText={setBirthPlaceInput} placeholder={lang === 'en' ? 'City...' : 'Miasto...'} placeholderTextColor="rgba(255,255,255,0.25)" maxLength={50} autoFocus />
                <TouchableOpacity style={styles.nameSaveBtn} onPress={saveBirthPlace}><Text style={styles.nameEditBtnText}>✓</Text></TouchableOpacity>
                <TouchableOpacity style={styles.nameCancelBtn} onPress={() => setEditingBirthPlace(false)}><Text style={styles.nameEditBtnText}>✕</Text></TouchableOpacity>
              </View>
            ) : (
              <View style={styles.nameRow}>
                <Text style={styles.nameDisplay}>{birthPlace || (lang === 'en' ? 'Not set' : 'Nie ustawiono')}</Text>
                <TouchableOpacity style={styles.nameEditBtn} onPress={() => { setBirthPlaceInput(birthPlace); setEditingBirthPlace(true); }}>
                  <Text style={styles.nameEditBtnText}>✎ {lang === 'en' ? 'Edit' : 'Zmień'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Ascendent badge */}
            {ascendant && birthDate && birthTime && (
              <View style={styles.ascendantBadge}>
                <Text style={styles.ascendantEmoji}>{ascendant.emoji}</Text>
                <View>
                  <Text style={styles.ascendantLabel}>{lang === 'en' ? 'Your Ascendant' : 'Twój Ascendent'}</Text>
                  <Text style={styles.ascendantName}>{lang === 'en' ? ascendant.nameEn : ascendant.name}</Text>
                </View>
              </View>
            )}

            {!birthDate && <Text style={styles.nameHint}>{lang === 'en' ? '📅 Enter date of birth to unlock your cosmic profile' : '📅 Podaj datę urodzenia aby odblokować profil kosmiczny'}</Text>}
            {birthDate && !birthTime && <Text style={styles.nameHint}>{lang === 'en' ? '🕐 Enter birth time to calculate your Ascendant' : '🕐 Podaj godzinę urodzenia aby obliczyć Ascendent'}</Text>}

            {birthDate && (() => {
              try {
                const parts = birthDate.split('.');
                if (parts.length !== 3) return null;
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10);
                const year = parseInt(parts[2], 10);
                if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                let next = new Date(today.getFullYear(), month - 1, day);
                next.setHours(0, 0, 0, 0);
                if (next < today) next = new Date(today.getFullYear() + 1, month - 1, day);
                const diffDays = Math.round((next - today) / (1000 * 60 * 60 * 24));
                const age = next.getFullYear() - year;
                const isToday = diffDays === 0;
                return (
                  <View style={styles.birthdayCounterBox}>
                    <Text style={styles.birthdayCounterEmoji}>{isToday ? '🎂' : '🎉'}</Text>
                    <View style={{ flex: 1 }}>
                      {isToday ? (
                        <>
                          <Text style={styles.birthdayCounterTitle}>{lang === 'en' ? 'Happy Birthday!' : 'Wszystkiego najlepszego!'}</Text>
                          <Text style={styles.birthdayCounterSub}>{lang === 'en' ? `You're turning ${age} today` : `Dziś kończysz ${age} lat`}</Text>
                        </>
                      ) : (
                        <>
                          <Text style={styles.birthdayCounterTitle}>{lang === 'en' ? `${diffDays} ${diffDays === 1 ? 'day' : 'days'} to your birthday` : `${diffDays} dni do urodzin`}</Text>
                          <Text style={styles.birthdayCounterSub}>{lang === 'en' ? `Turning ${age}` : `Będziesz mieć ${age} lat`}</Text>
                        </>
                      )}
                    </View>
                  </View>
                );
              } catch { return null; }
            })()}
          </View>

          {/* ZNAK ZODIAKU */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardIcon}>♈</Text>
              <Text style={styles.cardTitle}>{t('profile.signTitle')}</Text>
            </View>
            <View style={styles.cardDivider} />
            <Text style={styles.signEmoji}>{userSign.emoji}</Text>
            <Text style={styles.signName}>{lang === 'en' ? (userSign.nameEn || userSign.name) : userSign.name}</Text>
            <Text style={styles.signDates}>{userSign.dates}</Text>
            <TouchableOpacity style={styles.changeBtn} onPress={() => setShowSignPicker(!showSignPicker)} activeOpacity={0.8}>
              <Text style={styles.changeBtnText}>{showSignPicker ? t('profile.cancelChange') : t('profile.changeSign')}</Text>
            </TouchableOpacity>
            {showSignPicker && (
              <>
                <View style={styles.pickerDivider} />
                <View style={styles.signGrid}>
                  {SIGNS.map(s => (
                    <TouchableOpacity key={s.key} style={[styles.signBtn, userSign.key === s.key && styles.signBtnActive]} onPress={() => changeSign(s)} activeOpacity={0.75}>
                      <Text style={styles.signBtnEmoji}>{s.emoji}</Text>
                      <Text style={[styles.signBtnName, userSign.key === s.key && styles.signBtnNameActive]}>{lang === 'en' ? (s.nameEn || s.name) : s.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>

          {/* ═══ SEKCJA: TWOJA ANALIZA KOSMICZNA ═══ */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              🔮 {lang === 'en' ? 'YOUR COSMIC READING' : 'TWOJA ANALIZA KOSMICZNA'}
            </Text>
          </View>

          {/* PROFIL KOSMICZNY */}
          <CosmicProfileCard
            userSign={userSign}
            birthDate={birthDate}
            ascendant={ascendant}
            lang={lang}
          />

          {/* NUMEROLOGIA */}
          <NumerologyCard birthDate={birthDate} lang={lang} />

          {/* Ebook astrologiczny ma teraz WŁASNĄ zakładkę w dolnej nawigacji
              (App.js, zakładka "ebook") zamiast karty ukrytej tutaj — user
              zgłosił, że jako karta w Profilu był za mało widoczny. */}

          {/* ═══ SEKCJA: USTAWIENIA ═══ */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              ⚙️ {lang === 'en' ? 'SETTINGS' : 'USTAWIENIA'}
            </Text>
          </View>

          {/* POWIADOMIENIA */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardIcon}>🔔</Text>
              <Text style={styles.cardTitle}>{t('profile.notifTitle')}</Text>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.notifRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.notifLabel}>{t('profile.notifLabel')}</Text>
                <Text style={styles.notifSub}>{t('profile.notifSub')}</Text>
              </View>
              <Switch value={notifEnabled} onValueChange={toggleNotif} trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(212,175,55,0.5)' }} thumbColor={notifEnabled ? '#d4af37' : 'rgba(255,255,255,0.4)'} />
            </View>
            {notifEnabled && (
              <View style={styles.hourPicker}>
                <Text style={styles.hourLabel}>{t('profile.notifHour')}{notifHour}:00</Text>
                <View style={styles.hourBtns}>
                  {[6, 7, 8, 9, 10, 12, 18, 20, 21].map(h => (
                    <TouchableOpacity key={h} style={[styles.hourBtn, notifHour === h && styles.hourBtnActive]} onPress={() => scheduleNotif(h)}>
                      <Text style={[styles.hourBtnText, notifHour === h && styles.hourBtnTextActive]}>{h}:00</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.notifNote}>{lang === 'pl' ? `🔔 Powiadomienie codziennie o ${notifHour}:00` : `🔔 Notification daily at ${notifHour}:00`}</Text>
              </View>
            )}

            <View style={[styles.notifRow, { marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(212,175,55,0.1)' }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.notifLabel}>{lang === 'en' ? '🌕 Full & New Moon alerts' : '🌕 Powiadomienia o pełni i nowiu'}</Text>
                <Text style={styles.notifSub}>{lang === 'en' ? 'Get notified on key lunar days' : 'Powiadomienie w kluczowe dni cyklu księżycowego'}</Text>
              </View>
              <Switch value={moonNotifEnabled} onValueChange={toggleMoonNotif} trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(212,175,55,0.5)' }} thumbColor={moonNotifEnabled ? '#d4af37' : 'rgba(255,255,255,0.4)'} />
            </View>
          </View>

          {/* ULUBIONE */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardIcon}>★</Text>
              <Text style={styles.cardTitle}>{t('profile.favTitle')} ({favorites.length})</Text>
            </View>
            <View style={styles.cardDivider} />
            {favorites.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>🌌</Text>
                <Text style={styles.emptyText}>{t('profile.favEmpty')}</Text>
                <Text style={styles.emptyHint}>{t('profile.favHint')}</Text>
              </View>
            ) : (
              favorites.map((fav, i) => (
                <View key={i} style={styles.favItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.favDate}>{fav.sign}  ·  {fav.date}</Text>
                    <Text style={styles.favText} numberOfLines={3}>{fav.text}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeFav(i)} style={styles.removeBtn}>
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* PRYWATNOŚĆ I REKLAMY (RODO) */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardIcon}>🛡️</Text>
              <Text style={styles.cardTitle}>{lang === 'en' ? 'PRIVACY & ADS' : 'PRYWATNOŚĆ I REKLAMY'}</Text>
            </View>
            <View style={styles.cardDivider} />
            <Text style={styles.nameHint}>
              {lang === 'en'
                ? 'Manage your consent for personalized ads (GDPR).'
                : 'Zarządzaj zgodą na reklamy spersonalizowane (RODO).'}
            </Text>
            <TouchableOpacity style={[styles.changeBtn, { marginTop: 14 }]} onPress={handleOpenConsent} activeOpacity={0.8}>
              <Text style={styles.changeBtnText}>{lang === 'en' ? '⚙️  Ad consent settings' : '⚙️  Ustawienia zgody na reklamy'}</Text>
            </TouchableOpacity>
          </View>

          {/* ═══ SEKCJA: SPOŁECZNOŚĆ ═══ */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              🌐 {lang === 'en' ? 'COMMUNITY' : 'SPOŁECZNOŚĆ'}
            </Text>
          </View>

          {/* SOCIAL */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardIcon}>🌐</Text>
              <Text style={styles.cardTitle}>{t('profile.socialTitle')}</Text>
            </View>
            <View style={styles.cardDivider} />
            {SOCIALS.map((s, i) => (
              <TouchableOpacity key={s.label} style={[styles.socialBtn, i === SOCIALS.length - 1 && { borderBottomWidth: 0 }]} onPress={() => Linking.openURL(s.url)} activeOpacity={0.75}>
                <SocialIcon social={s} />
                <Text style={styles.socialLabel}>{s.label}</Text>
                <Text style={styles.socialArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          <AdBanner />
          <View style={{ height: 16 }} />
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center' },
  headerBlock: { alignItems: 'center', marginTop: 8, marginBottom: 20, width: '100%' },
  pageTitle: { fontFamily: 'Cinzel_700Bold', fontSize: 18, color: '#d4af37', letterSpacing: 3 },
  divider: { width: 50, height: 1, backgroundColor: 'rgba(212,175,55,0.4)', marginTop: 10 },
  card: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 20, width: '100%', borderWidth: 1, borderColor: 'rgba(212,175,55,0.18)', marginBottom: 16, alignItems: 'center' },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginBottom: 10 },
  cardIcon: { fontSize: 14 },
  cardTitle: { fontFamily: 'Cinzel_700Bold', color: '#d4af37', fontSize: 11, letterSpacing: 2 },
  cardDivider: { height: 1, width: '100%', backgroundColor: 'rgba(212,175,55,0.15)', marginBottom: 18 },
  // Nagłówki grup kart — te same proporcje/krój co sekcje na ekranie Kosmosu,
  // żeby oba ekrany mówiły tym samym językiem wizualnym zamiast ściany
  // identycznych kart bez żadnego podziału.
  sectionHeader: { alignSelf: 'flex-start', width: '100%', marginTop: 4, marginBottom: 12 },
  sectionTitle: { fontFamily: 'Cinzel_700Bold', color: '#d4af37', fontSize: 12, letterSpacing: 2.5 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, width: '100%' },
  nameDisplay: { fontFamily: 'Cinzel_600SemiBold', color: '#fff', fontSize: 16, letterSpacing: 1 },
  nameEditBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(212,175,55,0.35)' },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, width: '100%' },
  nameInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.4)', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14, color: '#fff', fontFamily: 'Raleway_400Regular', fontSize: 15, letterSpacing: 1 },
  nameSaveBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(212,175,55,0.2)', borderWidth: 1, borderColor: '#d4af37', justifyContent: 'center', alignItems: 'center' },
  nameCancelBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  nameEditBtnText: { fontFamily: 'Raleway_600SemiBold', color: '#d4af37', fontSize: 13 },
  nameHint: { fontFamily: 'Raleway_300Light', color: '#d4af37', fontSize: 11, fontStyle: 'italic', letterSpacing: 0.3, alignSelf: 'flex-start', marginTop: 6 },
  birthdayCounterBox: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(212,175,55,0.08)', borderRadius: 16, padding: 14, marginTop: 14, borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)', alignSelf: 'stretch' },
  birthdayCounterEmoji: { fontSize: 32 },
  birthdayCounterTitle: { fontFamily: 'Cinzel_700Bold', color: '#d4af37', fontSize: 15, letterSpacing: 1, marginBottom: 4 },
  birthdayCounterSub: { fontFamily: 'Raleway_300Light', color: '#ffffff', fontSize: 12, letterSpacing: 0.5 },
  fieldError: { fontFamily: 'Raleway_400Regular', color: '#e74c3c', fontSize: 11, alignSelf: 'flex-start', marginBottom: 6 },
  birthFieldLabel: { fontFamily: 'Cinzel_600SemiBold', color: '#d4af37', fontSize: 9, letterSpacing: 1.5, marginBottom: 8, alignSelf: 'flex-start' },
  ascendantBadge: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(212,175,55,0.08)', borderRadius: 16, padding: 14, marginTop: 16, borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)', alignSelf: 'stretch' },
  ascendantEmoji: { fontSize: 36 },
  ascendantLabel: { fontFamily: 'Raleway_400Regular', color: '#ffffff', fontSize: 11, letterSpacing: 0.5 },
  ascendantName: { fontFamily: 'Cinzel_700Bold', color: '#d4af37', fontSize: 20, letterSpacing: 2 },
  // Profil kosmiczny
  cosmicCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 20, width: '100%', borderWidth: 1, borderColor: 'rgba(212,175,55,0.18)', marginBottom: 16 },
  cosmicTabs: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  cosmicTab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(212,175,55,0.15)', backgroundColor: 'rgba(255,255,255,0.03)', gap: 3 },
  cosmicTabIcon: { fontSize: 18 },
  cosmicTabLabel: { fontFamily: 'Raleway_600SemiBold', color: '#ffffff', fontSize: 10, letterSpacing: 0.5 },
  cosmicTabSign: { fontSize: 14 },
  cosmicSignRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  cosmicSignName: { fontFamily: 'Cinzel_700Bold', fontSize: 18, letterSpacing: 2 },
  cosmicSignSub: { fontFamily: 'Raleway_300Light', color: '#ffffff', fontSize: 11, marginTop: 2, letterSpacing: 0.5 },
  cosmicDesc: { fontFamily: 'Raleway_400Regular', color: '#ffffff', fontSize: 14, lineHeight: 24, letterSpacing: 0.3 },
  cosmicMissingBox: { alignItems: 'center', paddingVertical: 20, gap: 10 },
  cosmicMissingIcon: { fontSize: 32 },
  cosmicMissingText: { fontFamily: 'Raleway_300Light', color: '#ffffff', fontSize: 13, textAlign: 'center', lineHeight: 22, fontStyle: 'italic' },
  cosmicLoading: { alignItems: 'center', paddingVertical: 20, gap: 10 },
  cosmicLoadingText: { fontFamily: 'Raleway_300Light', color: '#d4af37', fontSize: 12, fontStyle: 'italic' },
  cosmicError: { alignItems: 'center', gap: 10, paddingVertical: 12 },
  cosmicErrorText: { fontFamily: 'Raleway_400Regular', color: '#e74c3c', fontSize: 12, textAlign: 'center' },
  cosmicRetryBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(212,175,55,0.35)' },
  cosmicRetryText: { fontFamily: 'Raleway_600SemiBold', color: '#d4af37', fontSize: 12 },
  cosmicContent: { width: '100%' },
  synthBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: 'rgba(212,175,55,0.06)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)', padding: 14, marginTop: 16 },
  synthLabel: { fontFamily: 'Cinzel_700Bold', color: '#d4af37', fontSize: 14 },
  synthText: { flex: 1, fontFamily: 'Raleway_300Light', color: '#ffffff', fontSize: 13, lineHeight: 22, fontStyle: 'italic', letterSpacing: 0.3 },
  generateBtn: { backgroundColor: '#d4af37', paddingVertical: 13, paddingHorizontal: 28, borderRadius: 28, alignSelf: 'center', marginTop: 16 },
  generateBtnText: { fontFamily: 'Cinzel_700Bold', color: '#0a0015', fontSize: 12, letterSpacing: 1.5 },
  regenerateBtn: { alignSelf: 'center', marginTop: 16, paddingHorizontal: 18, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)' },
  regenerateBtnText: { fontFamily: 'Raleway_600SemiBold', color: '#d4af37', fontSize: 11, letterSpacing: 1 },
  // Numerologia
  numerologyRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14, width: '100%' },
  numerologyBadge: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(212,175,55,0.12)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.4)', justifyContent: 'center', alignItems: 'center' },
  numerologyNumber: { fontFamily: 'Cinzel_700Bold', color: '#d4af37', fontSize: 22 },
  numerologyTitle: { fontFamily: 'Cinzel_600SemiBold', color: '#fff', fontSize: 15, letterSpacing: 0.5 },
  numerologySub: { fontFamily: 'Raleway_300Light', color: '#ffffff', fontSize: 11, marginTop: 2, letterSpacing: 0.3 },
  // Reszta
  langRow: { flexDirection: 'row', gap: 12, width: '100%' },
  langBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.15)' },
  langBtnActive: { borderColor: '#d4af37', backgroundColor: 'rgba(212,175,55,0.12)' },
  langFlag: { fontSize: 20 },
  langText: { fontFamily: 'Raleway_600SemiBold', color: '#ffffff', fontSize: 13 },
  langTextActive: { color: '#d4af37' },
  langCheck: { fontFamily: 'Raleway_700Bold', color: '#d4af37', fontSize: 14 },
  langNote: { fontFamily: 'Raleway_300Light', color: '#ffffff', fontSize: 10, marginTop: 12, fontStyle: 'italic', textAlign: 'center' },
  signEmoji: { fontSize: 54, marginBottom: 10 },
  signName: { fontFamily: 'Cinzel_700Bold', color: '#fff', fontSize: 22, letterSpacing: 2 },
  signDates: { fontFamily: 'Raleway_400Regular', color: '#ffffff', fontSize: 12, marginTop: 4, marginBottom: 16, letterSpacing: 1 },
  changeBtn: { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(212,175,55,0.35)' },
  changeBtnText: { fontFamily: 'Raleway_600SemiBold', color: '#d4af37', fontSize: 12, letterSpacing: 1 },
  pickerDivider: { height: 1, width: '100%', backgroundColor: 'rgba(212,175,55,0.12)', marginVertical: 16 },
  signGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  signBtn: { width: 72, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.15)', alignItems: 'center' },
  signBtnActive: { borderColor: '#d4af37', backgroundColor: 'rgba(212,175,55,0.12)' },
  signBtnEmoji: { fontSize: 22 },
  signBtnName: { fontFamily: 'Raleway_500Medium', color: '#ffffff', fontSize: 10, marginTop: 4, textAlign: 'center' },
  signBtnNameActive: { color: '#d4af37' },
  notifRow: { flexDirection: 'row', alignItems: 'center', width: '100%', gap: 12 },
  notifLabel: { fontFamily: 'Raleway_600SemiBold', color: '#ffffff', fontSize: 14 },
  notifSub: { fontFamily: 'Raleway_300Light', color: '#ffffff', fontSize: 11, marginTop: 2 },
  hourPicker: { marginTop: 18, width: '100%', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(212,175,55,0.1)' },
  hourLabel: { fontFamily: 'Raleway_400Regular', color: '#ffffff', fontSize: 12, marginBottom: 12 },
  hourBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  hourBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)', backgroundColor: 'rgba(255,255,255,0.03)' },
  hourBtnActive: { backgroundColor: '#d4af37', borderColor: '#d4af37' },
  hourBtnText: { fontFamily: 'Raleway_500Medium', color: '#ffffff', fontSize: 12 },
  hourBtnTextActive: { fontFamily: 'Raleway_700Bold', color: '#0a0015' },
  notifNote: { fontFamily: 'Raleway_300Light', color: '#d4af37', fontSize: 11, marginTop: 14, fontStyle: 'italic' },
  emptyBox: { alignItems: 'center', paddingVertical: 12, gap: 6 },
  emptyEmoji: { fontSize: 32, marginBottom: 4 },
  emptyText: { fontFamily: 'Raleway_400Regular', color: '#ffffff', fontSize: 13, textAlign: 'center' },
  emptyHint: { fontFamily: 'Raleway_300Light', color: '#ffffff', fontSize: 11, fontStyle: 'italic' },
  favItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(212,175,55,0.08)', width: '100%', gap: 10 },
  favDate: { fontFamily: 'Raleway_600SemiBold', color: '#d4af37', fontSize: 11, marginBottom: 5 },
  favText: { fontFamily: 'Raleway_400Regular', color: '#ffffff', fontSize: 12, lineHeight: 20 },
  removeBtn: { padding: 6 },
  removeBtnText: { fontFamily: 'Raleway_600SemiBold', color: '#ffffff', fontSize: 14 },
  socialBtn: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', gap: 14 },
  socialIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  socialIconText: { fontSize: 18, fontWeight: '900', lineHeight: 22 },
  socialIconEmoji: { fontSize: 20 },
  socialLabel: { fontFamily: 'Raleway_600SemiBold', flex: 1, color: '#ffffff', fontSize: 14 },
  socialArrow: { color: '#ffffff', fontSize: 20 },
});

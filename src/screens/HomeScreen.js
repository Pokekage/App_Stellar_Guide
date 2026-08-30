import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Animated, Easing,
  ImageBackground, Image, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { fetchHoroscope, fetchRecipe, getMoonPhase } from '../utils/astro';
import { load, save, remove, KEYS } from '../utils/storage';
import { STONES } from '../utils/stones';
import AdBanner from '../components/AdBanner';
import i18n from '../utils/i18n';
import { HoroscopeWidget } from '../widgets/HoroscopeWidget';

// Klucz cache pod widget na ekranie głównym Androida (src/widgets/) —
// widget czyta go samodzielnie, więc każde udane pobranie horoskopu
// tutaj musi go nadpisywać, żeby widget nigdy nie robił własnego
// zapytania do Groq i zawsze pokazywał to, co widać w aplikacji.
const WIDGET_CACHE_KEY = 'widget_daily_snippet';

async function updateHoroscopeWidget(userSign, generalText) {
  if (Platform.OS !== 'android' || !generalText) return;
  try {
    const snippet = {
      sign: userSign?.name || 'Gwiezdny Przewodnik',
      emoji: userSign?.emoji || '✨',
      text: generalText,
      date: new Date().toDateString(),
    };
    await save(WIDGET_CACHE_KEY, snippet);
    await requestWidgetUpdate({
      widgetName: 'HoroscopeWidget',
      renderWidget: () => (
        <HoroscopeWidget sign={snippet.sign} emoji={snippet.emoji} text={snippet.text} />
      ),
    });
  } catch (e) {
    // Widget to dodatek — jego błąd nigdy nie może zepsuć głównego ekranu.
    console.log('updateHoroscopeWidget error', e);
  }
}

const LUCKY_COLORS_PL = ['Złoty', 'Fioletowy', 'Rubin', 'Szmaragdowy', 'Srebrny', 'Szafirowy', 'Turkusowy', 'Perłowy', 'Bursztynowy', 'Malachitowy', 'Różowy kwarc', 'Onyx'];
const LUCKY_COLORS_EN = ['Golden', 'Purple', 'Ruby', 'Emerald', 'Silver', 'Sapphire', 'Turquoise', 'Pearl', 'Amber', 'Malachite', 'Rose Quartz', 'Onyx'];
const LUCKY_OBJECTS_PL = ['Kryształ', 'Pióro', 'Stara moneta', 'Kamień z rzeki', 'Świeca', 'Lustro', 'Klucz', 'Kompas', 'Pierścień', 'Mapa gwiazd', 'Muszelka', 'Skórzany notes'];
const LUCKY_OBJECTS_EN = ['Crystal', 'Feather', 'Old coin', 'River stone', 'Candle', 'Mirror', 'Key', 'Compass', 'Ring', 'Star map', 'Seashell', 'Leather notebook'];
const COLOR_HEX = {
  'Złoty': '#d4af37', 'Fioletowy': '#9b59b6', 'Rubin': '#c0392b',
  'Szmaragdowy': '#27ae60', 'Srebrny': '#95a5a6', 'Szafirowy': '#2980b9',
  'Turkusowy': '#1abc9c', 'Perłowy': '#dfe6e9', 'Bursztynowy': '#e67e22',
  'Malachitowy': '#1e8449', 'Różowy kwarc': '#fd79a8', 'Onyx': '#636e72',
  'Golden': '#d4af37', 'Purple': '#9b59b6', 'Ruby': '#c0392b',
  'Emerald': '#27ae60', 'Silver': '#95a5a6', 'Sapphire': '#2980b9',
  'Turquoise': '#1abc9c', 'Pearl': '#dfe6e9', 'Amber': '#e67e22',
  'Malachite': '#1e8449', 'Rose Quartz': '#fd79a8',
};

// Mapa emoji dla kamieni
const GEM_ICONS = {
  'Ruby': '🔴', 'Rubín': '🔴',
  'Diamond': '💎', 'Diament': '💎',
  'Carnelian': '🟠', 'Karnelian': '🟠',
  'Jasper': '🟫', 'Jaspis': '🟫',
  'Emerald': '💚', 'Szmaragd': '💚',
  'Rose Quartz': '🩷', 'Różowy Kwarc': '🩷',
  'Malachite': '🟢', 'Malachit': '🟢',
  "Tiger's Eye": '🟡', 'Tygrysie Oko': '🟡',
  'Agate': '⚪', 'Agat': '⚪',
  'Citrine': '💛', 'Cytryn': '💛',
  'Pearl': '🤍', 'Perła': '🤍',
  'Aquamarine': '🔵', 'Akwamaryn': '🔵',
  'Moonstone': '🌕', 'Księżycowy': '🌕',
  'Opal': '🔮', 'Selenite': '🤍',
  'Golden Topaz': '⭐', 'Złoty Topaz': '⭐',
  'Onyx': '⬛', 'Onyks': '⬛',
  'Amber': '🟧', 'Bursztyn': '🟧',
  'Jade': '🟩', 'Jadeit': '🟩',
  'Amethyst': '🟣', 'Ametyst': '🟣',
  'Turquoise': '🩵', 'Turkus': '🩵',
  'Sardonyx': '🔶', 'Sardonix': '🔶',
  'Lapis Lazuli': '🔹',
  'Pink Tourmaline': '🌸', 'Różowy Turmalin': '🌸',
  'Obsidian': '🖤', 'Obsydian': '🖤',
  'Garnet': '❤️', 'Granat': '❤️',
  'Black Tourmaline': '⚫', 'Czarny Turmalin': '⚫',
  'Sodalite': '💙', 'Sodalit': '💙',
  'Labradorite': '🌀', 'Labradoryt': '🌀',
  'Fluorite': '🔷', 'Fluoryt': '🔷',
};

function getGemIcon(stone, lang) {
  const name = lang === 'en' ? stone.nameEn : stone.name;
  return GEM_ICONS[name] || GEM_ICONS[stone.nameEn] || GEM_ICONS[stone.name] || '💎';
}

function getDailyLuck(signKey, lang = 'pl') {
  if (!signKey) return { number: 7, color: 'Złoty', colorHex: '#d4af37', object: 'Kryształ' };
  const dateStr = new Date().toDateString();
  const seed = (dateStr + signKey).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const number = (seed % 99) + 1;
  const colors = lang === 'en' ? LUCKY_COLORS_EN : LUCKY_COLORS_PL;
  const objects = lang === 'en' ? LUCKY_OBJECTS_EN : LUCKY_OBJECTS_PL;
  const color = colors[seed % colors.length];
  const obj = objects[(seed * 2) % objects.length];
  return { number, color, colorHex: COLOR_HEX[color] || '#d4af37', object: obj };
}

export default function HomeScreen({ userSign, lang: langProp = null, ascendant = null, userBirth = null }) {
  const [horoscope, setHoroscope] = useState({ general: '', love: '', work: '', money: '' });
  const [activeCategory, setActiveCategory] = useState('general');
  const [loading, setLoading] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [recipe, setRecipe] = useState({ title: '', description: '', prepTime: '', ingredients: [], steps: [] });
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [recipeVisible, setRecipeVisible] = useState(false);
  const [streak, setStreak] = useState(0);
  const [selectedStone, setSelectedStone] = useState(null);

  const recipeAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const t = (key) => i18n.t(key);
  const lang = i18n.locale;
  const today = new Date().toLocaleDateString(lang === 'en' ? 'en-GB' : 'pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });

  useEffect(() => {
    if (!userSign) return;
    loadHoroscope();
    loadRecipe();
    updateStreak();
    checkFavStatus();
    Animated.loop(Animated.sequence([
      Animated.timing(shimmerAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(shimmerAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, [userSign]);

  // isFav musi się przeliczać przy każdej zmianie zakładki (Ogólny/Miłość/
  // Praca/Finanse) — wcześniej był to zwykły useState, który nigdy nie był
  // odczytywany z AsyncStorage ponownie, więc gwiazdka pokazywała zły stan
  // po zmianie kategorii albo powrocie do ekranu.
  useEffect(() => {
    if (!userSign) return;
    checkFavStatus();
  }, [activeCategory, userSign]);

  if (!userSign) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color="#d4af37" size="large" />
      </View>
    );
  }

  const moon = getMoonPhase();
  const luck = getDailyLuck(userSign.key, lang);
  const signStones = (STONES && STONES[userSign.key]) || [];
  const ascKey = ascendant ? ascendant.key : 'none';

  const updateStreak = async () => {
    const todayStr = new Date().toDateString();
    const data = await load('streak_data') || { lastDate: null, count: 0 };
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (data.lastDate === todayStr) {
      setStreak(data.count);
    } else if (data.lastDate === yesterday.toDateString()) {
      const newCount = data.count + 1;
      await save('streak_data', { lastDate: todayStr, count: newCount });
      setStreak(newCount);
    } else {
      await save('streak_data', { lastDate: todayStr, count: 1 });
      setStreak(1);
    }
  };

  const isFavEntry = (f) => f.date === today && f.sign === userSign.name && f.category === activeCategory;

  const checkFavStatus = async () => {
    const favs = (await load(KEYS.FAVORITES)) || [];
    setIsFav(favs.some(isFavEntry));
  };

  // Ręczne odświeżenie horoskopu dnia (np. gdy komuś nie spodobał się
  // wylosowany tekst) — dotąd horoskop dnia był ustalany raz i zapisywany
  // w cache na cały dzień, bez żadnej możliwości ponownego wygenerowania.
  const refreshHoroscope = () => {
    if (loading) return;
    loadHoroscope(true);
  };

  const shareHoroscope = async () => {
    try {
      const { Share } = require('react-native');
      const signName = lang === 'en' ? (userSign.nameEn || userSign.name) : userSign.name;
      const text = horoscope[activeCategory] || horoscope.general;
      const msg = lang === 'en'
        ? `✨ ${signName}\n\n${text}\n\n— Stellar Guide`
        : `✨ ${signName}\n\n${text}\n\n— Gwiezdny Przewodnik`;
      await Share.share({ message: msg });
    } catch {}
  };

  // force=true pomija cache i wymusza nową odpowiedź AI — używane przez
  // przycisk ręcznego odświeżenia horoskopu (patrz refreshHoroscope niżej).
  const loadHoroscope = async (force = false) => {
    setLoading(true);
    // v5 = dłuższy horoskop (4-5 zdań per kategoria)
    const cacheKey = `horoscope_v5_${userSign.key}_${ascKey}_${lang}_${new Date().toDateString()}`;

    if (force) {
      await remove(cacheKey);
    } else {
      const cached = await load(cacheKey);
      if (cached) {
        setHoroscope(cached);
        updateHoroscopeWidget(userSign, cached.general);
        setLoading(false);
        return;
      }
    }

    const signName = lang === 'en' ? (userSign.nameEn || userSign.name) : userSign.name;
    const ascName = ascendant ? (lang === 'en' ? ascendant.nameEn : ascendant.name) : null;
    const ascContext = ascName
      ? (lang === 'en' ? ` Their Ascendant is ${ascName}, which colors their outer personality and first impressions.`
                       : ` Ich Ascendent to ${ascName}, który kształtuje zewnętrzną osobowość i pierwsze wrażenie.`)
      : '';
    const moonCtx = lang === 'en'
      ? `Current moon phase: ${moon.nameEn} (day ${moon.day} of cycle).`
      : `Aktualna faza księżyca: ${moon.name} (dzień ${moon.day} cyklu).`;
    const dayName = new Date().toLocaleDateString(lang === 'en' ? 'en-GB' : 'pl-PL', { weekday: 'long' });

    const prompt = lang === 'en'
      ? `You are an expert mystical astrologer. Today is ${dayName}. ${moonCtx}

Write a deeply personalized daily horoscope for ${signName}.${ascContext}

Return ONLY a raw JSON object (no markdown, no explanation) with exactly these keys:
{
  "general": "4-5 sentences about overall energy, cosmic influences and key theme of the day for ${signName}",
  "love": "4-5 sentences about romantic energy, relationships and emotional connections",
  "work": "4-5 sentences about career, productivity, ambitions and professional matters",
  "money": "4-5 sentences about finances, material matters and abundance"
}

Be poetic, mystical and specific to ${signName}'s characteristics. Weave in the moon phase energy naturally.`
      : `Jesteś doświadczonym mistycznym astrologiem. Dziś jest ${dayName}. ${moonCtx}

Napisz głęboko spersonalizowany codzienny horoskop dla znaku ${signName}.${ascContext}

Zwróć WYŁĄCZNIE surowy obiekt JSON (bez markdown, bez wyjaśnień) z dokładnie tymi kluczami:
{
  "general": "4-5 zdań o ogólnej energii, kosmicznych wpływach i głównym motywie dnia dla ${signName}",
  "love": "4-5 zdań o energii romantycznej, relacjach i połączeniach emocjonalnych",
  "work": "4-5 zdań o karierze, produktywności, ambicjach i sprawach zawodowych",
  "money": "4-5 zdań o finansach, sprawach materialnych i obfitości"
}

Bądź poetycki, mistyczny i konkretny dla cech znaku ${signName}. Wpleć naturalnie energię fazy księżyca.`;

    const text = await fetchHoroscope(signName, prompt);

    if (text) {
      try {
        let clean = text
          .replace(/```json\s*/gi, '')
          .replace(/```\s*/g, '')
          .trim();
        const jsonMatch = clean.match(/\{[\s\S]*\}/);
        if (jsonMatch) clean = jsonMatch[0];
        const parsed = JSON.parse(clean);
        const h = {
          general: parsed.general || parsed.ogólny || text,
          love:    parsed.love    || parsed.miłość  || text,
          work:    parsed.work    || parsed.praca   || text,
          money:   parsed.money   || parsed.finanse || text,
        };
        await save(cacheKey, h);
        setHoroscope(h);
        updateHoroscopeWidget(userSign, h.general);
      } catch (e) {
        console.error('Horoscope parse error:', e.message);
        setHoroscope({ general: text, love: '', work: '', money: '' });
        updateHoroscopeWidget(userSign, text);
      }
    }
    setLoading(false);
  };

  const loadRecipe = async () => {
    setLoadingRecipe(true);
    const cacheKey = `recipe_v2_${userSign.key}_${lang}_${new Date().toDateString()}`;
    const cached = await load(cacheKey);

    if (cached) {
      setRecipe(cached);
      setLoadingRecipe(false);
      return;
    }

    const signName = lang === 'en' ? (userSign.nameEn || userSign.name) : userSign.name;
    const prompt = lang === 'en'
      ? `You are an astrological chef. Suggest one recipe matching ${signName} zodiac sign. Return ONLY a valid JSON object with keys: "title", "description", "prepTime", "ingredients" (array of strings), "steps" (array of strings). Do NOT wrap the response in markdown code blocks like \`\`\`json.`
      : `Jesteś astrologicznym szefem kuchni. Zaproponuj jeden niesamowity przepis kulinarny pasujący do znaku zodiaku: ${signName}. Zwróć TYLKO poprawny obiekt JSON z kluczami: "title" (nazwa potrawy), "description" (krótki, max 2-zdaniowy mistyczny opis dlaczego pasuje do znaku), "prepTime" (np. "20 min"), "ingredients" (tablica stringów ze składnikami), "steps" (tablica stringów z kolejnymi krokami). NIE owijaj odpowiedzi w bloki kodu markdown typu \`\`\`json.`;

    const text = await fetchRecipe(signName, prompt);

    if (text) {
      try {
        const cleanedText = text
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/, '')
          .replace(/\s*```$/, '');
        const parsedRecipe = JSON.parse(cleanedText);
        await save(cacheKey, parsedRecipe);
        setRecipe(parsedRecipe);
      } catch (e) {
        console.error("Błąd parsowania przepisu JSON:", e);
        setRecipe({
          title: lang === 'en' ? 'Cosmic Dish' : 'Kosmiczne Danie',
          description: text,
          prepTime: '--',
          ingredients: [],
          steps: []
        });
      }
    }
    setLoadingRecipe(false);
  };

  const toggleRecipe = () => {
    if (!recipeVisible) {
      setRecipeVisible(true);
      Animated.spring(recipeAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }).start();
    } else {
      Animated.timing(recipeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setRecipeVisible(false));
    }
  };

  const toggleFav = async () => {
    const favs = (await load(KEYS.FAVORITES)) || [];
    const entry = { sign: userSign.name, text: horoscope[activeCategory], date: today, category: activeCategory };
    const exists = favs.some(isFavEntry);
    if (exists) {
      await save(KEYS.FAVORITES, favs.filter(f => !isFavEntry(f)));
      setIsFav(false);
    } else {
      await save(KEYS.FAVORITES, [entry, ...favs.slice(0, 19)]);
      setIsFav(true);
    }
  };

  const shimmerOpacity = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  const categories = [
    { id: 'general', label: lang === 'en' ? 'General' : 'Ogólny', icon: '🌌' },
    { id: 'love', label: lang === 'en' ? 'Love' : 'Miłość', icon: '💖' },
    { id: 'work', label: lang === 'en' ? 'Work' : 'Praca', icon: '💼' },
    { id: 'money', label: lang === 'en' ? 'Money' : 'Finanse', icon: '🪙' },
  ];

  return (
    <ImageBackground source={require('../../assets/bg.png')} style={{ flex: 1 }} resizeMode="cover">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim, width: '100%', alignItems: 'center' }}>

            <View style={styles.headerBlock}>
              <Animated.Text style={[styles.appTitle, { opacity: shimmerOpacity }]}>
                ✦ {t('home.title')} ✦
              </Animated.Text>
              <View style={styles.dividerLine} />
              <Text style={styles.dateText}>{today}</Text>
            </View>

            <View style={styles.moonBadge}>
              <Text style={styles.moonEmoji}>{moon.emoji}</Text>
              <Text style={styles.moonBadgeText}>{lang === 'en' ? moon.nameEn : moon.name} · {t('home.moonCycle').replace('dzień', `${moon.day}`).replace('day', `${moon.day}`)}</Text>
            </View>

            <View style={styles.signCard}>
              <Text style={styles.signEmoji}>{userSign.emoji}</Text>
              <Text style={styles.signName}>{lang === 'en' ? (userSign.nameEn || userSign.name) : userSign.name}</Text>
              <Text style={styles.signDates}>{userSign.dates}</Text>
              {ascendant && (
                <View style={styles.ascBadge}>
                  <Text style={styles.ascText}>⬆️  Asc: {lang === 'en' ? ascendant.nameEn : ascendant.name}</Text>
                </View>
              )}
            </View>

            {streak > 0 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakFire}>🔥</Text>
                <Text style={styles.streakText}>
                  {streak} {lang === 'en' ? 'days in a row' : streak === 1 ? 'dzień z rzędu' : 'dni z rzędu'}
                </Text>
              </View>
            )}

            {/* KAMIENIE ZNAKU */}
            {signStones.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardIcon}>💎</Text>
                  <Text style={styles.cardTitle}>{lang === 'en' ? 'STONES OF YOUR SIGN' : 'KAMIENIE TWOJEGO ZNAKU'}</Text>
                </View>
                <View style={styles.cardDivider} />
                <View style={styles.stonesRow}>
                  {signStones.map((stone, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.stoneItem}
                      onPress={() => setSelectedStone(selectedStone?.name === stone.name ? null : stone)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={stone.colors}
                        style={[styles.stoneGem, selectedStone?.name === stone.name && styles.stoneGemActive]}
                        start={{ x: 0.1, y: 0.0 }}
                        end={{ x: 0.9, y: 1.0 }}
                      >
                        <View style={styles.stoneShine} />
                        <Text style={styles.stoneEmoji}>{getGemIcon(stone, lang)}</Text>
                      </LinearGradient>
                      <Text style={[styles.stoneName, selectedStone?.name === stone.name && { color: stone.colors[0] }]} numberOfLines={2}>
                        {lang === 'en' ? stone.nameEn : stone.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {selectedStone && (
                  <View style={styles.stoneDescBox}>
                    <Text style={styles.stoneDescName}>
                      {getGemIcon(selectedStone, lang)}  {lang === 'en' ? selectedStone.nameEn : selectedStone.name}
                    </Text>
                    <Text style={styles.stoneDesc}>
                      {lang === 'en' ? selectedStone.descEn : selectedStone.desc}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.luckCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardIcon}>🍀</Text>
                <Text style={styles.cardTitle}>{t('home.luckTitle')}</Text>
              </View>
              <View style={styles.cardDivider} />
              <View style={styles.luckRow}>
                <View style={styles.luckItem}>
                  <Text style={styles.luckLabel}>{t('home.luckNumber')}</Text>
                  <View style={styles.numberBadgeLarge}>
                    <Text style={styles.numberTextLarge}>{luck.number}</Text>
                  </View>
                </View>
                <View style={styles.luckDivider} />
                <View style={styles.luckItem}>
                  <Text style={styles.luckLabel}>{t('home.luckColor')}</Text>
                  <View style={[styles.colorDot, { backgroundColor: luck.colorHex }]} />
                  <Text style={styles.luckValue}>{luck.color}</Text>
                </View>
                <View style={styles.luckDivider} />
                <View style={styles.luckItem}>
                  <Text style={styles.luckLabel}>{t('home.luckObject')}</Text>
                  <Text style={styles.luckEmoji}>✨</Text>
                  <Text style={styles.luckValue}>{luck.object}</Text>
                </View>
              </View>
            </View>

            {/* HOROSKOP Z ZAKŁADKAMI */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardIcon}>⭐</Text>
                <Text style={styles.cardTitle}>{t('home.horoscopeTitle')}</Text>
                {!loading && (
                  <TouchableOpacity onPress={refreshHoroscope} style={styles.horoscopeRefreshBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={styles.horoscopeRefreshIcon}>↻</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.cardDivider} />

              {loading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator color="#d4af37" size="large" />
                  <Text style={styles.loadingLabel}>{t('home.loading')}</Text>
                </View>
              ) : (
                <>
                  <View style={styles.tabsContainer}>
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.tabButton, activeCategory === cat.id && styles.tabButtonActive]}
                        onPress={() => setActiveCategory(cat.id)}
                      >
                        <Text style={styles.tabIcon}>{cat.icon}</Text>
                        <Text style={[styles.tabLabel, activeCategory === cat.id && styles.tabLabelActive]}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.cardBody}>
                    {horoscope[activeCategory] || horoscope.general}
                  </Text>

                  <View style={styles.horoscopeActions}>
                    <TouchableOpacity style={[styles.favBtn, isFav && styles.favBtnActive]} onPress={toggleFav}>
                      <Text style={styles.favBtnText}>{isFav ? t('home.saved') : t('home.save')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.shareBtn} onPress={shareHoroscope}>
                      <Text style={styles.shareBtnText}>↗  {lang === 'en' ? 'Share' : 'Udostępnij'}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>

            {/* BIORYTMY */}
            {userBirth && (() => {
              const bd = userBirth.split('.');
              if (bd.length < 3) return null;
              const birth = new Date(parseInt(bd[2]), parseInt(bd[1])-1, parseInt(bd[0]));
              const days = Math.floor((new Date() - birth) / (1000*60*60*24));
              const phy = Math.round(Math.sin((2*Math.PI*days)/23)*100);
              const emo = Math.round(Math.sin((2*Math.PI*days)/28)*100);
              const int = Math.round(Math.sin((2*Math.PI*days)/33)*100);
              const Bar = ({value, label, color}) => (
                <View style={{marginBottom:12}}>
                  <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:4}}>
                    <Text style={{fontFamily:'Raleway_600SemiBold',color: '#ffffff',fontSize:12}}>{label}</Text>
                    <Text style={{fontFamily:'Cinzel_700Bold',color,fontSize:13}}>{value>0?'+':''}{value}%</Text>
                  </View>
                  <View style={{height:8,borderRadius:4,backgroundColor:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
                    <View style={{position:'absolute',left:'50%',top:0,bottom:0,width:1,backgroundColor:'rgba(255,255,255,0.15)'}}/>
                    <View style={{position:'absolute',[value>=0?'left':'right']:'50%',top:0,bottom:0,width:`${Math.abs(value)/2}%`,backgroundColor:color,opacity:0.85,borderRadius:4}}/>
                  </View>
                </View>
              );
              return (
                <View style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardIcon}>〰️</Text>
                    <Text style={styles.cardTitle}>{lang==='en'?'BIORHYTHM TODAY':'BIORYTMY DZIŚ'}</Text>
                  </View>
                  <View style={styles.cardDivider} />
                  <Bar value={phy} label={lang==='en'?'💪  Physical':'💪  Fizyczny'} color="#e74c3c"/>
                  <Bar value={emo} label={lang==='en'?'💙  Emotional':'💙  Emocjonalny'} color="#3498db"/>
                  <Bar value={int} label={lang==='en'?'🧠  Intellectual':'🧠  Intelektualny'} color="#d4af37"/>
                  <Text style={{fontFamily:'Raleway_300Light',color: '#ffffff',fontSize:10,fontStyle:'italic',marginTop:4}}>
                    {lang==='en'?'+ positive  ·  − negative  ·  0 = critical day':'+ pozytywny  ·  − negatywny  ·  0 = dzień krytyczny'}
                  </Text>
                </View>
              );
            })()}

            {/* PRZEPIS DNIA */}
            <View style={styles.card}>
              <TouchableOpacity onPress={toggleRecipe} activeOpacity={0.8}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardIcon}>🍽️</Text>
                  <Text style={styles.cardTitle}>
                    {recipe.title ? recipe.title : `${t('home.recipeTitle')} · ${userSign.name}`}
                  </Text>
                  <Text style={styles.toggleArrow}>{recipeVisible ? '∧' : '∨'}</Text>
                </View>
              </TouchableOpacity>

              {loadingRecipe && (
                <View style={styles.loadingBox}>
                  <ActivityIndicator color="#d4af37" size="small" />
                  <Text style={styles.loadingLabel}>{t('home.recipeCooking')}</Text>
                </View>
              )}

              {recipeVisible && !loadingRecipe && (
                <Animated.View style={{ opacity: recipeAnim }}>
                  <View style={styles.cardDivider} />

                  {recipe.description ? <Text style={styles.recipeDescription}>{recipe.description}</Text> : null}

                  {recipe.prepTime ? (
                    <View style={styles.prepTimeBadge}>
                      <Text style={styles.prepTimeText}>⏱️ {lang === 'en' ? 'Prep time' : 'Czas'}: {recipe.prepTime}</Text>
                    </View>
                  ) : null}

                  {recipe.ingredients && recipe.ingredients.length > 0 && (
                    <View style={styles.recipeSection}>
                      <Text style={styles.recipeSubTitle}>✦ {lang === 'en' ? 'Ingredients' : 'Składniki'}</Text>
                      {recipe.ingredients.map((item, index) => (
                        <View key={`ing-${index}`} style={styles.bulletRow}>
                          <Text style={styles.bulletPoint}>✦</Text>
                          <Text style={styles.bulletText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {recipe.steps && recipe.steps.length > 0 && (
                    <View style={styles.recipeSection}>
                      <Text style={styles.recipeSubTitle}>✦ {lang === 'en' ? 'Preparation' : 'Przygotowanie'}</Text>
                      {recipe.steps.map((step, index) => (
                        <View key={`step-${index}`} style={styles.stepRow}>
                          <View style={styles.stepNumberContainer}>
                            <Text style={styles.stepNumber}>{index + 1}</Text>
                          </View>
                          <Text style={styles.stepText}>{step}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Animated.View>
              )}

              {!recipeVisible && !loadingRecipe && (
                <Text style={styles.tapHint}>{t('home.recipeTap')}</Text>
              )}
            </View>

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
  headerBlock: { alignItems: 'center', marginTop: 8, marginBottom: 20, width: '100%' },
  appTitle: { fontFamily: 'Cinzel_700Bold', fontSize: 16, color: '#d4af37', letterSpacing: 3 },
  dividerLine: { width: 60, height: 1, backgroundColor: 'rgba(212,175,55,0.4)', marginVertical: 10 },
  dateText: { fontFamily: 'Raleway_400Regular', color: '#ffffff', fontSize: 12, letterSpacing: 1, fontStyle: 'italic', textTransform: 'capitalize' },
  moonBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(212,175,55,0.08)', borderRadius: 24, paddingHorizontal: 18, paddingVertical: 8, marginBottom: 22, borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)', gap: 8 },
  moonEmoji: { fontSize: 16 },
  moonBadgeText: { fontFamily: 'Raleway_500Medium', color: '#d4af37', fontSize: 12, letterSpacing: 1 },
  signCard: { alignItems: 'center', marginBottom: 24 },
  signEmoji: { fontSize: 60 },
  signName: { fontFamily: 'Cinzel_700Bold', color: '#fff', fontSize: 24, marginTop: 8, letterSpacing: 4 },
  signDates: { fontFamily: 'Raleway_400Regular', color: '#ffffff', fontSize: 12, marginTop: 4, letterSpacing: 1 },
  ascBadge: { marginTop: 8, backgroundColor: 'rgba(212,175,55,0.1)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)', alignSelf: 'center' },
  ascText: { fontFamily: 'Raleway_600SemiBold', color: '#d4af37', fontSize: 12, letterSpacing: 1 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(230,126,34,0.12)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(230,126,34,0.3)', alignSelf: 'center' },
  streakFire: { fontSize: 16 },
  streakText: { fontFamily: 'Raleway_700Bold', color: '#e67e22', fontSize: 13, letterSpacing: 0.5 },
  luckCard: { backgroundColor: 'rgba(212,175,55,0.06)', borderRadius: 20, padding: 20, width: '100%', borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)', marginBottom: 16 },
  luckRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  luckItem: { flex: 1, alignItems: 'center', gap: 8 },
  luckDivider: { width: 1, height: 70, backgroundColor: 'rgba(212,175,55,0.15)' },
  luckLabel: { fontFamily: 'Raleway_600SemiBold', color: '#d4af37', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase' },
  numberBadgeLarge: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(212,175,55,0.15)', borderWidth: 1.5, borderColor: 'rgba(212,175,55,0.5)', justifyContent: 'center', alignItems: 'center' },
  numberTextLarge: { fontFamily: 'Cinzel_700Bold', color: '#d4af37', fontSize: 22 },
  colorDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  luckValue: { fontFamily: 'Raleway_500Medium', color: '#ffffff', fontSize: 10, textAlign: 'center', letterSpacing: 0.3 },
  luckEmoji: { fontSize: 22 },
  card: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 20, width: '100%', borderWidth: 1, borderColor: 'rgba(212,175,55,0.18)', marginBottom: 16 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardIcon: { fontSize: 15 },
  cardTitle: { flex: 1, fontFamily: 'Cinzel_700Bold', color: '#d4af37', fontSize: 11, letterSpacing: 2 },
  toggleArrow: { fontFamily: 'Raleway_400Regular', color: '#d4af37', fontSize: 14 },
  cardDivider: { height: 1, backgroundColor: 'rgba(212,175,55,0.15)', marginBottom: 16 },
  cardBody: { fontFamily: 'Raleway_400Regular', color: '#ffffff', lineHeight: 28, fontSize: 15, letterSpacing: 0.4 },
  loadingBox: { alignItems: 'center', justifyContent: 'center', flex: 1, paddingVertical: 20, gap: 10 },
  loadingLabel: { fontFamily: 'Raleway_300Light', color: '#d4af37', fontSize: 12, fontStyle: 'italic', letterSpacing: 1 },
  tapHint: { fontFamily: 'Raleway_300Light', color: '#ffffff', fontSize: 12, fontStyle: 'italic', marginTop: 4, letterSpacing: 0.5 },
  tabsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.02)', padding: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.1)' },
  tabButton: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10, gap: 4 },
  tabButtonActive: { backgroundColor: 'rgba(212,175,55,0.15)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)' },
  tabIcon: { fontSize: 14 },
  tabLabel: { fontFamily: 'Raleway_500Medium', color: '#ffffff', fontSize: 10, letterSpacing: 0.5 },
  tabLabelActive: { color: '#d4af37', fontFamily: 'Raleway_700Bold' },
  // Kamienie
  stonesRow: { flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', gap: 12 },
  stoneItem: { alignItems: 'center', gap: 6, width: 64 },
  stoneGem: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  stoneGemActive: { borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)', elevation: 16 },
  stoneShine: { position: 'absolute', top: 5, left: 9, width: 18, height: 10, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.45)', transform: [{ rotate: '-35deg' }] },
  stoneEmoji: { fontSize: 24 },
  stoneName: { fontFamily: 'Raleway_600SemiBold', color: '#ffffff', fontSize: 9, textAlign: 'center', letterSpacing: 0.2 },
  stoneDescBox: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(212,175,55,0.12)', width: '100%' },
  stoneDescName: { fontFamily: 'Cinzel_700Bold', color: '#d4af37', fontSize: 12, letterSpacing: 1, marginBottom: 6 },
  stoneDesc: { fontFamily: 'Raleway_400Regular', color: '#ffffff', fontSize: 13, lineHeight: 21, fontStyle: 'italic' },
  // Przepis
  recipeDescription: { fontFamily: 'Raleway_400Regular', color: '#ffffff', fontSize: 13, lineHeight: 22, fontStyle: 'italic', marginBottom: 12 },
  prepTimeBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(212,175,55,0.08)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 16, borderWidth: 0.5, borderColor: 'rgba(212,175,55,0.2)' },
  prepTimeText: { fontFamily: 'Raleway_500Medium', color: '#d4af37', fontSize: 11, letterSpacing: 0.5 },
  recipeSection: { marginTop: 14 },
  recipeSubTitle: { fontFamily: 'Cinzel_600SemiBold', color: '#d4af37', fontSize: 11, letterSpacing: 1.5, marginBottom: 10, textTransform: 'uppercase' },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, paddingLeft: 4, gap: 8 },
  bulletPoint: { color: '#d4af37', fontSize: 10, marginTop: 3 },
  bulletText: { flex: 1, fontFamily: 'Raleway_400Regular', color: '#ffffff', fontSize: 13, lineHeight: 20 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 12 },
  stepNumberContainer: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(212,175,55,0.15)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.4)', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  stepNumber: { fontFamily: 'Cinzel_700Bold', color: '#d4af37', fontSize: 10 },
  stepText: { flex: 1, fontFamily: 'Raleway_400Regular', color: '#ffffff', fontSize: 13, lineHeight: 22 },
  horoscopeActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
  favBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(212,175,55,0.35)' },
  favBtnActive: { backgroundColor: 'rgba(212,175,55,0.12)', borderColor: '#d4af37' },
  favBtnText: { fontFamily: 'Raleway_600SemiBold', color: '#d4af37', fontSize: 12, letterSpacing: 1 },
  shareBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  shareBtnText: { fontFamily: 'Raleway_600SemiBold', color: '#ffffff', fontSize: 12, letterSpacing: 1 },
  horoscopeRefreshBtn: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)' },
  horoscopeRefreshIcon: { fontFamily: 'Raleway_600SemiBold', color: '#d4af37', fontSize: 14 },
});

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, ImageBackground, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { save, KEYS } from '../utils/storage';
import { SIGNS, getSignFromDateStr } from '../utils/astro';
import AdBanner from '../components/AdBanner';
import i18n, { setLanguage } from '../utils/i18n';

const { width } = Dimensions.get('window');
const cardSize = (width - 40 - 36) / 4;

export default function OnboardingScreen({ onDone }) {
  const [step, setStep] = useState('language');
  const [selected, setSelected] = useState(null);
  const [birthInput, setBirthInput] = useState('');
  const [birthError, setBirthError] = useState('');
  const [birthMode, setBirthMode] = useState(false);
  const [, forceUpdate] = useState(0);

  // Bezpieczna funkcja tłumaczenia — nigdy nie zwraca null/object
  const t = (key) => {
    try {
      const val = i18n.t(key);
      if (typeof val === 'string') return val;
      return key;
    } catch {
      return key;
    }
  };

  const lang = i18n.locale || 'pl';

  const confirmBirthday = () => {
    const sign = getSignFromDateStr(birthInput);
    if (!sign) {
      setBirthError(lang === 'en' ? 'Invalid date (DD.MM.YYYY)' : 'Nieprawidłowa data (DD.MM.RRRR)');
      return;
    }
    setBirthError('');
    setSelected(sign);
    setBirthMode(false);
  };

  const handleSelectLanguage = async (langCode) => {
    try {
      if (typeof setLanguage === 'function') {
        await setLanguage(langCode);
      }
      i18n.locale = langCode;
    } catch {}
    forceUpdate(n => n + 1);
    setStep('zodiac');
  };

  const confirm = async () => {
    if (!selected) return;
    await save(KEYS.USER_SIGN, selected);
    if (birthInput.trim() && isValidDate(birthInput.trim())) {
      await save(KEYS.USER_BIRTH, birthInput.trim());
    }
    onDone(selected);
  };

  const isValidDate = (str) => {
    const parts = str.split('.');
    if (parts.length !== 3) return false;
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const y = parseInt(parts[2], 10);
    return !isNaN(d) && !isNaN(m) && !isNaN(y) && d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900;
  };

  return (
    <ImageBackground source={require('../../assets/bg.png')} style={{ flex: 1 }} resizeMode="cover">
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

          {/* KROK 1: WYBÓR JĘZYKA */}
          {step === 'language' && (
            <View style={styles.stepWrapper}>
              <View style={styles.hero}>
                <Text style={styles.heroStar}>✦</Text>
                <Text style={styles.heroTitle}>CHOOSE LANGUAGE</Text>
                <View style={styles.heroDivider} />
                <Text style={styles.heroSubtitle}>WYBIERZ JĘZYK</Text>
              </View>
              <View style={styles.langContainer}>
                <TouchableOpacity style={styles.langBtn} onPress={() => handleSelectLanguage('pl')} activeOpacity={0.85}>
                  <Text style={styles.langBtnText}>🇵🇱 POLSKI</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.langBtn} onPress={() => handleSelectLanguage('en')} activeOpacity={0.85}>
                  <Text style={styles.langBtnText}>🇬🇧 ENGLISH</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* KROK 2: WYBÓR ZNAKU */}
          {step === 'zodiac' && (
            <View style={styles.stepWrapper}>
              <View style={styles.hero}>
                <Text style={styles.heroStar}>✦</Text>
                <Text style={styles.heroTitle}>{t('onboarding.title')}</Text>
                <View style={styles.heroDivider} />
                <Text style={styles.heroSubtitle}>{t('onboarding.subtitle')}</Text>
              </View>

              {/* Toggle trybu */}
              <View style={styles.modeToggleRow}>
                <TouchableOpacity
                  style={[styles.modeToggleBtn, !birthMode && styles.modeToggleBtnActive]}
                  onPress={() => { setBirthMode(false); setBirthError(''); }}
                >
                  <Text style={[styles.modeToggleText, !birthMode && styles.modeToggleTextActive]}>
                    {lang === 'en' ? '♊  Pick your sign' : '♊  Wybierz znak'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeToggleBtn, birthMode && styles.modeToggleBtnActive]}
                  onPress={() => { setBirthMode(true); setBirthError(''); }}
                >
                  <Text style={[styles.modeToggleText, birthMode && styles.modeToggleTextActive]}>
                    {lang === 'en' ? '🎂  Enter birthday' : '🎂  Podaj urodziny'}
                  </Text>
                </TouchableOpacity>
              </View>

              {birthMode ? (
                <View style={styles.birthdayBox}>
                  <Text style={styles.birthdayLabel}>
                    {lang === 'en' ? 'Your date of birth' : 'Data urodzenia'}
                  </Text>
                  <TextInput
                    style={styles.birthdayInput}
                    placeholder={lang === 'en' ? 'DD.MM.YYYY' : 'DD.MM.RRRR'}
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    value={birthInput}
                    onChangeText={(v) => { setBirthInput(v); setBirthError(''); }}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                  {birthError ? (
                    <Text style={styles.birthdayError}>{birthError}</Text>
                  ) : null}
                  <TouchableOpacity style={styles.btn} onPress={confirmBirthday} activeOpacity={0.85}>
                    <Text style={styles.btnText}>
                      {lang === 'en' ? 'Detect Sign  ✦' : 'Wykryj Znak  ✦'}
                    </Text>
                  </TouchableOpacity>
                  {selected ? (
                    <View style={styles.detectedSign}>
                      <Text style={styles.detectedEmoji}>{selected.emoji}</Text>
                      <Text style={styles.detectedName}>
                        {lang === 'en' ? selected.nameEn : selected.name}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                <View style={styles.grid}>
                  {SIGNS.map((s) => (
                    <TouchableOpacity
                      key={s.key}
                      style={[styles.card, selected?.key === s.key && styles.cardSelected]}
                      onPress={() => setSelected(s)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cardEmoji}>{s.emoji}</Text>
                      <Text style={[styles.cardName, selected?.key === s.key && styles.cardNameActive]}>
                        {lang === 'en' ? s.nameEn : s.name}
                      </Text>
                      <Text style={styles.cardDates}>{s.dates}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {selected ? (
                <View style={styles.confirmBlock}>
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedEmoji}>{selected.emoji}</Text>
                    <Text style={styles.selectedName}>
                      {lang === 'en' ? selected.nameEn : selected.name}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.btn} onPress={confirm} activeOpacity={0.85}>
                    <Text style={styles.btnText}>{t('onboarding.btn')}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          )}

          <AdBanner />
          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center' },
  stepWrapper: { width: '100%', alignItems: 'center' },
  hero: { alignItems: 'center', marginTop: 16, marginBottom: 32 },
  heroStar: { fontFamily: 'Cinzel_400Regular', fontSize: 28, color: '#d4af37', marginBottom: 12, letterSpacing: 8 },
  heroTitle: { fontFamily: 'Cinzel_700Bold', fontSize: 32, color: '#fff', textAlign: 'center', letterSpacing: 4, lineHeight: 44 },
  heroDivider: { width: 60, height: 1, backgroundColor: 'rgba(212,175,55,0.5)', marginVertical: 16 },
  heroSubtitle: { fontFamily: 'Raleway_300Light', fontSize: 13, color: '#ffffff', textAlign: 'center', lineHeight: 22, letterSpacing: 0.5, fontStyle: 'italic' },
  langContainer: { gap: 16, width: '100%', alignItems: 'center', marginTop: 10 },
  langBtn: { width: '85%', backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(212,175,55,0.2)', borderWidth: 1, borderRadius: 34, paddingVertical: 16, alignItems: 'center' },
  langBtnText: { fontFamily: 'Cinzel_600SemiBold', color: '#fff', fontSize: 14, letterSpacing: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, width: '100%' },
  card: { width: cardSize, paddingVertical: 12, paddingHorizontal: 4, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.15)', alignItems: 'center' },
  cardSelected: { borderColor: '#d4af37', backgroundColor: 'rgba(212,175,55,0.12)' },
  cardEmoji: { fontSize: 26, marginBottom: 6 },
  cardName: { fontFamily: 'Raleway_600SemiBold', color: '#ffffff', fontSize: 11, textAlign: 'center' },
  cardNameActive: { color: '#d4af37' },
  cardDates: { fontFamily: 'Raleway_300Light', color: '#ffffff', fontSize: 8, marginTop: 3, textAlign: 'center', letterSpacing: 0.3 },
  confirmBlock: { alignItems: 'center', marginTop: 28, gap: 16 },
  selectedBadge: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(212,175,55,0.08)', borderRadius: 24, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)' },
  selectedEmoji: { fontSize: 22 },
  selectedName: { fontFamily: 'Cinzel_600SemiBold', color: '#d4af37', fontSize: 14, letterSpacing: 2 },
  btn: { backgroundColor: '#d4af37', paddingVertical: 16, paddingHorizontal: 44, borderRadius: 34 },
  btnText: { fontFamily: 'Cinzel_700Bold', color: '#0a0015', fontSize: 14, letterSpacing: 2 },
  modeToggleRow: { flexDirection: 'row', gap: 10, marginBottom: 20, width: '100%' },
  modeToggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
  modeToggleBtnActive: { borderColor: '#d4af37', backgroundColor: 'rgba(212,175,55,0.1)' },
  modeToggleText: { fontFamily: 'Raleway_600SemiBold', color: '#ffffff', fontSize: 12, letterSpacing: 0.5 },
  modeToggleTextActive: { color: '#d4af37' },
  birthdayBox: { width: '100%', alignItems: 'center', gap: 16, paddingVertical: 8 },
  birthdayLabel: { fontFamily: 'Cinzel_600SemiBold', color: '#d4af37', fontSize: 11, letterSpacing: 2 },
  birthdayInput: { width: '80%', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)', borderRadius: 20, paddingVertical: 14, paddingHorizontal: 20, color: '#fff', fontFamily: 'Raleway_400Regular', fontSize: 18, textAlign: 'center', letterSpacing: 4 },
  birthdayError: { fontFamily: 'Raleway_400Regular', color: '#e74c3c', fontSize: 12, letterSpacing: 0.3 },
  detectedSign: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(212,175,55,0.08)', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)' },
  detectedEmoji: { fontSize: 28 },
  detectedName: { fontFamily: 'Cinzel_700Bold', color: '#d4af37', fontSize: 18, letterSpacing: 2 },
});

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator,ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchDreamInterpretation, fetchJournalComment } from '../utils/astro';
import { load, save, KEYS } from '../utils/storage';
import AdBanner from '../components/AdBanner';
import i18n from '../utils/i18n';

const MOODS = ['😊', '😔', '😤', '😌', '🤩', '😰', '🥰', '😶'];

export default function DreamJournalScreen() {
  const [tab, setTab] = useState('dream');
  const [dream, setDream] = useState('');
  const [dreamResult, setDreamResult] = useState('');
  const [loadingDream, setLoadingDream] = useState(false);
  const [journalText, setJournalText] = useState('');
  const [mood, setMood] = useState(null);
  const [journalResult, setJournalResult] = useState('');
  const [loadingJournal, setLoadingJournal] = useState(false);
  const [entries, setEntries] = useState([]);
  const [dreamEntries, setDreamEntries] = useState([]);
  const t = (key) => i18n.t(key);
  const lang = i18n.locale;

  useEffect(() => { loadEntries(); loadDreamEntries(); }, []);
  const loadEntries = async () => { const e = await load(KEYS.JOURNAL) || []; setEntries(e); };
  // Historia snów — wcześniej KEYS.DREAMS był zdefiniowany w storage.js,
  // ale nigdzie w kodzie faktycznie nieużywany: interpretacja snu znikała,
  // gdy tylko użytkownik zszedł z ekranu. Teraz działa tak samo jak Dziennik.
  const loadDreamEntries = async () => { const e = await load(KEYS.DREAMS) || []; setDreamEntries(e); };

  const interpretDream = async () => {
    if (!dream.trim()) return;
    setLoadingDream(true); setDreamResult('');
    const text = await fetchDreamInterpretation(dream, lang);
    setDreamResult(text);
    const entry = {
      text: dream.trim(), result: text,
      date: new Date().toLocaleDateString(lang === 'en' ? 'en-GB' : 'pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }),
    };
    const updated = [entry, ...dreamEntries.slice(0, 29)];
    await save(KEYS.DREAMS, updated);
    setDreamEntries(updated);
    setLoadingDream(false);
  };

  const saveJournal = async () => {
    if (!journalText.trim()) return;
    setLoadingJournal(true); setJournalResult('');
    const comment = await fetchJournalComment(journalText, mood || 'unknown', lang);
    setJournalResult(comment);
    const entry = {
      text: journalText, mood: mood || '😶', comment,
      date: new Date().toLocaleDateString(lang === 'en' ? 'en-GB' : 'pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }),
    };
    const updated = [entry, ...entries.slice(0, 29)];
    await save(KEYS.JOURNAL, updated);
    setEntries(updated); setJournalText(''); setMood(null); setLoadingJournal(false);
  };

  return (
    <ImageBackground source={require('../../assets/bg.png')} style={{ flex: 1 }} resizeMode="cover">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.tabSwitch}>
          <TouchableOpacity style={[styles.switchBtn, tab === 'dream' && styles.switchBtnActive]} onPress={() => setTab('dream')}>
            <Text style={[styles.switchText, tab === 'dream' && styles.switchTextActive]}>{t('dreams.dreamTab')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.switchBtn, tab === 'journal' && styles.switchBtnActive]} onPress={() => setTab('journal')}>
            <Text style={[styles.switchText, tab === 'journal' && styles.switchTextActive]}>{t('dreams.journalTab')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {tab === 'dream' ? (
            <>
              <View style={styles.headerBlock}>
                <Text style={styles.pageTitle}>{t('dreams.dreamTitle')}</Text>
                <View style={styles.divider} />
                <Text style={styles.pageSubtitle}>{t('dreams.dreamSubtitle')}</Text>
              </View>
              <View style={styles.inputCard}>
                <Text style={styles.inputLabel}>{t('dreams.dreamLabel')}</Text>
                <TextInput style={styles.input} placeholder={t('dreams.dreamPlaceholder')} placeholderTextColor="rgba(255,255,255,0.18)" multiline numberOfLines={5} value={dream} onChangeText={setDream} textAlignVertical="top" />
              </View>
              <TouchableOpacity style={[styles.actionBtn, (!dream.trim() || loadingDream) && styles.actionBtnDisabled]} onPress={interpretDream} disabled={loadingDream || !dream.trim()} activeOpacity={0.85}>
                <Text style={styles.actionBtnText}>{t('dreams.dreamBtn')}  ✦</Text>
              </TouchableOpacity>
              {loadingDream && <ActivityIndicator color="#d4af37" size="large" style={{ marginTop: 20 }} />}
              {dreamResult ? (
                <View style={styles.resultCard}>
                  <View style={styles.cardHeaderRow}><Text style={styles.cardIcon}>🌙</Text><Text style={styles.cardTitle}>{t('dreams.dreamInterpretation')}</Text></View>
                  <View style={styles.cardDivider} />
                  <Text style={styles.cardBody}>{dreamResult}</Text>
                </View>
              ) : null}
              {dreamEntries.length > 0 && (
                <View style={styles.entriesSection}>
                  <View style={styles.cardHeaderRow}><Text style={styles.cardIcon}>📜</Text><Text style={styles.cardTitle}>{t('dreams.historyTitle')}</Text></View>
                  <View style={styles.entriesDivider} />
                  {dreamEntries.map((e, i) => (
                    <View key={i} style={styles.entryItem}>
                      <View style={styles.entryTop}>
                        <View style={styles.entryMoodBadge}><Text style={styles.entryMood}>🌙</Text></View>
                        <Text style={styles.entryDate}>{e.date}</Text>
                      </View>
                      <Text style={styles.entryText} numberOfLines={3}>{e.text}</Text>
                      {e.result ? <View style={styles.entryCommentBox}><Text style={styles.entryComment}>🌙  {e.result}</Text></View> : null}
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : (
            <>
              <View style={styles.headerBlock}>
                <Text style={styles.pageTitle}>{t('dreams.journalTitle')}</Text>
                <View style={styles.divider} />
                <Text style={styles.pageSubtitle}>{t('dreams.journalSubtitle')}</Text>
              </View>
              <View style={styles.inputCard}>
                <Text style={styles.inputLabel}>{t('dreams.journalLabel')}</Text>
                <TextInput style={styles.input} placeholder={t('dreams.journalPlaceholder')} placeholderTextColor="rgba(255,255,255,0.18)" multiline numberOfLines={5} value={journalText} onChangeText={setJournalText} textAlignVertical="top" />
              </View>
              <View style={styles.moodCard}>
                <Text style={styles.inputLabel}>{t('dreams.journalMood')}</Text>
                <View style={styles.moodRow}>
                  {MOODS.map(m => (
                    <TouchableOpacity key={m} style={[styles.moodBtn, mood === m && styles.moodBtnActive]} onPress={() => setMood(m)} activeOpacity={0.75}>
                      <Text style={styles.moodEmoji}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <TouchableOpacity style={[styles.actionBtn, (!journalText.trim() || loadingJournal) && styles.actionBtnDisabled]} onPress={saveJournal} disabled={loadingJournal || !journalText.trim()} activeOpacity={0.85}>
                <Text style={styles.actionBtnText}>{t('dreams.journalBtn')}  ✦</Text>
              </TouchableOpacity>
              {loadingJournal && <ActivityIndicator color="#d4af37" size="large" style={{ marginTop: 20 }} />}
              {journalResult ? (
                <View style={styles.resultCard}>
                  <View style={styles.cardHeaderRow}><Text style={styles.cardIcon}>✨</Text><Text style={styles.cardTitle}>{t('dreams.starsSpeak')}</Text></View>
                  <View style={styles.cardDivider} />
                  <Text style={styles.cardBody}>{journalResult}</Text>
                </View>
              ) : null}
              {entries.length > 0 && (
                <View style={styles.entriesSection}>
                  <View style={styles.cardHeaderRow}><Text style={styles.cardIcon}>📜</Text><Text style={styles.cardTitle}>{t('dreams.historyTitle')}</Text></View>
                  <View style={styles.entriesDivider} />
                  {entries.map((e, i) => (
                    <View key={i} style={styles.entryItem}>
                      <View style={styles.entryTop}>
                        <View style={styles.entryMoodBadge}><Text style={styles.entryMood}>{e.mood}</Text></View>
                        <Text style={styles.entryDate}>{e.date}</Text>
                      </View>
                      <Text style={styles.entryText} numberOfLines={3}>{e.text}</Text>
                      {e.comment ? <View style={styles.entryCommentBox}><Text style={styles.entryComment}>✨  {e.comment}</Text></View> : null}
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
          <AdBanner />
          <View style={{ height: 16 }} />
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  tabSwitch: { flexDirection: 'row', margin: 16, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 4, borderWidth: 1, borderColor: 'rgba(212,175,55,0.12)' },
  switchBtn: { flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
  switchBtnActive: { backgroundColor: 'rgba(212,175,55,0.15)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.35)' },
  switchText: { fontFamily: 'Raleway_600SemiBold', color: '#ffffff', fontSize: 13, letterSpacing: 0.5 },
  switchTextActive: { color: '#d4af37' },
  container: { padding: 16, alignItems: 'center' },
  headerBlock: { alignItems: 'center', marginTop: 8, marginBottom: 20, width: '100%' },
  pageTitle: { fontFamily: 'Cinzel_700Bold', fontSize: 16, color: '#d4af37', letterSpacing: 2 },
  divider: { width: 50, height: 1, backgroundColor: 'rgba(212,175,55,0.35)', marginVertical: 10 },
  pageSubtitle: { fontFamily: 'Raleway_300Light', color: '#ffffff', fontSize: 12, fontStyle: 'italic', letterSpacing: 0.5 },
  inputCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 18, width: '100%', borderWidth: 1, borderColor: 'rgba(212,175,55,0.18)', marginBottom: 14 },
  inputLabel: { fontFamily: 'Cinzel_600SemiBold', color: '#d4af37', fontSize: 10, letterSpacing: 2, marginBottom: 12 },
  input: { fontFamily: 'Raleway_400Regular', color: '#fff', fontSize: 15, lineHeight: 24, minHeight: 110, padding: 4, letterSpacing: 0.3 },
  moodCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 18, width: '100%', borderWidth: 1, borderColor: 'rgba(212,175,55,0.18)', marginBottom: 14 },
  moodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 6 },
  moodBtn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  moodBtnActive: { borderColor: '#d4af37', backgroundColor: 'rgba(212,175,55,0.12)' },
  moodEmoji: { fontSize: 24 },
  actionBtn: { backgroundColor: '#d4af37', paddingVertical: 15, paddingHorizontal: 36, borderRadius: 32, marginBottom: 16 },
  actionBtnDisabled: { opacity: 0.45 },
  actionBtnText: { fontFamily: 'Cinzel_700Bold', color: '#0a0015', fontSize: 13, letterSpacing: 2 },
  resultCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 20, width: '100%', borderWidth: 1, borderColor: 'rgba(212,175,55,0.18)', marginBottom: 16 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardIcon: { fontSize: 14 },
  cardTitle: { fontFamily: 'Cinzel_600SemiBold', color: '#d4af37', fontSize: 11, letterSpacing: 2 },
  cardDivider: { height: 1, backgroundColor: 'rgba(212,175,55,0.15)', marginBottom: 16 },
  cardBody: { fontFamily: 'Raleway_400Regular', color: '#ffffff', lineHeight: 26, fontSize: 15, letterSpacing: 0.3 },
  entriesSection: { width: '100%', marginTop: 8 },
  entriesDivider: { height: 1, backgroundColor: 'rgba(212,175,55,0.15)', marginBottom: 14, marginTop: 4 },
  entryItem: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(212,175,55,0.12)' },
  entryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  entryMoodBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(212,175,55,0.08)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)', justifyContent: 'center', alignItems: 'center' },
  entryMood: { fontSize: 18 },
  entryDate: { fontFamily: 'Raleway_300Light', color: '#ffffff', fontSize: 11, letterSpacing: 0.5, fontStyle: 'italic' },
  entryText: { fontFamily: 'Raleway_400Regular', color: '#ffffff', fontSize: 13, lineHeight: 22, marginBottom: 10, letterSpacing: 0.2 },
  entryCommentBox: { backgroundColor: 'rgba(212,175,55,0.06)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(212,175,55,0.15)', padding: 10 },
  entryComment: { fontFamily: 'Raleway_300Light', color: '#d4af37', fontSize: 12, fontStyle: 'italic', lineHeight: 20, letterSpacing: 0.3 },
});

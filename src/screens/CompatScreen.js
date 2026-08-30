import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, ImageBackground, TextInput, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SIGNS, fetchCompatibility, getSignFromDateStr, adjustCompatPercentForType } from '../utils/astro';
import { showInterstitialThrottled } from '../utils/ads';
import AdBanner from '../components/AdBanner';
import i18n from '../utils/i18n';

const RELATION_TYPES = [
  { key: 'love', pl: '❤️  Miłość', en: '❤️  Love' },
  { key: 'work', pl: '💼  Praca', en: '💼  Work' },
  { key: 'friendship', pl: '🤝  Przyjaźń', en: '🤝  Friendship' },
];

const COMPAT_TABLE = {
  aries:       { aries:88, taurus:62, gemini:84, cancer:55, leo:95, virgo:58, libra:70, scorpio:72, sagittarius:92, capricorn:60, aquarius:78, pisces:65 },
  taurus:      { aries:62, taurus:90, gemini:58, cancer:86, leo:65, virgo:94, libra:78, scorpio:82, sagittarius:55, capricorn:92, aquarius:60, pisces:88 },
  gemini:      { aries:84, taurus:58, gemini:85, cancer:60, leo:80, virgo:65, libra:92, scorpio:55, sagittarius:88, capricorn:52, aquarius:90, pisces:62 },
  cancer:      { aries:55, taurus:86, gemini:60, cancer:88, leo:68, virgo:82, libra:58, scorpio:92, sagittarius:50, capricorn:85, aquarius:55, pisces:94 },
  leo:         { aries:95, taurus:65, gemini:80, cancer:68, leo:86, virgo:60, libra:84, scorpio:62, sagittarius:90, capricorn:58, aquarius:74, pisces:65 },
  virgo:       { aries:58, taurus:94, gemini:65, cancer:82, leo:60, virgo:88, libra:70, scorpio:85, sagittarius:55, capricorn:92, aquarius:60, pisces:80 },
  libra:       { aries:70, taurus:78, gemini:92, cancer:58, leo:84, virgo:70, libra:85, scorpio:65, sagittarius:82, capricorn:60, aquarius:90, pisces:70 },
  scorpio:     { aries:72, taurus:82, gemini:55, cancer:92, leo:62, virgo:85, libra:65, scorpio:88, sagittarius:60, capricorn:86, aquarius:58, pisces:94 },
  sagittarius: { aries:92, taurus:55, gemini:88, cancer:50, leo:90, virgo:55, libra:82, scorpio:60, sagittarius:84, capricorn:58, aquarius:86, pisces:62 },
  capricorn:   { aries:60, taurus:92, gemini:52, cancer:85, leo:58, virgo:92, libra:60, scorpio:86, sagittarius:58, capricorn:90, aquarius:65, pisces:82 },
  aquarius:    { aries:78, taurus:60, gemini:90, cancer:55, leo:74, virgo:60, libra:90, scorpio:58, sagittarius:86, capricorn:65, aquarius:85, pisces:68 },
  pisces:      { aries:65, taurus:88, gemini:62, cancer:94, leo:65, virgo:80, libra:70, scorpio:94, sagittarius:62, capricorn:82, aquarius:68, pisces:90 },
};

function getCompatPercent(k1, k2) { return COMPAT_TABLE[k1]?.[k2] ?? 70; }
function getCompatColor(p) { if (p >= 85) return '#2ecc71'; if (p >= 70) return '#d4af37'; if (p >= 55) return '#e67e22'; return '#e74c3c'; }
function getCompatLabel(p, t) {
  if (p >= 90) return t('compat.excellent');
  if (p >= 80) return t('compat.veryGood');
  if (p >= 70) return t('compat.good');
  if (p >= 60) return t('compat.average');
  return t('compat.difficult');
}

export default function CompatScreen() {
  const [sign1, setSign1] = useState(null);
  const [sign2, setSign2] = useState(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [percent, setPercent] = useState(null);
  const t = (key) => i18n.t(key);
  const lang = i18n.locale;
  const [mode, setMode] = useState('signs'); // 'signs' | 'synastry'
  const [birth1, setBirth1] = useState('');
  const [birth2, setBirth2] = useState('');
  const [birthError, setBirthError] = useState('');
  const [synastry, setSynastry] = useState(null);
  const [relationType, setRelationType] = useState('love'); // 'love' | 'work' | 'friendship'

  const check = async () => {
    if (!sign1 || !sign2) return;
    setLoading(true); setResult('');
    const basePct = getCompatPercent(sign1.key, sign2.key);
    const pct = adjustCompatPercentForType(basePct, sign1.key, sign2.key, relationType);
    setPercent(pct);
    const s1name = lang === 'en' ? sign1.nameEn : sign1.name;
    const s2name = lang === 'en' ? sign2.nameEn : sign2.name;
    const text = await fetchCompatibility(s1name, s2name, pct, lang, relationType);
    setResult(text); setLoading(false);
    showInterstitialThrottled();
  };

  const shareResult = async () => {
    if (!sign1 || !sign2 || !result) return;
    try {
      const s1name = lang === 'en' ? sign1.nameEn : sign1.name;
      const s2name = lang === 'en' ? sign2.nameEn : sign2.name;
      const header = lang === 'en'
        ? `💞 Compatibility: ${s1name} & ${s2name} (${percent}%)`
        : `💞 Zgodność: ${s1name} i ${s2name} (${percent}%)`;
      const signature = lang === 'en' ? '\n\n— Stellar Guide' : '\n\n— Gwiezdny Przewodnik';
      await Share.share({ message: `${header}\n\n${result}${signature}` });
    } catch {}
  };

  const calcSynastry = (k1, k2) => {
    const base = getCompatPercent(k1, k2);
    const hash = (k1+k2).split('').reduce((a,c)=>a+c.charCodeAt(0),0);
    return {
      love: Math.min(99, Math.max(40, base + (hash%11) - 5)),
      comm: Math.min(99, Math.max(40, base + ((hash*3)%13) - 7)),
      sex:  Math.min(99, Math.max(40, base + ((hash*7)%17) - 9)),
    };
  };

  const checkSynastry = () => {
    setBirthError('');
    const s1 = getSignFromDateStr(birth1), s2 = getSignFromDateStr(birth2);
    if (!s1||!s2) { setBirthError(lang==='en'?'Check date format DD.MM.YYYY':'Sprawdź format daty DD.MM.RRRR'); return; }
    const scores = calcSynastry(s1.key, s2.key);
    setSynastry({ ...scores, sign1: s1, sign2: s2 });
    showInterstitialThrottled();
  };

  const SignGrid = ({ onSelect, selected, exclude }) => (
    <View style={styles.grid}>
      {SIGNS.filter(s => s.key !== exclude?.key).map(s => (
        <TouchableOpacity key={s.key} style={[styles.signBtn, selected?.key === s.key && styles.signBtnActive]} onPress={() => onSelect(s)} activeOpacity={0.75}>
          <Text style={styles.signEmoji}>{s.emoji}</Text>
          <Text style={[styles.signName, selected?.key === s.key && styles.signNameActive]}>
            {lang === 'en' ? s.nameEn : s.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ImageBackground source={require('../../assets/bg.png')} style={{ flex: 1 }} resizeMode="cover">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

          <View style={styles.headerBlock}>
            <Text style={styles.pageTitle}>✦ {t('compat.title')} ✦</Text>
            <View style={styles.divider} />
            <Text style={styles.pageSubtitle}>{t('compat.subtitle')}</Text>
          </View>

          {/* Mode toggle */}
          <View style={styles.modeToggleRow}>
            <TouchableOpacity style={[styles.modeBtn, mode==='signs'&&styles.modeBtnActive]} onPress={()=>{ setMode('signs'); setSynastry(null); setBirthError(''); }}>
              <Text style={[styles.modeBtnText, mode==='signs'&&styles.modeBtnTextActive]}>{lang==='en'?'♊  By Sign':'♊  Po Znaku'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modeBtn, mode==='synastry'&&styles.modeBtnActive]} onPress={()=>{ setMode('synastry'); setResult(''); setBirthError(''); }}>
              <Text style={[styles.modeBtnText, mode==='synastry'&&styles.modeBtnTextActive]}>{lang==='en'?'🎂  Synastry':'🎂  Synastria'}</Text>
            </TouchableOpacity>
          </View>

          {mode==='signs' && (<>
          <View style={styles.relationRow}>
            {RELATION_TYPES.map((r) => (
              <TouchableOpacity
                key={r.key}
                style={[styles.relationBtn, relationType === r.key && styles.relationBtnActive]}
                onPress={() => { setRelationType(r.key); setResult(''); setPercent(null); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.relationBtnText, relationType === r.key && styles.relationBtnTextActive]}>
                  {lang === 'en' ? r.en : r.pl}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepBadge}><Text style={styles.stepNum}>1</Text></View>
            <Text style={styles.stepLabel}>{t('compat.step1')}</Text>
          </View>
          <SignGrid onSelect={(s) => { setSign1(s); setResult(''); setPercent(null); }} selected={sign1} exclude={sign2} />

          {sign1 && (
            <>
              <View style={styles.stepRow}>
                <View style={styles.stepBadge}><Text style={styles.stepNum}>2</Text></View>
                <Text style={styles.stepLabel}>{t('compat.step2')}</Text>
              </View>
              <SignGrid onSelect={(s) => { setSign2(s); setResult(''); setPercent(null); }} selected={sign2} exclude={sign1} />
            </>
          )}

          {sign1 && sign2 && (
            <View style={styles.pairCard}>
              <Text style={styles.pairEmoji}>{sign1.emoji}</Text>
              <View style={styles.pairCenter}>
                <Text style={styles.pairHeart}>💞</Text>
                <Text style={styles.pairNames}>
                  {lang === 'en' ? sign1.nameEn : sign1.name}  ·  {lang === 'en' ? sign2.nameEn : sign2.name}
                </Text>
                {percent !== null && (
                  <View style={[styles.percentBadge, { borderColor: getCompatColor(percent) }]}>
                    <Text style={[styles.percentText, { color: getCompatColor(percent) }]}>{percent}%</Text>
                    <Text style={[styles.percentLabel, { color: getCompatColor(percent) }]}>{getCompatLabel(percent, t)}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.pairEmoji}>{sign2.emoji}</Text>
            </View>
          )}

          {sign1 && sign2 && !loading && (
            <TouchableOpacity style={styles.checkBtn} onPress={check} activeOpacity={0.85}>
              <Text style={styles.checkBtnText}>{t('compat.checkBtn')}  ✦</Text>
            </TouchableOpacity>
          )}

          {loading && <ActivityIndicator color="#d4af37" size="large" style={{ marginTop: 24 }} />}

          {result ? (
            <View style={styles.resultCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardIcon}>💫</Text>
                <Text style={styles.cardTitle}>{t('compat.analysisTitle')}</Text>
              </View>
              <View style={styles.cardDivider} />
              {percent !== null && (
                <View style={styles.percentBar}>
                  <View style={[styles.percentFill, { width: `${percent}%`, backgroundColor: getCompatColor(percent) }]} />
                  <Text style={styles.percentBarLabel}>{percent}% {t('compat.compatibility')}</Text>
                </View>
              )}
              <Text style={styles.resultText}>{result}</Text>
              <TouchableOpacity style={styles.shareBtn} onPress={shareResult} activeOpacity={0.8}>
                <Text style={styles.shareBtnText}>↗  {lang === 'en' ? 'Share' : 'Udostępnij'}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          </>)}{/* end signs mode */}

          {mode==='synastry' && (
            <View style={{ width:'100%', gap:16 }}>
              <Text style={[styles.pageTitle, {fontSize:13}]}>{lang==='en'?'💞  Partner Compatibility':'💞  Dopasowanie Partnerskie'}</Text>
              <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
                <View style={{ flex:1 }}>
                  <Text style={styles.stepLabel}>{lang==='en'?'Your birthday':'Twoja data'}</Text>
                  <TextInput style={styles.birthInput} placeholder={lang==='en'?'DD.MM.YYYY':'DD.MM.RRRR'} placeholderTextColor="rgba(255,255,255,0.2)" value={birth1} onChangeText={v=>{setBirth1(v);setBirthError('');}} keyboardType="numeric" maxLength={10} />
                </View>
                <Text style={{color:'#d4af37',fontSize:22,marginTop:18}}>💞</Text>
                <View style={{ flex:1 }}>
                  <Text style={styles.stepLabel}>{lang==='en'?'Their birthday':'Data partnera'}</Text>
                  <TextInput style={styles.birthInput} placeholder={lang==='en'?'DD.MM.YYYY':'DD.MM.RRRR'} placeholderTextColor="rgba(255,255,255,0.2)" value={birth2} onChangeText={v=>{setBirth2(v);setBirthError('');}} keyboardType="numeric" maxLength={10} />
                </View>
              </View>
              {birthError?<Text style={{fontFamily:'Raleway_400Regular',color:'#e74c3c',fontSize:12,textAlign:'center'}}>{birthError}</Text>:null}
              <TouchableOpacity style={styles.checkBtn} onPress={checkSynastry} activeOpacity={0.85}>
                <Text style={styles.checkBtnText}>{lang==='en'?'Reveal Synastry  ✦':'Odkryj Synastrię  ✦'}</Text>
              </TouchableOpacity>
              {synastry && (
                <View style={styles.resultCard}>
                  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,marginBottom:16}}>
                    <Text style={{fontSize:32}}>{synastry.sign1.emoji}</Text>
                    <Text style={{fontFamily:'Cinzel_600SemiBold',color: '#ffffff',fontSize:12}}>
                      {lang==='en'?synastry.sign1.nameEn:synastry.sign1.name}
                    </Text>
                    <Text style={{color:'#d4af37'}}>✦</Text>
                    <Text style={{fontFamily:'Cinzel_600SemiBold',color: '#ffffff',fontSize:12}}>
                      {lang==='en'?synastry.sign2.nameEn:synastry.sign2.name}
                    </Text>
                    <Text style={{fontSize:32}}>{synastry.sign2.emoji}</Text>
                  </View>
                  {[
                    {label:lang==='en'?'❤️  Love':'❤️  Miłość', value:synastry.love},
                    {label:lang==='en'?'💬  Communication':'💬  Komunikacja', value:synastry.comm},
                    {label:lang==='en'?'🔥  Attraction':'🔥  Chemia', value:synastry.sex},
                  ].map(({label,value})=>(
                    <View key={label} style={{marginBottom:12}}>
                      <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:4}}>
                        <Text style={{fontFamily:'Raleway_600SemiBold',color: '#ffffff',fontSize:13}}>{label}</Text>
                        <Text style={{fontFamily:'Cinzel_700Bold',color:getCompatColor(value),fontSize:18}}>{value}%</Text>
                      </View>
                      <View style={{height:8,borderRadius:4,backgroundColor:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
                        <View style={{position:'absolute',left:0,top:0,bottom:0,width:`${value}%`,backgroundColor:getCompatColor(value),opacity:0.85,borderRadius:4}} />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          <AdBanner />
          <View style={{ height: 16 }} />
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center' },
  headerBlock: { alignItems: 'center', marginTop: 8, marginBottom: 24, width: '100%' },
  pageTitle: { fontFamily: 'Cinzel_700Bold', fontSize: 16, color: '#d4af37', letterSpacing: 3 },
  divider: { width: 50, height: 1, backgroundColor: 'rgba(212,175,55,0.4)', marginVertical: 10 },
  pageSubtitle: { fontFamily: 'Raleway_300Light', color: '#ffffff', fontSize: 12, fontStyle: 'italic', letterSpacing: 0.5 },
  stepRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 10, marginBottom: 12, marginTop: 4 },
  stepBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(212,175,55,0.2)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.4)', justifyContent: 'center', alignItems: 'center' },
  stepNum: { fontFamily: 'Cinzel_700Bold', color: '#d4af37', fontSize: 12 },
  stepLabel: { fontFamily: 'Raleway_600SemiBold', color: '#ffffff', fontSize: 13, letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20, width: '100%' },
  signBtn: { width: 72, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.15)', alignItems: 'center' },
  signBtnActive: { borderColor: '#d4af37', backgroundColor: 'rgba(212,175,55,0.12)' },
  signEmoji: { fontSize: 22 },
  signName: { fontFamily: 'Raleway_500Medium', color: '#ffffff', fontSize: 10, marginTop: 4, textAlign: 'center' },
  signNameActive: { color: '#d4af37' },
  pairCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(212,175,55,0.06)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)', paddingHorizontal: 24, paddingVertical: 16, width: '100%', marginBottom: 16 },
  pairEmoji: { fontSize: 44 },
  pairCenter: { alignItems: 'center', gap: 6 },
  pairHeart: { fontSize: 26 },
  pairNames: { fontFamily: 'Raleway_400Regular', color: '#ffffff', fontSize: 11, letterSpacing: 1 },
  percentBadge: { alignItems: 'center', borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 6, marginTop: 4 },
  percentText: { fontFamily: 'Cinzel_700Bold', fontSize: 22, letterSpacing: 1 },
  percentLabel: { fontFamily: 'Raleway_600SemiBold', fontSize: 11, letterSpacing: 0.5 },
  checkBtn: { backgroundColor: '#d4af37', paddingVertical: 15, paddingHorizontal: 36, borderRadius: 32, marginBottom: 20 },
  checkBtnText: { fontFamily: 'Cinzel_700Bold', color: '#0a0015', fontSize: 13, letterSpacing: 2 },
  resultCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 20, width: '100%', borderWidth: 1, borderColor: 'rgba(212,175,55,0.18)' },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardIcon: { fontSize: 14 },
  cardTitle: { fontFamily: 'Cinzel_600SemiBold', color: '#d4af37', fontSize: 11, letterSpacing: 2 },
  cardDivider: { height: 1, backgroundColor: 'rgba(212,175,55,0.15)', marginBottom: 16 },
  percentBar: { height: 32, borderRadius: 16, overflow: 'hidden', marginBottom: 16, justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  percentFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 16, opacity: 0.7 },
  percentBarLabel: { fontFamily: 'Raleway_700Bold', textAlign: 'center', color: '#fff', fontSize: 12, letterSpacing: 1, zIndex: 1 },
  resultText: { fontFamily: 'Raleway_400Regular', color: '#ffffff', lineHeight: 26, fontSize: 15, letterSpacing: 0.3 },
  modeToggleRow: { flexDirection: 'row', gap: 10, marginBottom: 20, width: '100%' },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
  modeBtnActive: { borderColor: '#d4af37', backgroundColor: 'rgba(212,175,55,0.1)' },
  modeBtnText: { fontFamily: 'Raleway_600SemiBold', color: '#ffffff', fontSize: 12, letterSpacing: 0.5 },
  modeBtnTextActive: { color: '#d4af37' },
  birthInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14, color: '#fff', fontFamily: 'Raleway_400Regular', fontSize: 15, textAlign: 'center', letterSpacing: 2, marginTop: 6 },
  relationRow: { flexDirection: 'row', gap: 8, marginBottom: 20, width: '100%' },
  relationBtn: { flex: 1, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)' },
  relationBtnActive: { borderColor: '#d4af37', backgroundColor: 'rgba(212,175,55,0.1)' },
  relationBtnText: { fontFamily: 'Raleway_500Medium', color: '#ffffff', fontSize: 10.5, letterSpacing: 0.3 },
  relationBtnTextActive: { color: '#d4af37' },
  shareBtn: { alignSelf: 'center', marginTop: 16, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  shareBtnText: { fontFamily: 'Raleway_600SemiBold', color: '#ffffff', fontSize: 12, letterSpacing: 1 },
});

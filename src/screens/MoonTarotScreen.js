import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput, 
  ActivityIndicator, 
  Keyboard,
  ImageBackground,
  Dimensions,
  Animated,
  Image,
  Alert,
  Share
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getMoonPhase, fetchTarotReading } from '../utils/astro';
import { load, save } from '../utils/storage';
import AdBanner from '../components/AdBanner';
import { showInterstitialThrottled, showRewardedAd } from '../utils/ads';
import i18n from '../utils/i18n';

const { width } = Dimensions.get('window');

const MOON_INFO = {
  'Nów': { do: ['Medytuj głęboko', 'Zapisuj cele i marzenia', 'Zacznij nowy projekt', 'Czyść przestrzeń', 'Wyznaczaj intencje'], avoid: ['Konfrontacji i kłótni', 'Wielkich życiowych decyzji', 'Rozpraszania energii', 'Nadmiernej aktywności', 'Impulsywnych zakupów'], desc: 'Czas nowych początków. Siej intencje, planuj i wyznaczaj cele. Energia skupiona wewnątrz.' },
  'Przybywający Sierp': { do: ['Podejmuj pierwsze działania', 'Ucz się nowych rzeczy', 'Nawiązuj kontakty', 'Wyrażaj siebie', 'Siej i sadź rośliny'], avoid: ['Odkładania na później', 'Wątpliwości i lęku', 'Izolacji od ludzi', 'Porzucania projektów', 'Negatywnego myślenia'], desc: 'Energia rośnie z każdym dniem. Działaj na rzecz swoich intencji.' },
  'Pierwsza Kwadra': { do: ['Podejmuj trudne decyzje', 'Działaj odważnie', 'Rozwiązuj problemy', 'Buduj fundamenty', 'Konfrontuj wyzwania'], avoid: ['Unikania trudnych rozmów', 'Bierności i prokrastynacji', 'Pesymizmu', 'Poddawania się', 'Ignorowania sygnałów'], desc: 'Czas wyzwań i kluczowych decyzji. Siła woli jest na szczycie.' },
  'Gibbous Przybywający': { do: ['Analizuj i oceniaj postępy', 'Udoskonalaj plany', 'Bądź cierpliwy', 'Szlifuj szczegóły', 'Przygotuj się na kulminację'], avoid: ['Pośpiechu i niecierpliwości', 'Powierzchowności', 'Pomijania szczegółów', 'Zmiany planów w ostatniej chwili', 'Rozproszenia uwagi'], desc: 'Doprecyzuj plany i analizuj postępy. Energia buduje się ku pełni.' },
  'Pełnia': { do: ['Świętuj sukcesy', 'Praktykuj wdzięczność', 'Ładuj kryształy', 'Medytuj przy księżycu', 'Finalizuj projekty'], avoid: ['Impulsywnych decyzji', 'Kłótni i konfrontacji', 'Ważnych operacji', 'Nadmiernego picia', 'Nowych zobowiązań'], desc: 'Szczyt energii księżycowej. Czas kulminacji i objawień.' },
  'Gibbous Ubywający': { do: ['Dziel się wiedzą', 'Pomagaj innym', 'Porządkuj i organizuj', 'Wyrażaj wdzięczność', 'Oddawaj to co zbędne'], avoid: ['Zachłanności', 'Gromadzenia rzeczy', 'Nowych projektów', 'Egoizmu', 'Kurczowego trzymania się'], desc: 'Czas refleksji i oddawania. Energia opada, czas na hojność.' },
  'Ostatnia Kwadra': { do: ['Odpuść stare przyzwyczajenia', 'Czyść przestrzeń', 'Odpoczywaj i regeneruj', 'Kończ sprawy', 'Wybaczaj i puszczaj'], avoid: ['Trzymania się przeszłości', 'Przepracowania', 'Nowych projektów', 'Konfliktów', 'Nadmiernych wydatków'], desc: 'Czas puszczania i oczyszczenia. Przygotowanie do nowego cyklu.' },
  'Ubywający Sierp': { do: ['Medytuj i kontempluj', 'Śnij i zapisuj sny', 'Planuj nowy cykl', 'Regeneruj siły', 'Słuchaj intuicji'], avoid: ['Nadmiaru aktywności', 'Hałasu i rozproszenia', 'Stresu i presji', 'Ważnych spotkań', 'Impulsywnych działań'], desc: 'Głęboki odpoczynek i introspekcja. Słuchaj intuicji i śnij.' },
};

const MOON_INFO_EN = {
  'New Moon': { do: ['Meditate deeply', 'Write goals and dreams', 'Start new projects', 'Clear your space', 'Set intentions'], avoid: ['Conflicts and arguments', 'Major life decisions', 'Dispersing energy', 'Excessive activity', 'Impulse purchases'], desc: 'Time of new beginnings. Sow intentions, plan and set goals. Energy focused within.' },
  'Waxing Crescent': { do: ['Take first steps', 'Learn new things', 'Network and connect', 'Express yourself', 'Plant seeds'], avoid: ['Procrastination', 'Doubts and fears', 'Isolating yourself', 'Abandoning projects', 'Negative thinking'], desc: 'Energy grows each day. Act on your intentions — good time for first steps.' },
  'First Quarter': { do: ['Make tough decisions', 'Act boldly', 'Solve problems', 'Build foundations', 'Face challenges'], avoid: ['Avoiding difficult talks', 'Passivity', 'Pessimism', 'Giving up', 'Ignoring signals'], desc: 'Time of challenges and key decisions. Your willpower is at its peak.' },
  'Waxing Gibbous': { do: ['Analyze progress', 'Refine plans', 'Be patient', 'Polish details', 'Prepare for culmination'], avoid: ['Rushing', 'Superficiality', 'Skipping details', 'Last-minute changes', 'Distraction'], desc: 'Refine your plans and analyze progress. Energy builds toward the full moon.' },
  'Full Moon': { do: ['Celebrate success', 'Practice gratitude', 'Charge crystals', 'Meditate by moonlight', 'Finalize projects'], avoid: ['Impulsive decisions', 'Arguments', 'Major surgery', 'Excessive drinking', 'New commitments'], desc: 'Peak of lunar energy. Time of culmination and revelations.' },
  'Waning Gibbous': { do: ['Share knowledge', 'Help others', 'Organize and declutter', 'Express gratitude', 'Give away what is unnecessary'], avoid: ['Greed', 'Hoarding', 'New ambitious projects', 'Selfishness', 'Clinging'], desc: 'Time of reflection and giving. Energy recedes — time for generosity.' },
  'Last Quarter': { do: ['Let go of old habits', 'Clear physical space', 'Rest and regenerate', 'Finish unfinished business', 'Forgive and release'], avoid: ['Clinging to the past', 'Overworking', 'Starting new projects', 'Conflicts', 'Overspending'], desc: 'Time of releasing and cleansing. Preparation for a new cycle.' },
  'Waning Crescent': { do: ['Meditate and contemplate', 'Dream and record dreams', 'Plan the next cycle', 'Restore your strength', 'Listen to intuition'], avoid: ['Excessive activity', 'Noise and distraction', 'Stress and pressure', 'Important meetings', 'Impulsive actions'], desc: 'Deep rest and introspection. Listen to your intuition and dream.' },
};

const MOON_PHASE_EMOJIS = ['🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘'];
function getMoonEmoji(day) {
  const idx = Math.floor(((day - 1) / 29.5) * 8) % 8;
  return MOON_PHASE_EMOJIS[idx];
}

function LunarCalendar({ lang, getMoonPhase, t }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();
  const monthName = now.toLocaleDateString(lang === 'en' ? 'en-GB' : 'pl-PL', { month: 'long', year: 'numeric' });

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month, i + 1);
    const phase = getMoonPhase(d);
    return { day: i + 1, emoji: getMoonEmoji(phase.day), phaseDay: phase.day };
  });

  return (
    <View style={{ width: '100%', marginTop: 20 }}>
      <Text style={{ fontFamily: 'Cinzel_600SemiBold', color: '#d4af37', fontSize: 12, letterSpacing: 2, marginBottom: 12, textTransform: 'capitalize' }}>
        ✦ {lang === 'en' ? 'Lunar Calendar' : 'Kalendarz Księżycowy'} · {monthName}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
        {days.map(({ day, emoji, phaseDay }) => (
          <View key={day} style={{
            width: 38, height: 44, borderRadius: 10,
            backgroundColor: day === today ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.03)',
            borderWidth: 1,
            borderColor: day === today ? 'rgba(212,175,55,0.6)' : 'rgba(255,255,255,0.06)',
            alignItems: 'center', justifyContent: 'center', gap: 1,
          }}>
            <Text style={{ fontSize: 14 }}>{emoji}</Text>
            <Text style={{ fontFamily: 'Raleway_500Medium', color: day === today ? '#d4af37' : 'rgba(255,255,255,0.35)', fontSize: 9 }}>{day}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function FlipCard({ card, index, revealed, onReveal, getRoleLabel, lang }) {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const isRevealed = revealed[index];

  useEffect(() => {
    if (isRevealed) {
      Animated.spring(flipAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }).start();
    } else {
      flipAnim.setValue(0);
    }
  }, [isRevealed]);

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  return (
    <TouchableOpacity onPress={() => !isRevealed && onReveal(index)} activeOpacity={isRevealed ? 1 : 0.8} style={{ alignItems: 'center', gap: 6 }}>
      <Animated.View style={{
        position: isRevealed ? 'absolute' : 'relative',
        backfaceVisibility: 'hidden',
        transform: [{ rotateY: frontRotate }],
        width: 90, height: 130, borderRadius: 16,
        backgroundColor: 'rgba(30,0,60,0.9)',
        borderWidth: 1.5, borderColor: 'rgba(212,175,55,0.4)',
        justifyContent: 'center', alignItems: 'center',
        opacity: isRevealed ? 0 : 1,
      }}>
        <Text style={{ fontSize: 36 }}>✦</Text>
        <Text style={{ fontFamily: 'Raleway_300Light', color: '#d4af37', fontSize: 9, letterSpacing: 1, marginTop: 4 }}>
          {lang === 'en' ? 'TAP' : 'DOTKNIJ'}
        </Text>
      </Animated.View>
      {isRevealed && (
        <Animated.View style={{
          backfaceVisibility: 'hidden',
          transform: [{ rotateY: backRotate }],
          width: 90, height: 130, borderRadius: 16,
          overflow: 'hidden',
          borderWidth: 1.5, borderColor: '#d4af37',
        }}>
          {card.image ? (
            <Image source={card.image} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View style={{ flex: 1, backgroundColor: 'rgba(212,175,55,0.08)', justifyContent: 'center', alignItems: 'center', gap: 4, paddingHorizontal: 6 }}>
              <Text style={{ fontSize: 32 }}>{card.emoji}</Text>
              <Text style={{ fontFamily: 'Raleway_600SemiBold', color: '#fff', fontSize: 9, textAlign: 'center', letterSpacing: 0.3 }} numberOfLines={2}>
                {lang === 'en' ? card.nameEn : card.name}
              </Text>
            </View>
          )}
        </Animated.View>
      )}
      <Text style={{ fontFamily: 'Raleway_400Regular', color: '#d4af37', fontSize: 10, letterSpacing: 0.5 }}>
        {getRoleLabel(index)}
      </Text>
    </TouchableOpacity>
  );
}

const TAROT_CARDS = [
  { name: 'Głupiec', nameEn: 'The Fool', emoji: '🃏', symbols: ['☀️', '🌸', '🐕'], image: require('../../assets/tarot/00-TheFool.jpg') },
  { name: 'Mag', nameEn: 'The Magician', emoji: '🔮', symbols: ['⚡', '🌟', '🔱'], image: require('../../assets/tarot/01-TheMagician.jpg') },
  { name: 'Kapłanka', nameEn: 'The High Priestess', emoji: '🌙', symbols: ['🌙', '📜', '💧'], image: require('../../assets/tarot/02-TheHighPriestess.jpg') },
  { name: 'Cesarzowa', nameEn: 'The Empress', emoji: '🌺', symbols: ['🌿', '💎', '🌾'], image: require('../../assets/tarot/03-TheEmpress.jpg') },
  { name: 'Cesarz', nameEn: 'The Emperor', emoji: '👑', symbols: ['🏔️', '⚔️', '🦅'], image: require('../../assets/tarot/04-TheEmperor.jpg') },
  { name: 'Hierofant', nameEn: 'The Hierophant', emoji: '⛪', symbols: ['🗝️', '📿', '🕊️'], image: require('../../assets/tarot/05-TheHierophant.jpg') },
  { name: 'Kochankowie', nameEn: 'The Lovers', emoji: '💑', symbols: ['❤️', '🌹', '☁️'], image: require('../../assets/tarot/06-TheLovers.jpg') },
  { name: 'Rydwan', nameEn: 'The Chariot', emoji: '🏆', symbols: ['⭐', '🛡️', '🐆'], image: require('../../assets/tarot/07-TheChariot.jpg') },
  { name: 'Siła', nameEn: 'Strength', emoji: '🦁', symbols: ['∞', '🌸', '🦁'], image: require('../../assets/tarot/08-Strength.jpg') },
  { name: 'Pustelnik', nameEn: 'The Hermit', emoji: '🕯️', symbols: ['🕯️', '⛰️', '🌟'], image: require('../../assets/tarot/09-TheHermit.jpg') },
  { name: 'Koło Fortuny', nameEn: 'Wheel of Fortune', emoji: '☸️', symbols: ['☸️', '🔄', '🐍'], image: require('../../assets/tarot/10-WheelOfFortune.jpg') },
  { name: 'Sprawiedliwość', nameEn: 'Justice', emoji: '⚖️', symbols: ['⚖️', '⚔️', '👁️'], image: require('../../assets/tarot/11-Justice.jpg') },
  { name: 'Wisielec', nameEn: 'The Hanged Man', emoji: '🙃', symbols: ['💧', '🌿', '✨'], image: require('../../assets/tarot/12-TheHangedMan.jpg') },
  { name: 'Śmierć', nameEn: 'Death', emoji: '🦋', symbols: ['🦋', '🌅', '🏳️'], image: require('../../assets/tarot/13-Death.jpg') },
  { name: 'Umiarkowanie', nameEn: 'Temperance', emoji: '⚗️', symbols: ['💧', '🔥', '🌈'], image: require('../../assets/tarot/14-Temperance.jpg') },
  { name: 'Diabeł', nameEn: 'The Devil', emoji: '🔗', symbols: ['⛓️', '🔥', '🐐'], image: require('../../assets/tarot/15-TheDevil.jpg') },
  { name: 'Wieża', nameEn: 'The Tower', emoji: '⚡', symbols: ['⚡', '🔥', '👑'], image: require('../../assets/tarot/16-TheTower.jpg') },
  { name: 'Gwiazda', nameEn: 'The Star', emoji: '⭐', symbols: ['⭐', '💧', '🕊️'], image: require('../../assets/tarot/17-TheStar.jpg') },
  { name: 'Księżyc', nameEn: 'The Moon', emoji: '🌕', symbols: ['🌕', '🌊', '🦀'], image: require('../../assets/tarot/18-TheMoon.jpg') },
  { name: 'Słońce', nameEn: 'The Sun', emoji: '☀️', symbols: ['☀️', '🌻', '🐴'], image: require('../../assets/tarot/19-TheSun.jpg') },
  { name: 'Sąd', nameEn: 'Judgement', emoji: '📯', symbols: ['📯', '🔥', '👼'], image: require('../../assets/tarot/20-Judgement.jpg') },
  { name: 'Świat', nameEn: 'The World', emoji: '🌍', symbols: ['🌍', '🌿', '💫'], image: require('../../assets/tarot/21-TheWorld.jpg') },
  { name: 'As Kielichów', nameEn: 'Ace of Cups', emoji: '🏆', symbols: ['🌊', '💧', '🌙'], image: require('../../assets/tarot/Cups01.jpg') },
  { name: 'Dwójka Kielichów', nameEn: 'Two of Cups', emoji: '🏆', symbols: ['🌊', '💧', '🌙'], image: require('../../assets/tarot/Cups02.jpg') },
  { name: 'Trójka Kielichów', nameEn: 'Three of Cups', emoji: '🏆', symbols: ['🌊', '💧', '🌙'], image: require('../../assets/tarot/Cups03.jpg') },
  { name: 'Czwórka Kielichów', nameEn: 'Four of Cups', emoji: '🏆', symbols: ['🌊', '💧', '🌙'], image: require('../../assets/tarot/Cups04.jpg') },
  { name: 'Piątka Kielichów', nameEn: 'Five of Cups', emoji: '🏆', symbols: ['🌊', '💧', '🌙'], image: require('../../assets/tarot/Cups05.jpg') },
  { name: 'Szóstka Kielichów', nameEn: 'Six of Cups', emoji: '🏆', symbols: ['🌊', '💧', '🌙'], image: require('../../assets/tarot/Cups06.jpg') },
  { name: 'Siódemka Kielichów', nameEn: 'Seven of Cups', emoji: '🏆', symbols: ['🌊', '💧', '🌙'], image: require('../../assets/tarot/Cups07.jpg') },
  { name: 'Ósemka Kielichów', nameEn: 'Eight of Cups', emoji: '🏆', symbols: ['🌊', '💧', '🌙'], image: require('../../assets/tarot/Cups08.jpg') },
  { name: 'Dziewiątka Kielichów', nameEn: 'Nine of Cups', emoji: '🏆', symbols: ['🌊', '💧', '🌙'], image: require('../../assets/tarot/Cups09.jpg') },
  { name: 'Dziesiątka Kielichów', nameEn: 'Ten of Cups', emoji: '🏆', symbols: ['🌊', '💧', '🌙'], image: require('../../assets/tarot/Cups10.jpg') },
  { name: 'Paź Kielichów', nameEn: 'Page of Cups', emoji: '🏆', symbols: ['🌊', '💧', '🌙'], image: require('../../assets/tarot/Cups11.jpg') },
  { name: 'Rycerz Kielichów', nameEn: 'Knight of Cups', emoji: '🏆', symbols: ['🌊', '💧', '🌙'], image: require('../../assets/tarot/Cups12.jpg') },
  { name: 'Królowa Kielichów', nameEn: 'Queen of Cups', emoji: '🏆', symbols: ['🌊', '💧', '🌙'], image: require('../../assets/tarot/Cups13.jpg') },
  { name: 'Król Kielichów', nameEn: 'King of Cups', emoji: '🏆', symbols: ['🌊', '💧', '🌙'], image: require('../../assets/tarot/Cups14.jpg') },
  { name: 'As Pentakli', nameEn: 'Ace of Pentacles', emoji: '⭐', symbols: ['🌿', '💰', '🌍'], image: require('../../assets/tarot/Pentacles01.jpg') },
  { name: 'Dwójka Pentakli', nameEn: 'Two of Pentacles', emoji: '⭐', symbols: ['🌿', '💰', '🌍'], image: require('../../assets/tarot/Pentacles02.jpg') },
  { name: 'Trójka Pentakli', nameEn: 'Three of Pentacles', emoji: '⭐', symbols: ['🌿', '💰', '🌍'], image: require('../../assets/tarot/Pentacles03.jpg') },
  { name: 'Czwórka Pentakli', nameEn: 'Four of Pentacles', emoji: '⭐', symbols: ['🌿', '💰', '🌍'], image: require('../../assets/tarot/Pentacles04.jpg') },
  { name: 'Piątka Pentakli', nameEn: 'Five of Pentacles', emoji: '⭐', symbols: ['🌿', '💰', '🌍'], image: require('../../assets/tarot/Pentacles05.jpg') },
  { name: 'Szóstka Pentakli', nameEn: 'Six of Pentacles', emoji: '⭐', symbols: ['🌿', '💰', '🌍'], image: require('../../assets/tarot/Pentacles06.jpg') },
  { name: 'Siódemka Pentakli', nameEn: 'Seven of Pentacles', emoji: '⭐', symbols: ['🌿', '💰', '🌍'], image: require('../../assets/tarot/Pentacles07.jpg') },
  { name: 'Ósemka Pentakli', nameEn: 'Eight of Pentacles', emoji: '⭐', symbols: ['🌿', '💰', '🌍'], image: require('../../assets/tarot/Pentacles08.jpg') },
  { name: 'Dziewiątka Pentakli', nameEn: 'Nine of Pentacles', emoji: '⭐', symbols: ['🌿', '💰', '🌍'], image: require('../../assets/tarot/Pentacles09.jpg') },
  { name: 'Dziesiątka Pentakli', nameEn: 'Ten of Pentacles', emoji: '⭐', symbols: ['🌿', '💰', '🌍'], image: require('../../assets/tarot/Pentacles10.jpg') },
  { name: 'Paź Pentakli', nameEn: 'Page of Pentacles', emoji: '⭐', symbols: ['🌿', '💰', '🌍'], image: require('../../assets/tarot/Pentacles11.jpg') },
  { name: 'Rycerz Pentakli', nameEn: 'Knight of Pentacles', emoji: '⭐', symbols: ['🌿', '💰', '🌍'], image: require('../../assets/tarot/Pentacles12.jpg') },
  { name: 'Królowa Pentakli', nameEn: 'Queen of Pentacles', emoji: '⭐', symbols: ['🌿', '💰', '🌍'], image: require('../../assets/tarot/Pentacles13.jpg') },
  { name: 'Król Pentakli', nameEn: 'King of Pentacles', emoji: '⭐', symbols: ['🌿', '💰', '🌍'], image: require('../../assets/tarot/Pentacles14.jpg') },
  { name: 'As Mieczy', nameEn: 'Ace of Swords', emoji: '⚔️', symbols: ['💨', '☁️', '🗡️'], image: require('../../assets/tarot/Swords01.jpg') },
  { name: 'Dwójka Mieczy', nameEn: 'Two of Swords', emoji: '⚔️', symbols: ['💨', '☁️', '🗡️'], image: require('../../assets/tarot/Swords02.jpg') },
  { name: 'Trójka Mieczy', nameEn: 'Three of Swords', emoji: '⚔️', symbols: ['💨', '☁️', '🗡️'], image: require('../../assets/tarot/Swords03.jpg') },
  { name: 'Czwórka Mieczy', nameEn: 'Four of Swords', emoji: '⚔️', symbols: ['💨', '☁️', '🗡️'], image: require('../../assets/tarot/Swords04.jpg') },
  { name: 'Piątka Mieczy', nameEn: 'Five of Swords', emoji: '⚔️', symbols: ['💨', '☁️', '🗡️'], image: require('../../assets/tarot/Swords05.jpg') },
  { name: 'Szóstka Mieczy', nameEn: 'Six of Swords', emoji: '⚔️', symbols: ['💨', '☁️', '🗡️'], image: require('../../assets/tarot/Swords06.jpg') },
  { name: 'Siódemka Mieczy', nameEn: 'Seven of Swords', emoji: '⚔️', symbols: ['💨', '☁️', '🗡️'], image: require('../../assets/tarot/Swords07.jpg') },
  { name: 'Ósemka Mieczy', nameEn: 'Eight of Swords', emoji: '⚔️', symbols: ['💨', '☁️', '🗡️'], image: require('../../assets/tarot/Swords08.jpg') },
  { name: 'Dziewiątka Mieczy', nameEn: 'Nine of Swords', emoji: '⚔️', symbols: ['💨', '☁️', '🗡️'], image: require('../../assets/tarot/Swords09.jpg') },
  { name: 'Dziesiątka Mieczy', nameEn: 'Ten of Swords', emoji: '⚔️', symbols: ['💨', '☁️', '🗡️'], image: require('../../assets/tarot/Swords10.jpg') },
  { name: 'Paź Mieczy', nameEn: 'Page of Swords', emoji: '⚔️', symbols: ['💨', '☁️', '🗡️'], image: require('../../assets/tarot/Swords11.jpg') },
  { name: 'Rycerz Mieczy', nameEn: 'Knight of Swords', emoji: '⚔️', symbols: ['💨', '☁️', '🗡️'], image: require('../../assets/tarot/Swords12.jpg') },
  { name: 'Królowa Mieczy', nameEn: 'Queen of Swords', emoji: '⚔️', symbols: ['💨', '☁️', '🗡️'], image: require('../../assets/tarot/Swords13.jpg') },
  { name: 'Król Mieczy', nameEn: 'King of Swords', emoji: '⚔️', symbols: ['💨', '☁️', '🗡️'], image: require('../../assets/tarot/Swords14.jpg') },
  { name: 'As Różdżek', nameEn: 'Ace of Wands', emoji: '🔥', symbols: ['🌿', '🔥', '✨'], image: require('../../assets/tarot/Wands01.jpg') },
  { name: 'Dwójka Różdżek', nameEn: 'Two of Wands', emoji: '🔥', symbols: ['🌿', '🔥', '✨'], image: require('../../assets/tarot/Wands02.jpg') },
  { name: 'Trójka Różdżek', nameEn: 'Three of Wands', emoji: '🔥', symbols: ['🌿', '🔥', '✨'], image: require('../../assets/tarot/Wands03.jpg') },
  { name: 'Czwórka Różdżek', nameEn: 'Four of Wands', emoji: '🔥', symbols: ['🌿', '🔥', '✨'], image: require('../../assets/tarot/Wands04.jpg') },
  { name: 'Piątka Różdżek', nameEn: 'Five of Wands', emoji: '🔥', symbols: ['🌿', '🔥', '✨'], image: require('../../assets/tarot/Wands05.jpg') },
  { name: 'Szóstka Różdżek', nameEn: 'Six of Wands', emoji: '🔥', symbols: ['🌿', '🔥', '✨'], image: require('../../assets/tarot/Wands06.jpg') },
  { name: 'Siódemka Różdżek', nameEn: 'Seven of Wands', emoji: '🔥', symbols: ['🌿', '🔥', '✨'], image: require('../../assets/tarot/Wands07.jpg') },
  { name: 'Ósemka Różdżek', nameEn: 'Eight of Wands', emoji: '🔥', symbols: ['🌿', '🔥', '✨'], image: require('../../assets/tarot/Wands08.jpg') },
  { name: 'Dziewiątka Różdżek', nameEn: 'Nine of Wands', emoji: '🔥', symbols: ['🌿', '🔥', '✨'], image: require('../../assets/tarot/Wands09.jpg') },
  { name: 'Dziesiątka Różdżek', nameEn: 'Ten of Wands', emoji: '🔥', symbols: ['🌿', '🔥', '✨'], image: require('../../assets/tarot/Wands10.jpg') },
  { name: 'Paź Różdżek', nameEn: 'Page of Wands', emoji: '🔥', symbols: ['🌿', '🔥', '✨'], image: require('../../assets/tarot/Wands11.jpg') },
  { name: 'Rycerz Różdżek', nameEn: 'Knight of Wands', emoji: '🔥', symbols: ['🌿', '🔥', '✨'], image: require('../../assets/tarot/Wands12.jpg') },
  { name: 'Królowa Różdżek', nameEn: 'Queen of Wands', emoji: '🔥', symbols: ['🌿', '🔥', '✨'], image: require('../../assets/tarot/Wands13.jpg') },
  { name: 'Król Różdżek', nameEn: 'King of Wands', emoji: '🔥', symbols: ['🌿', '🔥', '✨'], image: require('../../assets/tarot/Wands14.jpg') },
];

function drawMysticalCards(count = 1) {
  const indices = [...Array(TAROT_CARDS.length).keys()];
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, count).map(i => TAROT_CARDS[i]);
}

export default function MoonTarotScreen({ mode: forcedTab, userSign = null, userBirth = null, lang: langProp = null } = {}) {
  const [internalTab, setInternalTab] = useState('moon');
  const tab = forcedTab || internalTab;
  const setTab = setInternalTab;
  const showSwitcher = !forcedTab;
  const [mode, setMode] = useState('three');
  const [drawn, setDrawn] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [reading, setReading] = useState('');
  const [loadingCard, setLoadingCard] = useState(false);
  const [drawTrigger, setDrawTrigger] = useState(0);
  const [birthDate, setBirthDate] = useState('');
  const [birthMoon, setBirthMoon] = useState(null);
  const [birthError, setBirthError] = useState('');

  const scrollRef = useRef(null);

  const t = (key) => i18n.t(key);
  const lang = langProp || i18n.locale;
  const moon = getMoonPhase();
  const moonName = lang === 'en' ? moon.nameEn : moon.name;
  const info = lang === 'en' ? (MOON_INFO_EN[moon.nameEn] || {}) : (MOON_INFO[moon.name] || {});

  const initDraw = () => {
    const cardsNeeded = mode === 'three' ? 3 : 1;
    setDrawn(drawMysticalCards(cardsNeeded));
    setRevealed(Array(cardsNeeded).fill(false));
    setReading('');
  };

  useEffect(() => {
    initDraw();
  }, [mode, drawTrigger]);

  useEffect(() => {
    if (tab === 'tarot') {
      // nic — każde losowanie unikalne
    }
  }, [tab, mode, drawTrigger]);

  const revealSingleCard = (index) => {
    const updated = [...revealed];
    updated[index] = true;
    setRevealed(updated);
  };

  const triggerReadingFetch = async () => {
    if (revealed.includes(false)) return;

    setLoadingCard(true);

    let prompt = '';
    if (mode === 'three') {
      prompt = lang === 'en'
        ? `You are an expert tarot master. Respond in English only. Interpret this 3-card spread. Return ONLY raw JSON (no markdown): {"past": "2-3 mystical sentences about the Past card: ${drawn[0].nameEn}", "present": "2-3 mystical sentences about the Present card: ${drawn[1].nameEn}", "future": "2-3 mystical sentences about the Future card: ${drawn[2].nameEn}"}`
        : `Jesteś mistrzem tarota. Zinterpretuj rozkład 3-kartowy. Zwróć TYLKO surowy JSON (bez markdown): {"past": "2-3 mistyczne zdania o karcie Przeszłości: ${drawn[0].name}", "present": "2-3 mistyczne zdania o karcie Teraźniejszości: ${drawn[1].name}", "future": "2-3 mistyczne zdania o karcie Przyszłości: ${drawn[2].name}"}`;
    } else {
      prompt = lang === 'en'
        ? `You are an expert tarot master. Respond in English only. Interpret this daily tarot card: ${drawn[0].nameEn}. Write a beautiful, mystical daily cosmic advice in 2-3 paragraphs.`
        : `Zinterpretuj tę kartę dnia w tarocie: ${drawn[0].name}. Napisz piękną, mistyczną i inspirującą poradę na dzisiaj.`;
    }

    // Parsuje odpowiedź JSON rozkładu 3-kartowego; zwraca null, gdy się nie
    // uda (ucięty/niepełny JSON) albo gdy któreś pole wyszło puste.
    const parseThreeCard = (raw) => {
      if (!raw) return null;
      try {
        const clean = raw.replace(/```json|```/g, '').trim();
        const match = clean.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(match ? match[0] : clean);
        if (!parsed.past || !parsed.present || !parsed.future) return null;
        return parsed;
      } catch {
        return null;
      }
    };

    if (mode === 'three') {
      let text = await fetchTarotReading(prompt, 900);
      let parsed = parseThreeCard(text);
      // ZGŁOSZONY PROBLEM (2026-08-29): odczyt tarota bywał poprawny dopiero
      // za 2.-3. razem — model reasoningowy potrafi sporadycznie zwrócić
      // ucięty/niepełny JSON. Jedna cicha, automatyczna ponowna próba (bez
      // pokazywania użytkownikowi błędu) zamiast zmuszania go do ręcznego
      // odświeżania po kilka razy.
      if (!parsed) {
        text = await fetchTarotReading(prompt, 900);
        parsed = parseThreeCard(text);
      }
      if (parsed) {
        setReading({ past: parsed.past, present: parsed.present, future: parsed.future, isStructured: true });
      } else {
        setReading({ past: '', present: '', future: text, isStructured: false });
      }
    } else {
      const text = await fetchTarotReading(prompt, 900);
      setReading(text);
    }
    setLoadingCard(false);

    // Opóźniony interstitial — daje czas na załadowanie reklamy;
    // throttled = nie częściej niż raz na kilka minut (patrz utils/ads.js)
    setTimeout(() => showInterstitialThrottled(), 1500);
  };

  // Ponowne losowanie kart — nowość: pierwsze losowanie zawsze darmowe,
  // ale "tasuj ponownie" po odczytanej wróżbie odblokowuje reklama
  // nagradzana (dotychczas był to nieograniczony, darmowy reset).
  const handleRetry = () => {
    showRewardedAd(
      () => setDrawTrigger(prev => prev + 1),
      () => Alert.alert(
        lang === 'en' ? 'Ad loading' : 'Reklama się ładuje',
        lang === 'en'
          ? 'The ad isn\'t ready yet — try again in a moment.'
          : 'Reklama nie jest jeszcze gotowa — spróbuj za chwilę.'
      )
    );
  };

  const handleDateChange = (text) => {
    const clean = text.replace(/\D/g, '');
    let formatted = clean;
    if (clean.length > 2) formatted = clean.slice(0, 2) + '.' + clean.slice(2);
    if (clean.length > 4) formatted = clean.slice(0, 2) + '.' + clean.slice(2, 4) + '.' + clean.slice(4, 8);
    setBirthDate(formatted);
    setBirthMoon(null);
    setBirthError('');
  };

  const calculateBirthMoon = () => {
    setBirthError(''); setBirthMoon(null); Keyboard.dismiss();
    const clean = birthDate.replace(/\D/g, '');
    if (clean.length !== 8) { setBirthError(t('moon.calcErrorFormat')); return; }
    const d = parseInt(clean.slice(0, 2));
    const m = parseInt(clean.slice(2, 4));
    const y = parseInt(clean.slice(4, 8));
    if (!d || !m || !y || d > 31 || m > 12 || y < 1900 || y > new Date().getFullYear()) { setBirthError(t('moon.calcError')); return; }
    const date = new Date(y, m - 1, d);
    if (isNaN(date.getTime())) { setBirthError(t('moon.calcError')); return; }
    setBirthMoon(getMoonPhase(date));
  };

  const getBirthMoonInfo = (bm) => {
    if (!bm) return {};
    return lang === 'en' ? (MOON_INFO_EN[bm.nameEn] || {}) : (MOON_INFO[bm.name] || {});
  };

  const shareReading = async () => {
    try {
      let text;
      if (reading && reading.isStructured) {
        text = lang === 'en'
          ? `🃏 Tarot reading\n\nPast (${drawn[0]?.nameEn}): ${reading.past}\n\nPresent (${drawn[1]?.nameEn}): ${reading.present}\n\nFuture (${drawn[2]?.nameEn}): ${reading.future}`
          : `🃏 Odczyt tarota\n\nPrzeszłość (${drawn[0]?.name}): ${reading.past}\n\nTeraźniejszość (${drawn[1]?.name}): ${reading.present}\n\nPrzyszłość (${drawn[2]?.name}): ${reading.future}`;
      } else {
        const cardName = lang === 'en' ? drawn[0]?.nameEn : drawn[0]?.name;
        text = `🃏 ${cardName}\n\n${typeof reading === 'string' ? reading : reading?.future || ''}`;
      }
      const signature = lang === 'en' ? '\n\n— Stellar Guide' : '\n\n— Gwiezdny Przewodnik';
      await Share.share({ message: text + signature });
    } catch {}
  };

  const getRoleLabel = (index) => {
    if (mode === 'single') return lang === 'en' ? 'Daily Card' : 'Karta Dnia';
    const roles = lang === 'en'
      ? ['Past', 'Present', 'Future']
      : ['Przeszłość', 'Teraźniejszość', 'Przyszłość'];
    return roles[index];
  };

  const allRevealed = revealed.length > 0 && !revealed.includes(false);

  return (
    <ImageBackground source={require('../../assets/bg.png')} style={styles.bgContainer} resizeMode="cover">
      <SafeAreaView style={styles.flexOne} edges={['top']}>
        {showSwitcher && (
          <View style={styles.tabSwitch}>
            <TouchableOpacity style={[styles.switchBtn, tab === 'moon' && styles.switchBtnActive]} onPress={() => setTab('moon')}>
              <Text style={[styles.switchText, tab === 'moon' && styles.switchTextActive]}>🌙  {lang === 'en' ? 'Moon' : 'Księżyc'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.switchBtn, tab === 'tarot' && styles.switchBtnActive]} onPress={() => setTab('tarot')}>
              <Text style={[styles.switchText, tab === 'tarot' && styles.switchTextActive]}>🃏  Tarot</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView ref={scrollRef} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {tab === 'moon' && (
            <>
              <Text style={styles.sectionTitle}>🔭 {t('moon.calcTitle')}</Text>
              <View style={styles.card}>
                <Text style={styles.calcLabel}>{t('moon.calcLabel')}</Text>
                <TextInput style={styles.dateInput} placeholder={t('moon.calcPlaceholder')} placeholderTextColor="rgba(255,255,255,0.25)" value={birthDate} onChangeText={handleDateChange} keyboardType="numeric" maxLength={10} returnKeyType="done" onSubmitEditing={calculateBirthMoon} />
                {birthError ? <Text style={styles.errorText}>{birthError}</Text> : null}
                <TouchableOpacity style={styles.calcBtn} onPress={calculateBirthMoon}>
                  <Text style={styles.calcBtnText}>{t('moon.calcBtn')}  ✦</Text>
                </TouchableOpacity>
                {birthMoon && (
                  <View style={styles.birthResult}>
                    <View style={styles.cardDivider} />
                    <Text style={styles.moonBigEmoji}>{birthMoon.emoji}</Text>
                    <Text style={styles.moonName}>{lang === 'en' ? birthMoon.nameEn : birthMoon.name}</Text>
                    <Text style={styles.moonDay}>{t('moon.cycleDay').replace('Dzień', `${birthMoon.day}`).replace('Day', `${birthMoon.day}`)}</Text>
                    <Text style={styles.moonDesc}>{getBirthMoonInfo(birthMoon).desc || ''}</Text>
                    <View style={styles.listsRow}>
                      <View style={styles.listCol}>
                        <Text style={styles.listHeader}>{t('moon.yourTraits')}</Text>
                        {(getBirthMoonInfo(birthMoon).do || []).map((item, i) => <Text key={i} style={styles.listItem}>· {item}</Text>)}
                      </View>
                      <View style={styles.listDivider} />
                      <View style={styles.listCol}>
                        <Text style={styles.listHeader}>{t('moon.beware')}</Text>
                        {(getBirthMoonInfo(birthMoon).avoid || []).map((item, i) => <Text key={i} style={styles.listItem}>· {item}</Text>)}
                      </View>
                    </View>
                  </View>
                )}
              </View>

              <Text style={styles.sectionTitle}>✦ {t('moon.currentPhase')}</Text>
              <View style={styles.card}>
                <Text style={styles.moonBigEmoji}>{moon.emoji}</Text>
                <Text style={styles.moonName}>{moonName}</Text>
                <Text style={styles.moonDay}>{moon.day} · {t('moon.cycleDay')}</Text>
                <View style={styles.cardDivider} />
                <Text style={styles.moonDesc}>{info.desc}</Text>
                <View style={styles.listsRow}>
                  <View style={styles.listCol}>
                    <Text style={styles.listHeader}>{t('moon.doTitle')}</Text>
                    {(info.do || []).map((item, i) => <Text key={i} style={styles.listItem}>· {item}</Text>)}
                  </View>
                  <View style={styles.listDivider} />
                  <View style={styles.listCol}>
                    <Text style={styles.listHeader}>{t('moon.avoidTitle')}</Text>
                    {(info.avoid || []).map((item, i) => <Text key={i} style={styles.listItem}>· {item}</Text>)}
                  </View>
                </View>
              </View>

              <LunarCalendar lang={lang} getMoonPhase={getMoonPhase} t={t} />
            </>
          )}

          {tab === 'tarot' && (
            <>
              <Text style={styles.sectionTitle}>🃏 {t('moon.tarotTitle')}</Text>
              <Text style={styles.sectionSub}>{new Date().toLocaleDateString(lang === 'en' ? 'en-GB' : 'pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>

              <View style={styles.modeSelector}>
                <TouchableOpacity style={[styles.modeBtn, mode === 'single' && styles.modeBtnActive]} onPress={() => { setDrawTrigger(0); setMode('single'); }}>
                  <Text style={[styles.modeBtnText, mode === 'single' && styles.modeBtnTextActive]}>{t('moon.mode1Card')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modeBtn, mode === 'three' && styles.modeBtnActive]} onPress={() => { setDrawTrigger(0); setMode('three'); }}>
                  <Text style={[styles.modeBtnText, mode === 'three' && styles.modeBtnTextActive]}>{t('moon.mode3Cards')}</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.tarotTable, mode === 'three' ? styles.rowWrap : styles.centerAlign]}>
                {drawn.map((item, index) => (
                  <FlipCard
                    key={index}
                    card={item}
                    index={index}
                    revealed={revealed}
                    onReveal={revealSingleCard}
                    getRoleLabel={getRoleLabel}
                    lang={lang}
                  />
                ))}
              </View>

              {!allRevealed && (
                <View style={styles.hintBox}>
                  <Text style={styles.hintBoxText}>{t('moon.tarotHint')}</Text>
                </View>
              )}

              {allRevealed && !reading && !loadingCard && (
                <TouchableOpacity style={styles.checkBtn} onPress={triggerReadingFetch} activeOpacity={0.85}>
                  <Text style={styles.checkBtnText}>{t('moon.tarotInterpretBtn')}</Text>
                </TouchableOpacity>
              )}

              {loadingCard && (
                <View style={styles.loadingBox}>
                  <ActivityIndicator color="#d4af37" size="large" />
                  <Text style={styles.loadingLabel}>{t('moon.tarotLoading')}</Text>
                </View>
              )}

              {reading ? (
                <View style={styles.readingCard}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardIcon}>✨</Text>
                    <Text style={styles.cardTitle}>{t('moon.tarotReadingTitle')}</Text>
                  </View>
                  <View style={styles.cardDivider} />

                  {reading.isStructured ? (
                    <>
                      {/* PRZESZŁOŚĆ */}
                      <View style={styles.tarotSection}>
                        <View style={styles.tarotSectionHeader}>
                          <Text style={styles.tarotSectionEmoji}>🌑</Text>
                          <Text style={styles.tarotSectionTitle}>
                            {lang === 'en' ? 'PAST' : 'PRZESZŁOŚĆ'}
                          </Text>
                          <Text style={styles.tarotSectionCard}>
                            {lang === 'en' ? drawn[0]?.nameEn : drawn[0]?.name}
                          </Text>
                        </View>
                        <Text style={styles.tarotSectionBody}>{reading.past}</Text>
                      </View>

                      <View style={styles.tarotSectionDivider} />

                      {/* TERAŹNIEJSZOŚĆ */}
                      <View style={styles.tarotSection}>
                        <View style={styles.tarotSectionHeader}>
                          <Text style={styles.tarotSectionEmoji}>🌕</Text>
                          <Text style={[styles.tarotSectionTitle, { color: '#d4af37' }]}>
                            {lang === 'en' ? 'PRESENT' : 'TERAŹNIEJSZOŚĆ'}
                          </Text>
                          <Text style={styles.tarotSectionCard}>
                            {lang === 'en' ? drawn[1]?.nameEn : drawn[1]?.name}
                          </Text>
                        </View>
                        <Text style={styles.tarotSectionBody}>{reading.present}</Text>
                      </View>

                      <View style={styles.tarotSectionDivider} />

                      {/* PRZYSZŁOŚĆ */}
                      <View style={styles.tarotSection}>
                        <View style={styles.tarotSectionHeader}>
                          <Text style={styles.tarotSectionEmoji}>⭐</Text>
                          <Text style={[styles.tarotSectionTitle, { color: '#9b59b6' }]}>
                            {lang === 'en' ? 'FUTURE' : 'PRZYSZŁOŚĆ'}
                          </Text>
                          <Text style={styles.tarotSectionCard}>
                            {lang === 'en' ? drawn[2]?.nameEn : drawn[2]?.name}
                          </Text>
                        </View>
                        <Text style={styles.tarotSectionBody}>{reading.future}</Text>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.cardBody}>
                      {typeof reading === 'string' ? reading : reading.future}
                    </Text>
                  )}

                  <View style={styles.readingActionsRow}>
                    <TouchableOpacity style={styles.shareBtn} onPress={shareReading}>
                      <Text style={styles.shareBtnText}>↗  {lang === 'en' ? 'Share' : 'Udostępnij'}</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
                    <Text style={styles.retryBtnText}>📺  {t('moon.tarotRetryBtn')}</Text>
                    <Text style={styles.retryBtnHint}>{lang === 'en' ? 'Watch a short ad to draw again' : 'Obejrzyj krótką reklamę, by losować ponownie'}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* AdBanner zawsze widoczny w trybie tarot */}
              <AdBanner />
            </>
          )}

          <View style={styles.bottomGap} />
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgContainer: { flex: 1 },
  flexOne: { flex: 1 },
  tabSwitch: { flexDirection: 'row', margin: 16, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 4, borderWidth: 1, borderColor: 'rgba(212,175,55,0.12)' },
  switchBtn: { flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
  switchBtnActive: { backgroundColor: 'rgba(212,175,55,0.15)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.35)' },
  switchText: { fontFamily: 'Raleway_600SemiBold', color: '#ffffff', fontSize: 13, letterSpacing: 0.5 },
  switchTextActive: { color: '#d4af37' },
  container: { padding: 16, alignItems: 'center' },
  sectionTitle: { fontFamily: 'Cinzel_700Bold', fontSize: 14, color: '#d4af37', letterSpacing: 2, marginBottom: 10, marginTop: 10, alignSelf: 'flex-start' },
  sectionSub: { fontFamily: 'Raleway_300Light', color: '#ffffff', fontSize: 12, fontStyle: 'italic', letterSpacing: 0.5, marginBottom: 20, alignSelf: 'flex-start', textTransform: 'capitalize' },
  modeSelector: { flexDirection: 'row', width: '100%', gap: 8, marginBottom: 18, backgroundColor: 'rgba(255,255,255,0.02)', padding: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.1)' },
  modeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  modeBtnActive: { backgroundColor: 'rgba(212,175,55,0.18)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)' },
  modeBtnText: { fontFamily: 'Raleway_500Medium', color: '#ffffff', fontSize: 11, letterSpacing: 0.5 },
  modeBtnTextActive: { color: '#d4af37', fontFamily: 'Raleway_700Bold' },
  tarotTable: { width: '100%', marginVertical: 16 },
  rowWrap: { flexDirection: 'row', justifyContent: 'space-between' },
  centerAlign: { alignItems: 'center' },
  card: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 20, width: '100%', borderWidth: 1, borderColor: 'rgba(212,175,55,0.18)', alignItems: 'center', marginBottom: 20 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginBottom: 10 },
  cardIcon: { fontSize: 14 },
  cardTitle: { fontFamily: 'Cinzel_700Bold', color: '#d4af37', fontSize: 11, letterSpacing: 2 },
  cardDivider: { height: 1, backgroundColor: 'rgba(212,175,55,0.15)', width: '100%', marginBottom: 16, marginTop: 4 },
  cardBody: { fontFamily: 'Raleway_400Regular', color: '#ffffff', lineHeight: 26, fontSize: 15, letterSpacing: 0.3, alignSelf: 'flex-start' },
  moonBigEmoji: { fontSize: 60, marginBottom: 10 },
  moonName: { fontFamily: 'Cinzel_700Bold', color: '#fff', fontSize: 18, letterSpacing: 2, marginBottom: 4 },
  moonDay: { fontFamily: 'Raleway_300Light', color: '#ffffff', fontSize: 11, letterSpacing: 1, marginBottom: 14 },
  moonDesc: { fontFamily: 'Raleway_400Regular', color: '#ffffff', lineHeight: 24, textAlign: 'center', marginBottom: 18, fontSize: 14, letterSpacing: 0.3, paddingHorizontal: 4 },
  listsRow: { flexDirection: 'row', width: '100%', gap: 8 },
  listDivider: { width: 1, backgroundColor: 'rgba(212,175,55,0.15)' },
  listCol: { flex: 1, paddingHorizontal: 4 },
  listHeader: { fontFamily: 'Cinzel_600SemiBold', color: '#d4af37', fontSize: 9, letterSpacing: 1.5, marginBottom: 10 },
  listItem: { fontFamily: 'Raleway_400Regular', color: '#ffffff', fontSize: 12, marginBottom: 7, lineHeight: 18 },
  calcLabel: { fontFamily: 'Cinzel_600SemiBold', color: '#d4af37', fontSize: 10, letterSpacing: 2, marginBottom: 14, alignSelf: 'flex-start' },
  dateInput: { width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, color: '#fff', fontSize: 24, borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)', marginBottom: 8, textAlign: 'center', fontFamily: 'Cinzel_700Bold', letterSpacing: 4 },
  errorText: { fontFamily: 'Raleway_400Regular', color: '#ff6b6b', fontSize: 12, marginBottom: 8 },
  calcBtn: { backgroundColor: '#d4af37', paddingVertical: 13, paddingHorizontal: 32, borderRadius: 28, marginTop: 4 },
  calcBtnText: { fontFamily: 'Cinzel_700Bold', color: '#0a0015', fontSize: 13, letterSpacing: 2 },
  birthResult: { width: '100%', alignItems: 'center', marginTop: 8 },
  hintBox: { marginVertical: 10, paddingHorizontal: 12 },
  hintBoxText: { fontFamily: 'Raleway_300Light', color: '#ffffff', fontSize: 11, fontStyle: 'italic', textAlign: 'center', letterSpacing: 0.5 },
  checkBtn: { backgroundColor: '#d4af37', paddingVertical: 15, paddingHorizontal: 36, borderRadius: 32, marginVertical: 20, alignSelf: 'center' },
  checkBtnText: { fontFamily: 'Cinzel_700Bold', color: '#0a0015', fontSize: 13, letterSpacing: 2 },
  loadingBox: { alignItems: 'center', paddingVertical: 24, gap: 10, alignSelf: 'center' },
  loadingLabel: { fontFamily: 'Raleway_300Light', color: '#d4af37', fontSize: 12, fontStyle: 'italic', letterSpacing: 1 },
  readingCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 20, width: '100%', borderWidth: 1, borderColor: 'rgba(212,175,55,0.18)', marginBottom: 16 },
  retryBtn: { marginTop: 24, alignSelf: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.4)', borderRadius: 24, paddingVertical: 10, paddingHorizontal: 24, gap: 4 },
  retryBtnText: { fontFamily: 'Raleway_600SemiBold', color: '#d4af37', fontSize: 11, letterSpacing: 1 },
  retryBtnHint: { fontFamily: 'Raleway_300Light', color: '#ffffff', fontSize: 9, fontStyle: 'italic' },
  readingActionsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  shareBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  shareBtnText: { fontFamily: 'Raleway_600SemiBold', color: '#ffffff', fontSize: 12, letterSpacing: 1 },
  bottomGap: { height: 40 },
  tarotSection: { marginBottom: 4 },
  tarotSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  tarotSectionEmoji: { fontSize: 18 },
  tarotSectionTitle: { fontFamily: 'Cinzel_700Bold', fontSize: 13, color: '#ffffff', letterSpacing: 2 },
  tarotSectionCard: { fontFamily: 'Raleway_300Light', color: '#d4af37', fontSize: 11, fontStyle: 'italic', letterSpacing: 0.5, flex: 1, textAlign: 'right' },
  tarotSectionBody: { fontFamily: 'Raleway_400Regular', color: '#ffffff', fontSize: 15, lineHeight: 26, letterSpacing: 0.3 },
  tarotSectionDivider: { height: 1, backgroundColor: 'rgba(212,175,55,0.12)', marginVertical: 16 },
});

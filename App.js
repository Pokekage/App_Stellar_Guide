import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts, Cinzel_400Regular, Cinzel_600SemiBold, Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { Raleway_300Light, Raleway_400Regular, Raleway_500Medium, Raleway_600SemiBold, Raleway_700Bold } from '@expo-google-fonts/raleway';
import * as StoreReview from 'expo-store-review';

import HomeScreen from './src/screens/HomeScreen';
import MoonTarotScreen from './src/screens/MoonTarotScreen';
import CompatScreen from './src/screens/CompatScreen';
import DreamJournalScreen from './src/screens/DreamJournalScreen';
import CosmosScreen from './src/screens/CosmosScreen';
import EbookScreen from './src/screens/EbookScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

import { load, save, KEYS, cleanupOldAiCache } from './src/utils/storage';
import { calcAscendant } from './src/utils/astro';
import { loadInterstitial, loadRewardedAd } from './src/utils/ads';
import i18n, { loadLanguage } from './src/utils/i18n';
import { setupAndroidChannel, scheduleMoonPhaseNotification } from './src/utils/notifications';
import { initConsent } from './src/utils/consent';

const Tab = createBottomTabNavigator();

const ICONS = {
  horoscope: 'star',
  moon: 'moon',
  tarot: 'sparkles',
  compat: 'heart',
  dreams: 'book',
  cosmos: 'telescope',
  ebook: 'library',
  profile: 'person',
};

async function checkAndRequestReview() {
  try {
    const data = await load('review_data') || { sessions: 0, asked: false };
    if (data.asked) return;

    const newSessions = (data.sessions || 0) + 1;
    await save('review_data', { sessions: newSessions, asked: false });

    // Poproś o ocenę po 3 sesjach z 4-sekundowym opóźnieniem
    if (newSessions >= 3) {
      const isAvailable = await StoreReview.isAvailableAsync();
      if (isAvailable) {
        setTimeout(async () => {
          try {
            await StoreReview.requestReview();
            await save('review_data', { sessions: newSessions, asked: true });
          } catch {}
        }, 4000);
      }
    }
  } catch {}
}

function TabNavigator({ userSign, setUserSign, userBirth, setUserBirth, ascendant, setAscendant, lang }) {
  const insets = useSafeAreaInsets();
  const t = i18n.t.bind(i18n);

  const handleAscendantChange = (newAsc, newBirth) => {
    setAscendant(newAsc);
    if (newBirth) setUserBirth(newBirth);
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 56 + insets.bottom,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 6,
          },
        ],
        tabBarActiveTintColor: '#d4af37',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.22)',
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name]} size={size - 3} color={color} />
        ),
      })}
    >
      <Tab.Screen name="horoscope" options={{ tabBarLabel: t('nav.horoscope') }} children={() => <HomeScreen userSign={userSign} lang={lang} ascendant={ascendant} userBirth={userBirth} />} />
      <Tab.Screen name="moon" options={{ tabBarLabel: t('nav.moon') }} children={() => <MoonTarotScreen mode="moon" userSign={userSign} userBirth={userBirth} lang={lang} />} />
      <Tab.Screen name="tarot" options={{ tabBarLabel: t('nav.tarot') }} children={() => <MoonTarotScreen mode="tarot" userSign={userSign} userBirth={userBirth} lang={lang} />} />
      <Tab.Screen name="compat" options={{ tabBarLabel: t('nav.compat') }} component={CompatScreen} />
      <Tab.Screen name="dreams" options={{ tabBarLabel: t('nav.dreams') }} component={DreamJournalScreen} />
      <Tab.Screen name="cosmos" options={{ tabBarLabel: t('nav.cosmos') }} component={CosmosScreen} />
      <Tab.Screen name="ebook" options={{ tabBarLabel: t('nav.ebook') }} children={() => <EbookScreen lang={lang} />} />
      <Tab.Screen name="profile" options={{ tabBarLabel: t('nav.profile') }} children={() => (
        <ProfileScreen
          userSign={userSign}
          onSignChange={setUserSign}
          lang={lang}
          onAscendantChange={handleAscendantChange}
        />
      )} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [userSign, setUserSign] = useState(null);
  const [userBirth, setUserBirth] = useState(null);
  const [ascendant, setAscendant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('pl');

  const [fontsLoaded] = useFonts({
    Cinzel_400Regular, Cinzel_600SemiBold, Cinzel_700Bold,
    Raleway_300Light, Raleway_400Regular, Raleway_500Medium, Raleway_600SemiBold, Raleway_700Bold,
  });

  useEffect(() => {
    setupAndroidChannel();
    initConsent().then(() => { loadInterstitial(); loadRewardedAd(); });
    cleanupOldAiCache(); // porządki w tle, nie blokuje startu apki
    (async () => {
      await loadLanguage();
      setLang(i18n.locale || 'pl');
      try {
        const sign = await load(KEYS.USER_SIGN);
        setUserSign(sign && typeof sign === 'object' && sign.key ? sign : null);
        const birth = await load(KEYS.USER_BIRTH);
        if (birth) setUserBirth(birth);
        const birthTime = await load(KEYS.USER_BIRTH_TIME);
        const asc = birthTime ? calcAscendant(birth, birthTime) : null;
        if (asc) setAscendant(asc);

        // Powiadomienie o pełni/nowiu jest wyzwalaczem jednorazowym (fire-once),
        // więc trzeba je zaplanować na nowo przy każdym starcie aplikacji —
        // w przeciwieństwie do codziennego horoskopu, który jest wyzwalaczem
        // cyklicznym i nie wymaga tego zabiegu.
        const moonNotifOn = await load(KEYS.MOON_NOTIF);
        if (moonNotifOn) {
          const localeForNotif = i18n.locale || 'pl';
          scheduleMoonPhaseNotification(localeForNotif);
        }
      } catch {
        setUserSign(null);
      }
      setLoading(false);
    })();
  }, []);

  // Uruchom sprawdzenie review po załadowaniu (tylko gdy user ma już znak)
  useEffect(() => {
    if (!loading && userSign) {
      checkAndRequestReview();
    }
  }, [loading, userSign]);

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>✨</Text>
      </View>
    );
  }

  if (!userSign) {
    return (
      <SafeAreaProvider>
        <OnboardingScreen
          onDone={(sign) => {
            setLang(i18n.locale || 'pl');
            setUserSign(sign);
          }}
        />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" translucent={true} />
        <TabNavigator
          userSign={userSign}
          setUserSign={setUserSign}
          userBirth={userBirth}
          setUserBirth={setUserBirth}
          ascendant={ascendant}
          setAscendant={setAscendant}
          lang={lang}
        />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#0a0015', justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 48 },
  tabBar: {
    backgroundColor: '#110022',
    borderTopColor: 'rgba(212,175,55,0.2)',
    borderTopWidth: 1,
    paddingTop: 5,
  },
  tabLabel: { fontSize: 8, fontFamily: 'Raleway_600SemiBold', letterSpacing: 0.3 },
});
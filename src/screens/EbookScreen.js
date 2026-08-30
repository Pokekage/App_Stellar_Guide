import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useIAP, ErrorCode } from 'expo-iap';
import { EBOOK_SKU, isEbookOwnedLocally, markEbookOwned, openEbookFile } from '../utils/iap';

// Sprawdza, czy dany zakup (z availablePurchases albo z onPurchaseSuccess)
// dotyczy naszego ebooka i jest realnie sfinalizowany (nie "pending" —
// np. w trakcie płatności BLIK-iem czy przelewem odroczonym).
function purchaseMatchesEbook(purchase) {
  if (!purchase) return false;
  const matchesSku = purchase.productId === EBOOK_SKU || (purchase.ids || []).includes(EBOOK_SKU);
  return matchesSku && purchase.purchaseState === 'purchased';
}

// onClose jest opcjonalny — ekran działa teraz jako pełnoprawna zakładka w
// dolnej nawigacji (App.js), więc domyślnie nie ma przycisku zamknięcia.
// Zostawione dla wstecznej kompatybilności, gdyby kiedyś ktoś chciał go
// znowu otworzyć jako Modal z innego miejsca w apce.
export default function EbookScreen({ onClose, lang = 'pl' }) {
  const [owned, setOwned] = useState(false);
  const [checkingOwnership, setCheckingOwnership] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [opening, setOpening] = useState(false);

  const {
    connected,
    products,
    fetchProducts,
    requestPurchase,
    finishTransaction,
    availablePurchases,
    restorePurchases,
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      try {
        // isConsumable: false — to produkt nie-konsumowalny (jednorazowy zakup
        // na zawsze), więc NIE wolno go "zużywać" (inaczej dałoby się kupić
        // drugi raz). finishTransaction i tak musi być wywołane, żeby
        // Google Play zaakceptował transakcję (inaczej auto-zwrot po 3 dniach).
        await finishTransaction({ purchase, isConsumable: false });
      } catch (e) {
        console.log('finishTransaction error', e);
      }
      if (purchaseMatchesEbook(purchase)) {
        await markEbookOwned();
        setOwned(true);
      }
      setPurchasing(false);
    },
    onPurchaseError: (error) => {
      setPurchasing(false);
      if (error.code !== ErrorCode.UserCancelled) {
        Alert.alert(
          lang === 'en' ? 'Purchase error' : 'Błąd zakupu',
          lang === 'en' ? 'Something went wrong. Please try again later.' : 'Coś poszło nie tak. Spróbuj ponownie później.'
        );
      }
    },
  });

  // Lokalna flaga daje natychmiastowy stan UI, zanim sklep w ogóle się połączy.
  useEffect(() => {
    (async () => {
      const localOwned = await isEbookOwnedLocally();
      if (localOwned) setOwned(true);
      setCheckingOwnership(false);
    })();
  }, []);

  // Gdy połączenie ze sklepem jest gotowe: pobierz cenę produktu i po cichu
  // sprawdź, czy user już kiedyś kupił (np. po reinstalacji apki, kiedy
  // lokalna flaga zniknęła, ale zakup w Google Play nadal jest ważny).
  useEffect(() => {
    if (connected) {
      fetchProducts({ skus: [EBOOK_SKU], type: 'in-app' });
      restorePurchases();
    }
  }, [connected]);

  // Wynik restorePurchases/getAvailablePurchases ląduje w stanie hooka
  // (availablePurchases), a nie w wartości zwracanej z funkcji — trzeba go
  // więc obserwować efektem, zgodnie z dokumentacją expo-iap.
  useEffect(() => {
    const found = (availablePurchases || []).some(purchaseMatchesEbook);
    if (found) {
      markEbookOwned();
      setOwned(true);
    }
  }, [availablePurchases]);

  const product = (products || []).find((p) => p.id === EBOOK_SKU);

  const handleBuy = async () => {
    setPurchasing(true);
    try {
      await requestPurchase({
        request: { google: { skus: [EBOOK_SKU] } },
        type: 'in-app',
      });
    } catch (e) {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    try {
      await restorePurchases();
    } catch (e) {
      console.log('restorePurchases error', e);
    }
    // Wynik przyjdzie do efektu na availablePurchases — dajemy mu chwilę,
    // zanim ewentualnie pokażemy komunikat "nie znaleziono".
    setTimeout(async () => {
      const nowOwned = await isEbookOwnedLocally();
      setPurchasing(false);
      if (!nowOwned) {
        Alert.alert(
          lang === 'en' ? 'No purchase found' : 'Nie znaleziono zakupu',
          lang === 'en' ? 'We could not find a previous purchase on this account.' : 'Nie znaleziono wcześniejszego zakupu na tym koncie Google.'
        );
      }
    }, 600);
  };

  const handleOpen = async () => {
    setOpening(true);
    try {
      await openEbookFile(lang);
    } catch (e) {
      Alert.alert(
        lang === 'en' ? 'Could not open file' : 'Nie udało się otworzyć pliku',
        lang === 'en' ? 'Install a PDF reader app and try again.' : 'Zainstaluj aplikację do czytania PDF i spróbuj ponownie.'
      );
    }
    setOpening(false);
  };

  return (
    <LinearGradient colors={['#1a0033', '#0a0015']} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={onClose ? ['top', 'bottom'] : ['top']}>
        {onClose ? (
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.headerBlock}>
            <Text style={styles.pageTitle}>✦ {lang === 'en' ? 'EBOOK' : 'EBOOK'} ✦</Text>
            <View style={styles.pageDivider} />
          </View>
        )}
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.emoji}>📖</Text>
          <Text style={styles.title}>
            {lang === 'en' ? 'Complete Astrology Guide' : 'Wielki Przewodnik Astrologiczny'}
          </Text>
          <Text style={styles.desc}>
            {lang === 'en'
              ? 'A deep, complete ebook guide to astrology — signs, houses, aspects and how to read your own birth chart. Yours forever after one purchase.'
              : 'Obszerny ebook o astrologii — znaki, domy, aspekty i jak samodzielnie czytać swój horoskop urodzeniowy. Twój na zawsze, po jednym zakupie.'}
          </Text>

          {checkingOwnership ? (
            <ActivityIndicator color="#d4af37" style={{ marginTop: 24 }} />
          ) : owned ? (
            <TouchableOpacity style={styles.buyBtn} onPress={handleOpen} disabled={opening} activeOpacity={0.85}>
              {opening ? (
                <ActivityIndicator color="#0a0015" />
              ) : (
                <Text style={styles.buyBtnText}>{lang === 'en' ? 'Open ebook' : 'Otwórz ebooka'}</Text>
              )}
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.buyBtn} onPress={handleBuy} disabled={purchasing || !product} activeOpacity={0.85}>
                {purchasing ? (
                  <ActivityIndicator color="#0a0015" />
                ) : (
                  <Text style={styles.buyBtnText}>
                    {product
                      ? `${lang === 'en' ? 'Buy' : 'Kup'} — ${product.displayPrice}`
                      : (lang === 'en' ? 'Loading price…' : 'Ładowanie ceny…')}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRestore} disabled={purchasing} style={styles.restoreBtn}>
                <Text style={styles.restoreText}>{lang === 'en' ? 'Restore purchase' : 'Przywróć zakup'}</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 8 },
  closeBtn: { padding: 8 },
  // Nagłówek zakładki (gdy ekran jest samodzielną zakładką, nie Modalem) —
  // ten sam wzorzec co pageTitle/divider na innych ekranach (Kosmos, Profil).
  headerBlock: { alignItems: 'center', marginTop: 16, marginBottom: 4 },
  pageTitle: { fontFamily: 'Cinzel_700Bold', fontSize: 18, color: '#d4af37', letterSpacing: 3 },
  pageDivider: { width: 50, height: 1, backgroundColor: 'rgba(212,175,55,0.4)', marginTop: 10 },
  content: { alignItems: 'center', paddingHorizontal: 28, paddingTop: 12, paddingBottom: 40 },
  emoji: { fontSize: 56, marginBottom: 12 },
  title: { fontFamily: 'Cinzel_700Bold', color: '#fff', fontSize: 22, textAlign: 'center', marginBottom: 14, letterSpacing: 1 },
  desc: { fontFamily: 'Raleway_400Regular', color: '#ffffff', fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  buyBtn: { backgroundColor: '#d4af37', borderRadius: 24, paddingVertical: 14, paddingHorizontal: 32, minWidth: 220, alignItems: 'center' },
  buyBtnText: { fontFamily: 'Raleway_700Bold', color: '#0a0015', fontSize: 15, letterSpacing: 0.5 },
  restoreBtn: { marginTop: 18, padding: 8 },
  restoreText: { fontFamily: 'Raleway_600SemiBold', color: '#d4af37', fontSize: 12, letterSpacing: 0.5 },
});

import { Asset } from 'expo-asset';
import * as Sharing from 'expo-sharing';
import { load, save } from './storage';

// Identyfikator produktu MUSI być identyczny z tym, który zakładasz ręcznie
// w Google Play Console: Monetyzacja → Produkty → Produkty w aplikacji →
// Utwórz produkt. To jednorazowy (nie-konsumowalny) produkt zarządzany.
export const EBOOK_SKU = 'ebook_astrologia_pl';

// Flaga lokalna — używana do natychmiastowego pokazania "Otwórz ebooka" bez
// czekania na sklep. Prawdziwym źródłem prawdy o posiadaniu jest zawsze
// Google Play (getAvailablePurchases/restorePurchases w EbookScreen.js),
// ta flaga to tylko cache dla szybkiego UI.
const EBOOK_OWNED_KEY = 'ebook_astrologia_owned';

// Statyczne require — Metro musi widzieć literalną ścieżkę w kodzie źródłowym
// dla KAŻDEGO require() z osobna (nie da się jej zbudować dynamicznie ze
// zmiennej), ale samych wywołań require() może być kilka — stąd osobny plik
// PDF na każdy język, wybierany w runtime przez getEbookAsset().
const EBOOK_ASSET_PL = require('../../assets/ebooks/przewodnik-astrologia-pl.pdf');
const EBOOK_ASSET_EN = require('../../assets/ebooks/przewodnik-astrologia-en.pdf');

function getEbookAsset(lang) {
  return lang === 'en' ? EBOOK_ASSET_EN : EBOOK_ASSET_PL;
}

export async function isEbookOwnedLocally() {
  const owned = await load(EBOOK_OWNED_KEY);
  return owned === true;
}

export async function markEbookOwned() {
  await save(EBOOK_OWNED_KEY, true);
}

// Otwiera zakupiony ebook (w wersji językowej zgodnej z aktualnym językiem
// apki) natywnym oknem "otwórz w/udostępnij" — użytkownik wybiera dowolny
// czytnik PDF ze swojego telefonu. Celowo NIE ma tu własnej przeglądarki PDF
// w apce, żeby nie dorzucać kolejnej zależności natywnej obok tej, którą i
// tak wymaga sama płatność (expo-iap).
export async function openEbookFile(lang = 'pl') {
  const asset = Asset.fromModule(getEbookAsset(lang));
  if (!asset.localUri) {
    await asset.downloadAsync();
  }
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing not available on this device');
  }
  await Sharing.shareAsync(asset.localUri, {
    mimeType: 'application/pdf',
    dialogTitle: lang === 'en' ? 'Astrology Guide' : 'Przewodnik Astrologiczny',
  });
}

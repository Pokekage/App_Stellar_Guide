import { AdsConsent, AdsConsentStatus } from 'react-native-google-mobile-ads';

export async function initConsent() {
  try {
    const info = await AdsConsent.requestInfoUpdate();
    if (
      info.isConsentFormAvailable &&
      info.status === AdsConsentStatus.REQUIRED
    ) {
      await AdsConsent.showForm();
    }
    const choices = await AdsConsent.getUserChoices();
    return !!(choices?.storeAndAccessInformationOnDevice);
  } catch (e) {
    // UMP nie skonfigurowane w AdMob lub błąd sieci — ignoruj, kontynuuj bez zgody
    console.log('Consent init skipped:', e?.message);
    return false;
  }
}

export async function canShowPersonalizedAds() {
  try {
    const choices = await AdsConsent.getUserChoices();
    return !!(choices?.storeAndAccessInformationOnDevice);
  } catch {
    return false; // bezpieczny fallback — niespersonalizowane
  }
}

// Pozwala użytkownikowi ponownie otworzyć formularz zgody na reklamy
// spersonalizowane w dowolnym momencie (wymóg polityki Google UMP/CMP —
// wcześniej w aplikacji nie było żadnej opcji, by to zrobić po pierwszym
// uruchomieniu). Wywoływane z przycisku w Profilu.
export async function openConsentSettings() {
  try {
    await AdsConsent.showPrivacyOptionsForm();
    return true;
  } catch (e) {
    console.log('openConsentSettings error:', e?.message);
    return false;
  }
}

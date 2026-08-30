import { InterstitialAd, RewardedAd, RewardedAdEventType, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { load, save } from './storage';

const INTERSTITIAL_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : 'ca-app-pub-6047762879323596/9434616431';

let interstitial = null;
let loaded = false;
let loading = false;

export function loadInterstitial() {
  if (loading) return;
  loading = true;
  loaded = false;

  try {
    interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_ID, {
      requestNonPersonalizedAdsOnly: true,
    });

    interstitial.addAdEventListener(AdEventType.LOADED, () => {
      loaded = true;
      loading = false;
    });

    interstitial.addAdEventListener(AdEventType.ERROR, () => {
      loaded = false;
      loading = false;
      // Spróbuj ponownie za 30 sekund
      setTimeout(() => loadInterstitial(), 30000);
    });

    interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      loaded = false;
      loading = false;
      // Załaduj następną reklamę od razu po zamknięciu
      setTimeout(() => loadInterstitial(), 1000);
    });

    interstitial.load();
  } catch (e) {
    loading = false;
    console.log('Interstitial load error:', e);
  }
}

export function showInterstitial() {
  try {
    if (loaded && interstitial) {
      interstitial.show();
    } else {
      // Reklama nie załadowana — załaduj na kolejny raz
      if (!loading) loadInterstitial();
    }
  } catch (e) {
    console.log('Interstitial show error:', e);
  }
}

// ─── Limit częstotliwości reklam pełnoekranowych ───────────────────────────
// Wcześniej showInterstitial() było wołane bezwarunkowo po KAŻDYM odczycie
// tarota i KAŻDYM sprawdzeniu kompatybilności — użytkownik sprawdzający
// kilka par pod rząd dostawał kilka interstitiali z rzędu (ryzyko naruszenia
// polityki AdMob "za dużo reklam" i frustracji użytkowników). Poniższy
// throttle pilnuje minimalnego odstępu czasu między wyświetleniami.
const LAST_SHOWN_KEY = 'interstitial_last_shown_at';
const MIN_INTERVAL_MS = 3 * 60 * 1000; // min. 3 minuty między reklamami pełnoekranowymi

export async function canShowInterstitialNow() {
  try {
    const last = await load(LAST_SHOWN_KEY);
    if (!last) return true;
    return (Date.now() - last) >= MIN_INTERVAL_MS;
  } catch {
    return true; // bezpieczny fallback — nie blokuj reklamy przez błąd storage
  }
}

// Wersja showInterstitial() z limitem częstotliwości — używać zamiast
// showInterstitial() we wszystkich miejscach wywoływanych przez akcje
// użytkownika (nie przy starcie aplikacji).
export async function showInterstitialThrottled() {
  const allowed = await canShowInterstitialNow();
  if (!allowed) return false;
  showInterstitial();
  await save(LAST_SHOWN_KEY, Date.now());
  return true;
}

// ─── Reklama nagradzana (rewarded) ─────────────────────────────────────────
// Nowa funkcja monetyzacyjna: dotychczas apka miała tylko banery i
// interstitiale, zero reklam "za nagrodę". Wzorowana 1:1 na już istniejącym
// wzorcu InterstitialAd powyżej — ta sama biblioteka, więc nie wymaga żadnej
// nowej zależności w package.json.
//
// Prawdziwa jednostka reklamowa typu "Rewarded" założona w konsoli AdMob
// (ten sam wzorzec co INTERSTITIAL_ID wyżej — na buildach deweloperskich
// (__DEV__) zawsze leci bezpieczny TestIds.REWARDED, żeby nigdy przypadkiem
// nie klikać we własne prawdziwe reklamy podczas testów).
const REWARDED_ID = __DEV__
  ? TestIds.REWARDED
  : 'ca-app-pub-6047762879323596/2165033837';

let rewarded = null;
let rewardedLoaded = false;
let rewardedLoading = false;
let pendingRewardCallback = null;

export function loadRewardedAd() {
  if (rewardedLoading) return;
  rewardedLoading = true;
  rewardedLoaded = false;

  try {
    rewarded = RewardedAd.createForAdRequest(REWARDED_ID, {
      requestNonPersonalizedAdsOnly: true,
    });

    rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      rewardedLoaded = true;
      rewardedLoading = false;
    });

    rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      // Użytkownik obejrzał reklamę do końca — dopiero teraz przyznajemy nagrodę.
      if (pendingRewardCallback) {
        pendingRewardCallback();
        pendingRewardCallback = null;
      }
    });

    rewarded.addAdEventListener(AdEventType.ERROR, () => {
      rewardedLoaded = false;
      rewardedLoading = false;
      setTimeout(() => loadRewardedAd(), 30000);
    });

    rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      rewardedLoaded = false;
      rewardedLoading = false;
      pendingRewardCallback = null; // zamknięte przed końcem — bez nagrody
      setTimeout(() => loadRewardedAd(), 1000);
    });

    rewarded.load();
  } catch (e) {
    rewardedLoading = false;
    console.log('Rewarded load error:', e);
  }
}

// onReward — wywoływane TYLKO gdy użytkownik obejrzy reklamę do końca.
// onUnavailable — gdy reklama jeszcze się nie załadowała (np. wolne łącze);
// wywołujący powinien wtedy pokazać użytkownikowi krótki komunikat zamiast
// zawieszać akcję w nieskończoność.
export function showRewardedAd(onReward, onUnavailable) {
  try {
    if (rewardedLoaded && rewarded) {
      pendingRewardCallback = onReward || null;
      rewarded.show();
    } else {
      if (!rewardedLoading) loadRewardedAd();
      if (onUnavailable) onUnavailable();
    }
  } catch (e) {
    console.log('Rewarded show error:', e);
    if (onUnavailable) onUnavailable();
  }
}

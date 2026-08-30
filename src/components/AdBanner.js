import React, { useState, useEffect } from 'react';
import { View } from 'react-native';

let BannerAd, BannerAdSize, TestIds;
try {
  const ads = require('react-native-google-mobile-ads');
  BannerAd = ads.BannerAd;
  BannerAdSize = ads.BannerAdSize;
  TestIds = ads.TestIds;
} catch (e) {
  BannerAd = null;
}

const BANNER_ID = __DEV__
  ? (TestIds?.BANNER ?? 'ca-app-pub-3940256099942544/6300978111')
  : 'ca-app-pub-6047762879323596/5175807229';

export default function AdBanner() {
  const [personalized, setPersonalized] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { canShowPersonalizedAds } = require('../utils/consent');
        const result = await canShowPersonalizedAds();
        if (!cancelled) setPersonalized(!!result);
      } catch {
        // fallback — niespersonalizowane, nie crashuj
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!BannerAd) return <View />;
  return (
    <BannerAd
      unitId={BANNER_ID}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={{ requestNonPersonalizedAdsOnly: !personalized }}
      onAdFailedToLoad={() => {}}
    />
  );
}

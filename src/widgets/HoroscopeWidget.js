import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

// Widok widgetu na ekranie głównym Androida — renderowany natywnie przez
// react-native-android-widget (RemoteViews pod spodem), NIE przez zwykłe
// React Native <View>/<Text>. Dlatego style ograniczają się do podzbioru
// obsługiwanego przez tę bibliotekę (flexbox + podstawowe właściwości tekstu).
//
// Kolorystyka spójna z resztą aplikacji: tło #110022, złoty akcent #d4af37.
export function HoroscopeWidget({
  sign = 'Gwiezdny Przewodnik',
  emoji = '✨',
  text = 'Otwórz aplikację, aby zobaczyć dzisiejszy horoskop.',
}) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        backgroundColor: '#110022',
        borderRadius: 18,
        padding: 14,
      }}
    >
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <TextWidget text={emoji} style={{ fontSize: 20, marginRight: 6 }} />
        <TextWidget
          text={sign}
          style={{ fontSize: 14, color: '#d4af37', fontWeight: 'bold' }}
        />
      </FlexWidget>
      <TextWidget
        text={text}
        style={{ fontSize: 12, color: '#ffffff' }}
      />
    </FlexWidget>
  );
}

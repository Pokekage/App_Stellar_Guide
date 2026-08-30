Dwie wersje językowe Twojego ebooka, każda z własną okładką jako pierwsza
strona PDF-a:

- przewodnik-astrologia-pl.pdf — wersja polska ("Manifestacja przez
  astrologię — Gwiezdny Przewodnik")
- przewodnik-astrologia-en.pdf — wersja angielska ("Manifestation Through
  Astrology — Stellar Guide")

Apka sama wybiera właściwy plik na podstawie aktualnego języka (pl/en) —
patrz getEbookAsset() w src/utils/iap.js.

Jeśli kiedyś zechcesz zaktualizować treść: podmień plik pod TĄ SAMĄ nazwą
(przewodnik-astrologia-pl.pdf albo -en.pdf) — kod odwołuje się do niej na
sztywno (Metro/React Native wymaga statycznej ścieżki w require(), nie da
się jej podać dynamicznie). Jeśli chcesz zmienić nazwy plików, zaktualizuj
też ścieżki w src/utils/iap.js (EBOOK_ASSET_PL / EBOOK_ASSET_EN).

Po podmianie pliku potrzebny jest nowy natywny build — samo przeładowanie
JS nie wystarczy, bo zasoby (assets) są pakowane do apki podczas builda.

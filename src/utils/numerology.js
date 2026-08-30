// ─── Numerologia — liczba drogi życia ──────────────────────────────────────
// Prosta, w pełni lokalna (bez wywołań AI) funkcja licząca "liczbę drogi
// życia" na podstawie daty urodzenia — klasyczna redukcja cyfrowa z
// zachowaniem liczb mistrzowskich 11, 22, 33.

function reduceNumber(num) {
  while (num > 9 && num !== 11 && num !== 22 && num !== 33) {
    num = String(num)
      .split('')
      .reduce((sum, digit) => sum + parseInt(digit, 10), 0);
  }
  return num;
}

// day, month, year — liczby (np. z birthDate zapisanego jako 'DD.MM.RRRR')
export function getLifePathNumber(day, month, year) {
  if (!day || !month || !year) return null;
  const reducedDay = reduceNumber(day);
  const reducedMonth = reduceNumber(month);
  const reducedYear = reduceNumber(year);
  return reduceNumber(reducedDay + reducedMonth + reducedYear);
}

// Parsuje string 'DD.MM.RRRR' i zwraca liczbę drogi życia (lub null)
export function getLifePathFromDateStr(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.split('.');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map((p) => parseInt(p, 10));
  if (!d || !m || !y) return null;
  return getLifePathNumber(d, m, y);
}

const MEANINGS = {
  1: {
    pl: { title: 'Lider', text: 'Niezależność, ambicja i siła przebicia. Jesteś urodzonym inicjatorem — wolisz wytyczać własną ścieżkę niż podążać cudzą.' },
    en: { title: 'The Leader', text: 'Independence, ambition and drive. You are a natural initiator who prefers carving your own path over following others.' },
  },
  2: {
    pl: { title: 'Dyplomata', text: 'Wrażliwość, empatia i talent do budowania relacji. Twoją siłą jest współpraca, intuicja i umiejętność łagodzenia konfliktów.' },
    en: { title: 'The Diplomat', text: 'Sensitivity, empathy and a gift for relationships. Your strength lies in cooperation, intuition and easing conflict.' },
  },
  3: {
    pl: { title: 'Twórca', text: 'Kreatywność, ekspresja i optymizm. Masz naturalny talent do sztuki, słowa i zarażania innych dobrą energią.' },
    en: { title: 'The Creator', text: 'Creativity, expression and optimism. You have a natural gift for art, words, and spreading good energy.' },
  },
  4: {
    pl: { title: 'Budowniczy', text: 'Solidność, dyscyplina i pracowitość. Budujesz trwałe fundamenty — dla siebie i dla innych — krok po kroku.' },
    en: { title: 'The Builder', text: 'Reliability, discipline and hard work. You build lasting foundations — for yourself and others — step by step.' },
  },
  5: {
    pl: { title: 'Poszukiwacz Wolności', text: 'Zmiana, przygoda i wszechstronność. Nie znosisz rutyny — potrzebujesz przestrzeni, nowych doświadczeń i swobody wyboru.' },
    en: { title: 'The Freedom Seeker', text: 'Change, adventure and versatility. Routine bores you — you need space, new experiences and freedom of choice.' },
  },
  6: {
    pl: { title: 'Opiekun', text: 'Odpowiedzialność, troska i poczucie harmonii. Naturalnie dbasz o innych i tworzysz wokół siebie ciepłą, bezpieczną przestrzeń.' },
    en: { title: 'The Nurturer', text: 'Responsibility, care and a sense of harmony. You naturally look after others and create a warm, safe space around you.' },
  },
  7: {
    pl: { title: 'Poszukiwacz Prawdy', text: 'Introspekcja, analiza i duchowość. Szukasz głębszego sensu — refleksja i samotność są dla Ciebie źródłem siły, nie samotnością z przymusu.' },
    en: { title: 'The Seeker', text: 'Introspection, analysis and spirituality. You search for deeper meaning — reflection and solitude are a source of strength, not loneliness.' },
  },
  8: {
    pl: { title: 'Realizator', text: 'Ambicja, władza i zmysł do materialnego sukcesu. Masz naturalny talent organizacyjny i dążysz do konkretnych, wymiernych rezultatów.' },
    en: { title: 'The Achiever', text: 'Ambition, power and a sense for material success. You have natural organizational talent and aim for concrete, measurable results.' },
  },
  9: {
    pl: { title: 'Humanista', text: 'Współczucie, altruizm i szeroka perspektywa. Myślisz globalnie i czujesz silną potrzebę, by zostawić po sobie coś dobrego dla innych.' },
    en: { title: 'The Humanitarian', text: 'Compassion, altruism and a broad perspective. You think globally and feel a strong need to leave something good behind for others.' },
  },
  11: {
    pl: { title: 'Intuicyjny Wizjoner (liczba mistrzowska)', text: 'Wyjątkowa intuicja i wrażliwość duchowa. Jesteś naturalnym inspiratorem — czujesz więcej niż inni i potrafisz to przekuć w coś, co porusza ludzi.' },
    en: { title: 'The Intuitive Visionary (master number)', text: 'Exceptional intuition and spiritual sensitivity. You are a natural inspirer — you feel more than others and can turn it into something that moves people.' },
  },
  22: {
    pl: { title: 'Mistrz Budowniczy (liczba mistrzowska)', text: 'Wizja połączona z umiejętnością realizacji na wielką skalę. Potrafisz zamieniać ambitne marzenia w konkretne, trwałe osiągnięcia.' },
    en: { title: 'The Master Builder (master number)', text: 'Vision paired with the ability to execute on a grand scale. You can turn ambitious dreams into concrete, lasting achievements.' },
  },
  33: {
    pl: { title: 'Mistrz Nauczyciel (liczba mistrzowska)', text: 'Bezwarunkowa troska i pragnienie niesienia pomocy na dużą skalę. Rzadka energia współczucia połączona z siłą przywódczą.' },
    en: { title: 'The Master Teacher (master number)', text: 'Unconditional care and a desire to help on a grand scale. A rare blend of compassionate energy and leadership strength.' },
  },
};

export function getLifePathMeaning(number, lang = 'pl') {
  const entry = MEANINGS[number];
  if (!entry) return null;
  return lang === 'en' ? entry.en : entry.pl;
}

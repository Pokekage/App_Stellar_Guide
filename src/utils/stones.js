// Wspólne dane kamieni zodiaku — używane przez HomeScreen.js i StonesScreen.js
// żeby nie duplikować tej samej listy w dwóch plikach.
export const STONES = {
  aries: [
    { name: 'Rubín', nameEn: 'Ruby', colors: ['#c0392b', '#e74c3c', '#922b21'], symbol: '✦', desc: 'Wzmacnia odwagę i energię życiową. Pobudza do działania i chroni przed negatywnymi wpływami.', descEn: 'Strengthens courage and life energy. Motivates action and protects against negative influences.', image: null },
    { name: 'Diament', nameEn: 'Diamond', colors: ['#85c1e9', '#aed6f1', '#d6eaf8'], symbol: '◆', desc: 'Symbol siły i niezniszczalności. Wzmacnia koncentrację i klarowność umysłu.', descEn: 'Symbol of strength and indestructibility. Enhances concentration and mental clarity.', image: null },
    { name: 'Karnelian', nameEn: 'Carnelian', colors: ['#e67e22', '#f39c12', '#d35400'], symbol: '●', desc: 'Kamień motywacji i kreatywności. Odpędza lęk i dodaje pewności siebie.', descEn: 'Stone of motivation and creativity. Dispels fear and boosts confidence.', image: null },
    { name: 'Jaspis', nameEn: 'Jasper', colors: ['#cb4335', '#a93226', '#7b241c'], symbol: '■', desc: 'Uziemia energię i stabilizuje emocje. Kamień wytrwałości i determinacji.', descEn: 'Grounds energy and stabilizes emotions. Stone of perseverance and determination.', image: null },
  ],
  taurus: [
    { name: 'Szmaragd', nameEn: 'Emerald', colors: ['#27ae60', '#2ecc71', '#1e8449'], symbol: '✦', desc: 'Kamień miłości i obfitości. Przyciąga harmonię, spokój i dobrobyt.', descEn: 'Stone of love and abundance. Attracts harmony, peace and prosperity.', image: null },
    { name: 'Różowy Kwarc', nameEn: 'Rose Quartz', colors: ['#fd79a8', '#fab1d3', '#e84393'], symbol: '♥', desc: 'Otwiera serce na miłość i czułość. Łagodzi stres i przynosi spokój.', descEn: 'Opens the heart to love and tenderness. Soothes stress and brings inner peace.', image: null },
    { name: 'Malachit', nameEn: 'Malachite', colors: ['#1e8449', '#27ae60', '#145a32'], symbol: '◆', desc: 'Kamień transformacji i ochrony. Absorbuje negatywną energię.', descEn: 'Stone of transformation and protection. Absorbs negative energy.', image: null },
    { name: 'Tygrysie Oko', nameEn: 'Tiger\'s Eye', colors: ['#9a7d0a', '#d4ac0d', '#7d6608'], symbol: '◉', desc: 'Przyciąga szczęście i dobrobyt. Wzmacnia determinację i praktyczne myślenie.', descEn: 'Attracts luck and prosperity. Strengthens determination and practical thinking.', image: null },
  ],
  gemini: [
    { name: 'Agat', nameEn: 'Agate', colors: ['#7f8c8d', '#aab7b8', '#566573'], symbol: '◎', desc: 'Harmonizuje umysł i ciało. Wzmacnia koncentrację i komunikację.', descEn: 'Harmonizes mind and body. Enhances concentration and communication.', image: null },
    { name: 'Cytryn', nameEn: 'Citrine', colors: ['#f4d03f', '#f7dc6f', '#d4ac0d'], symbol: '☀', desc: 'Kamień radości i optymizmu. Pobudza kreatywność i pozytywną energię.', descEn: 'Stone of joy and optimism. Stimulates creativity and positive energy.', image: null },
    { name: 'Perła', nameEn: 'Pearl', colors: ['#d5d8dc', '#eaecee', '#aab7b8'], symbol: '○', desc: 'Symbol mądrości i czystości. Uspokaja umysł i wzmacnia intuicję.', descEn: 'Symbol of wisdom and purity. Calms the mind and strengthens intuition.', image: null },
    { name: 'Akwamaryn', nameEn: 'Aquamarine', colors: ['#5dade2', '#85c1e9', '#2e86c1'], symbol: '◈', desc: 'Kamień jasnej komunikacji. Ułatwia wyrażanie myśli i przynosi spokój.', descEn: 'Stone of clear communication. Facilitates expression and brings peace of mind.', image: null },
  ],
  cancer: [
    { name: 'Księżycowy', nameEn: 'Moonstone', colors: ['#aab7b8', '#d5d8dc', '#717d7e'], symbol: '🌙', desc: 'Kamień intuicji i kobiecości. Wzmacnia więzi emocjonalne.', descEn: 'Stone of intuition and femininity. Strengthens emotional bonds.', image: null },
    { name: 'Perła', nameEn: 'Pearl', colors: ['#d5d8dc', '#eaecee', '#aab7b8'], symbol: '○', desc: 'Symbol czystości i mądrości. Wzmacnia empatię i delikatność.', descEn: 'Symbol of purity and wisdom. Strengthens empathy and gentleness.', image: null },
    { name: 'Opal', nameEn: 'Opal', colors: ['#a9cce3', '#d6eaf8', '#7fb3d3'], symbol: '◈', desc: 'Kamień nadziei i twórczości. Wzmacnia wyobraźnię i duchowe widzenie.', descEn: 'Stone of hope and creativity. Enhances imagination and spiritual vision.', image: null },
    { name: 'Selenite', nameEn: 'Selenite', colors: ['#eaecee', '#f2f3f4', '#cacfd2'], symbol: '✧', desc: 'Czyści aurę i uspokaja umysł. Sprzyja medytacji i kontaktowi z wyższą świadomością.', descEn: 'Cleanses the aura and calms the mind. Promotes meditation and higher consciousness.', image: null },
  ],
  leo: [
    { name: 'Złoty Topaz', nameEn: 'Golden Topaz', colors: ['#f39c12', '#f8c471', '#d68910'], symbol: '★', desc: 'Kamień władzy i pewności siebie. Przyciąga sukcesy i wzmacnia charyzmę.', descEn: 'Stone of power and self-confidence. Attracts success and strengthens charisma.', image: null },
    { name: 'Onyks', nameEn: 'Onyx', colors: ['#2c3e50', '#566573', '#1c2833'], symbol: '◼', desc: 'Kamień ochrony i siły. Odpędza negatywną energię i wzmacnia wolę.', descEn: 'Stone of protection and strength. Repels negative energy and strengthens willpower.', image: null },
    { name: 'Cytryn', nameEn: 'Citrine', colors: ['#f4d03f', '#f7dc6f', '#d4ac0d'], symbol: '☀', desc: 'Przyciąga obfitość i radość. Wzmacnia kreatywność i poczucie własnej wartości.', descEn: 'Attracts abundance and joy. Enhances creativity and self-worth.', image: null },
    { name: 'Bursztyn', nameEn: 'Amber', colors: ['#e67e22', '#f0b27a', '#ca6f1e'], symbol: '◉', desc: 'Starożytny kamień ochrony. Oczyszcza energię i przynosi ciepło.', descEn: 'Ancient stone of protection. Cleanses energy and brings warmth and optimism.', image: null },
  ],
  virgo: [
    { name: 'Jadeit', nameEn: 'Jade', colors: ['#1e8449', '#27ae60', '#196f3d'], symbol: '◆', desc: 'Kamień harmonii i równowagi. Wspomaga zdrowie i przyciąga spokój.', descEn: 'Stone of harmony and balance. Supports health and attracts peace.', image: null },
    { name: 'Ametyst', nameEn: 'Amethyst', colors: ['#8e44ad', '#a569bd', '#6c3483'], symbol: '✦', desc: 'Kamień duchowości i mądrości. Wzmacnia intuicję i analityczne myślenie.', descEn: 'Stone of spirituality and wisdom. Enhances intuition and analytical thinking.', image: null },
    { name: 'Turkus', nameEn: 'Turquoise', colors: ['#1abc9c', '#48c9b0', '#148f77'], symbol: '◈', desc: 'Kamień uzdrawiania i ochrony. Przynosi spokój umysłu i ułatwia komunikację.', descEn: 'Stone of healing and protection. Brings peace of mind and facilitates communication.', image: null },
    { name: 'Sardonix', nameEn: 'Sardonyx', colors: ['#784212', '#a04000', '#5d3a1a'], symbol: '■', desc: 'Wzmacnia charakter i wartości moralne. Sprzyja szczęściu w związkach.', descEn: 'Strengthens character and moral values. Promotes happiness in relationships.', image: null },
  ],
  libra: [
    { name: 'Opal', nameEn: 'Opal', colors: ['#a9cce3', '#d6eaf8', '#7fb3d3'], symbol: '◈', desc: 'Kamień harmonii i piękna. Wzmacnia kreatywność i przyciąga miłość.', descEn: 'Stone of harmony and beauty. Enhances creativity and attracts love.', image: null },
    { name: 'Lapis Lazuli', nameEn: 'Lapis Lazuli', colors: ['#1f618d', '#2e86c1', '#154360'], symbol: '◆', desc: 'Kamień mądrości i prawdy. Wzmacnia intuicję i sprzyja harmonijnym relacjom.', descEn: 'Stone of wisdom and truth. Enhances intuition and promotes harmonious relationships.', image: null },
    { name: 'Różowy Turmalin', nameEn: 'Pink Tourmaline', colors: ['#e91e8c', '#f48fb1', '#c2185b'], symbol: '♥', desc: 'Otwiera serce na miłość. Przyciąga harmonię i równowagę w relacjach.', descEn: 'Opens the heart to love. Attracts harmony and balance in relationships.', image: null },
    { name: 'Ametyst', nameEn: 'Amethyst', colors: ['#8e44ad', '#a569bd', '#6c3483'], symbol: '✦', desc: 'Przynosi spokój i równowagę ducha. Wzmacnia duchowość.', descEn: 'Brings peace and spiritual balance. Strengthens spirituality and clear thinking.', image: null },
  ],
  scorpio: [
    { name: 'Obsydian', nameEn: 'Obsidian', colors: ['#1c2833', '#2c3e50', '#17202a'], symbol: '◼', desc: 'Kamień ochrony i transformacji. Odsłania ukryte prawdy i odpędza negatywną energię.', descEn: 'Stone of protection and transformation. Reveals hidden truths and repels negative energy.', image: null },
    { name: 'Granat', nameEn: 'Garnet', colors: ['#922b21', '#c0392b', '#7b241c'], symbol: '◉', desc: 'Kamień namiętności i oddania. Wzmacnia energię życiową i głębokie więzi.', descEn: 'Stone of passion and devotion. Strengthens life energy and deep bonds.', image: null },
    { name: 'Malachit', nameEn: 'Malachite', colors: ['#1e8449', '#27ae60', '#145a32'], symbol: '◆', desc: 'Kamień głębokiej transformacji. Pomaga przepracować traumy i otwiera na zmiany.', descEn: 'Stone of deep transformation. Helps process trauma and opens to change.', image: null },
    { name: 'Czarny Turmalin', nameEn: 'Black Tourmaline', colors: ['#2c3e50', '#1a252f', '#0d1b2a'], symbol: '✦', desc: 'Najpotężniejszy kamień ochrony. Tworzy tarczę przed negatywnością.', descEn: 'Most powerful protection stone. Creates a shield against negativity.', image: null },
  ],
  sagittarius: [
    { name: 'Turkus', nameEn: 'Turquoise', colors: ['#1abc9c', '#48c9b0', '#148f77'], symbol: '◈', desc: 'Kamień przygody i szczęścia. Chroni podróżników i przynosi powodzenie.', descEn: 'Stone of adventure and luck. Protects travelers and brings good fortune.', image: null },
    { name: 'Lapis Lazuli', nameEn: 'Lapis Lazuli', colors: ['#1f618d', '#2e86c1', '#154360'], symbol: '◆', desc: 'Kamień mądrości i filozofii. Poszerza horyzonty i wspiera poszukiwanie prawdy.', descEn: 'Stone of wisdom and philosophy. Broadens horizons and supports truth-seeking.', image: null },
    { name: 'Sodalit', nameEn: 'Sodalite', colors: ['#2980b9', '#5dade2', '#1a5276'], symbol: '●', desc: 'Kamień logiki i intuicji. Pomaga łączyć rozum z przeczuciem.', descEn: 'Stone of logic and intuition. Helps combine reason with intuition.', image: null },
    { name: 'Ametyst', nameEn: 'Amethyst', colors: ['#8e44ad', '#a569bd', '#6c3483'], symbol: '✦', desc: 'Wzmacnia duchowość i wyższe myślenie. Sprzyja medytacji i filozofii.', descEn: 'Strengthens spirituality and higher thinking. Promotes meditation and philosophy.', image: null },
  ],
  capricorn: [
    { name: 'Onyks', nameEn: 'Onyx', colors: ['#2c3e50', '#566573', '#1c2833'], symbol: '◼', desc: 'Kamień siły i dyscypliny. Wzmacnia wytrwałość w dążeniu do celów.', descEn: 'Stone of strength and discipline. Strengthens perseverance in pursuing goals.', image: null },
    { name: 'Granat', nameEn: 'Garnet', colors: ['#922b21', '#c0392b', '#7b241c'], symbol: '◉', desc: 'Kamień sukcesu i determinacji. Przyciąga powodzenie w pracy i biznesie.', descEn: 'Stone of success and determination. Attracts success in work and business.', image: null },
    { name: 'Tygrysie Oko', nameEn: 'Tiger\'s Eye', colors: ['#9a7d0a', '#d4ac0d', '#7d6608'], symbol: '◉', desc: 'Wzmacnia koncentrację i praktyczne myślenie. Przyciąga dobrobyt.', descEn: 'Strengthens concentration and practical thinking. Attracts material prosperity.', image: null },
    { name: 'Czarny Turmalin', nameEn: 'Black Tourmaline', colors: ['#2c3e50', '#1a252f', '#0d1b2a'], symbol: '✦', desc: 'Chroni przed stresem i negatywnymi wpływami. Uziemia energię.', descEn: 'Protects against stress and negative influences. Grounds and stabilizes energy.', image: null },
  ],
  aquarius: [
    { name: 'Ametyst', nameEn: 'Amethyst', colors: ['#8e44ad', '#a569bd', '#6c3483'], symbol: '✦', desc: 'Kamień innowacji i duchowości. Wzmacnia intuicję i oryginalne myślenie.', descEn: 'Stone of innovation and spirituality. Enhances intuition and original thinking.', image: null },
    { name: 'Akwamaryn', nameEn: 'Aquamarine', colors: ['#5dade2', '#85c1e9', '#2e86c1'], symbol: '◈', desc: 'Kamień jasności umysłu i spokoju. Wspomaga komunikację i humanitarne ideały.', descEn: 'Stone of clarity and calm. Supports communication and humanitarian ideals.', image: null },
    { name: 'Labradoryt', nameEn: 'Labradorite', colors: ['#2471a3', '#5dade2', '#1a5276'], symbol: '◇', desc: 'Kamień transformacji i magii. Wzmacnia intuicję i ochronę podczas zmian.', descEn: 'Stone of transformation and magic. Strengthens intuition and protection during changes.', image: null },
    { name: 'Fluoryt', nameEn: 'Fluorite', colors: ['#7fb3d3', '#a9cce3', '#5499c7'], symbol: '◈', desc: 'Oczyszcza umysł i wzmacnia koncentrację. Sprzyja nauce i innowacjom.', descEn: 'Cleanses the mind and enhances concentration. Promotes learning and innovation.', image: null },
  ],
  pisces: [
    { name: 'Akwamaryn', nameEn: 'Aquamarine', colors: ['#5dade2', '#85c1e9', '#2e86c1'], symbol: '◈', desc: 'Kamień wrażliwości i spokoju. Chroni Ryby i wzmacnia duchowe połączenie z wodą.', descEn: 'Stone of sensitivity and calm. Protects Pisces and strengthens spiritual connection with water.', image: null },
    { name: 'Ametyst', nameEn: 'Amethyst', colors: ['#8e44ad', '#a569bd', '#6c3483'], symbol: '✦', desc: 'Kamień duchowości i ochrony psychicznej. Wzmacnia zdolności intuicyjne.', descEn: 'Stone of spirituality and psychic protection. Strengthens intuitive abilities.', image: null },
    { name: 'Księżycowy', nameEn: 'Moonstone', colors: ['#aab7b8', '#d5d8dc', '#717d7e'], symbol: '🌙', desc: 'Wzmacnia wyobraźnię i empatię. Sprzyja pięknym snom i duchowym wizjom.', descEn: 'Strengthens imagination and empathy. Promotes beautiful dreams and spiritual visions.', image: null },
    { name: 'Labradoryt', nameEn: 'Labradorite', colors: ['#2471a3', '#5dade2', '#1a5276'], symbol: '◇', desc: 'Kamień magii i mistycyzmu. Chroni wrażliwą naturę Ryb.', descEn: 'Stone of magic and mysticism. Protects the sensitive nature of Pisces.', image: null },
  ],
};

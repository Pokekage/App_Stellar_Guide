# Bezpieczeństwo — klucz API do Groq

## Co się stało

W `eas.json` (w `build.production.env.EXPO_PUBLIC_GROQ_KEY`) był zapisany
jawnym tekstem prawdziwy, działający klucz API do Groq. Ponieważ nazwa
zmiennej zaczyna się od `EXPO_PUBLIC_`, Expo wpina jej wartość na sztywno do
paczki JS **każdego** builda produkcyjnego — a to oznacza, że każdy, kto
rozpakuje plik APK/IPA i poszuka stringów, może ten klucz odzyskać i używać
go na Twój koszt (drenowanie limitu/rachunku w Groq).

Ten commit usuwa klucz z `eas.json`, ale to **nie wystarczy** — musisz jeszcze:

## 1. Zrotuj klucz od razu

Wejdź na https://console.groq.com, unieważnij stary klucz (ten zaczynający
się od `gsk_5qlKX...`) i wygeneruj nowy. Stary klucz trzeba uznać za
skompromitowany niezależnie od tego, czy trafił do zdalnego repozytorium —
wystarczyło, że istniał w pliku śledzonym przez git.

## 2. Ustaw nowy klucz poprawnie

**Do developmentu lokalnego** — plik `.env` w katalogu głównym (jest już
w `.gitignore`, więc nie trafi do repo):

```
EXPO_PUBLIC_GROQ_KEY=twój_nowy_klucz
```

**Do buildów EAS** — nie wpisuj klucza z powrotem do `eas.json`. Użyj
zmiennych środowiskowych EAS (Environment Variables), które przechowują
sekret po stronie Expo, a nie w repozytorium:

```
eas env:create --scope project --name EXPO_PUBLIC_GROQ_KEY --value "twój_nowy_klucz" --environment production --visibility sensitive
```

(analogicznie dla `--environment preview` / `development`, jeśli buildy
preview też mają korzystać z AI).

## 3. Docelowo: przenieś wywołania Groq za własny backend (zalecane)

Ważne zastrzeżenie: nawet trzymanie klucza jako "sensitive" w EAS env **nie
rozwiązuje** problemu do końca — zmienna z prefiksem `EXPO_PUBLIC_` i tak
trafia do zbudowanej paczki JS, bo do tego służy (Expo świadomie "zapieka"
takie zmienne w kliencie). Jedyny w pełni bezpieczny sposób to nie wysyłać
klucza do klienta w ogóle, tylko wywoływać Groq z własnego, prostego
backendu-proxy, który trzyma klucz po swojej stronie.

W katalogu `server/groq-proxy/` znajduje się gotowy, minimalny Cloudflare
Worker, który robi dokładnie to — przyjmuje ten sam kształt requestu, którego
już używa `src/utils/astro.js`, i przekazuje go do Groq z kluczem trzymanym
jako sekret Workera. Zobacz `server/groq-proxy/README.md` po instrukcję
wdrożenia.

Po wdrożeniu proxy wystarczy ustawić w `.env` / EAS env:

```
EXPO_PUBLIC_LLM_PROXY_URL=https://twoj-worker.workers.dev
```

— `astro.js` automatycznie zacznie kierować tam wszystkie zapytania zamiast
bezpośrednio do Groq, i `EXPO_PUBLIC_GROQ_KEY` nie będzie już w ogóle
potrzebny w kliencie. Jeśli `EXPO_PUBLIC_LLM_PROXY_URL` nie jest ustawione,
aplikacja działa jak dotychczas (bezpośrednio do Groq, przez
`EXPO_PUBLIC_GROQ_KEY`) — więc to zmiana w pełni opcjonalna i wsteczna.

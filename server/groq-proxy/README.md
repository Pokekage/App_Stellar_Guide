# Groq proxy (opcjonalny)

Ten mikro-serwis to jednoplikowy Cloudflare Worker, który stoi między
aplikacją a Groq API, żeby prawdziwy klucz Groq nigdy nie musiał trafiać do
paczki JS aplikacji mobilnej (patrz `SECURITY.md` w katalogu głównym po
wyjaśnienie, dlaczego zmienne `EXPO_PUBLIC_*` same w sobie tego nie
gwarantują).

To jest **opcjonalne** — jeśli nic tu nie wdrożysz, aplikacja działa tak jak
wcześniej: bezpośrednio do Groq, z kluczem z `EXPO_PUBLIC_GROQ_KEY`.

## Wdrożenie (5 minut, darmowy plan Cloudflare wystarczy)

```bash
npm install -g wrangler
cd server/groq-proxy
wrangler login
wrangler secret put GROQ_API_KEY
# wklej nowy, zrotowany klucz Groq (patrz SECURITY.md — NIE stary, skompromitowany)
wrangler deploy
```

Ostatnia komenda wypisze adres wdrożonego Workera, np.
`https://gwiezdnyprzewodnik-groq-proxy.twoj-login.workers.dev`.

## Podłączenie w aplikacji

W `.env` (lokalnie) i/lub przez `eas env:create` (dla buildów EAS) ustaw:

```
EXPO_PUBLIC_LLM_PROXY_URL=https://gwiezdnyprzewodnik-groq-proxy.twoj-login.workers.dev
```

`src/utils/astro.js` (funkcja `callLLM`) automatycznie zacznie kierować
wszystkie zapytania AI przez ten adres zamiast bezpośrednio do Groq — żadna
inna zmiana w kodzie aplikacji nie jest potrzebna. Wtedy `EXPO_PUBLIC_GROQ_KEY`
nie musi już być ustawiony po stronie klienta wcale — prawdziwy klucz mieszka
tylko jako sekret Workera.

## Koszt

Cloudflare Workers ma darmowy plan (100 000 requestów/dzień), który dla
aplikacji tej skali (kilka wywołań AI na sesję użytkownika) powinien
wystarczyć na długo.

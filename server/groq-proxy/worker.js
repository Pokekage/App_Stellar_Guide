/**
 * Minimalny proxy do Groq API na Cloudflare Workers.
 *
 * Cel: żeby prawdziwy klucz Groq nigdy nie trafiał do aplikacji mobilnej
 * (a więc do paczki JS klienta) — trzyma go tylko ten Worker, jako sekret.
 * Aplikacja mobilna (src/utils/astro.js) wywołuje ten sam kształt requestu,
 * jaki wcześniej wysyłała bezpośrednio do Groq, więc nie trzeba nic zmieniać
 * poza ustawieniem EXPO_PUBLIC_LLM_PROXY_URL — patrz README.md w tym katalogu.
 *
 * Wdrożenie (Cloudflare Workers, darmowy plan wystarczy na start):
 *   1. npm install -g wrangler
 *   2. wrangler login
 *   3. wrangler secret put GROQ_API_KEY   (wklej nowy, zrotowany klucz Groq)
 *   4. wrangler deploy
 *   5. W .env / EAS env ustaw EXPO_PUBLIC_LLM_PROXY_URL na adres z kroku 4.
 */

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('Invalid JSON body', { status: 400 });
    }

    // Bardzo prosta walidacja kształtu — nie przepuszczaj dowolnych requestów.
    if (!body || !Array.isArray(body.messages)) {
      return new Response('Invalid request shape', { status: 400 });
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    // Przekaż odpowiedź (i status) Groq bez zmian — klient (astro.js) już
    // wie jak ją zinterpretować, bo to ten sam kontrakt co bezpośrednie API.
    const text = await groqRes.text();
    return new Response(text, {
      status: groqRes.status,
      headers: { 'Content-Type': 'application/json' },
    });
  },
};

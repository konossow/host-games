// Edge Function "oszukac-przeznaiczenie": pośrednik między grą a modelem Groq.
// Gra wysyła historię rozmowy, funkcja dokleja prompt systemowy i zwraca odpowiedź modelu.
// Dzięki temu klucz Groq (sekret GROQ_API_KEY) nigdy nie trafia do przeglądarki.
//
// Wymagane sekrety (Supabase Dashboard -> Edge Functions -> Secrets):
//   GROQ_API_KEY - klucz z https://console.groq.com
//   GROQ_MODEL   - opcjonalnie, domyślnie openai/gpt-oss-120b (llama-3.3-70b-versatile Groq wycofał 16.08.2026)
import {modelfile} from './modelfile.ts';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Body {
  action: 'scenario' | 'fate';
  history: Message[];
}

// takie same temperatury jak wcześniej w ../death-by-ai/src/api.ts
const TEMPERATURE = {scenario: 0.9, fate: 0.3};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {status, headers: {...corsHeaders, 'Content-Type': 'application/json'}});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {headers: corsHeaders});
  }

  const apiKey = Deno.env.get('GROQ_API_KEY');
  if (!apiKey) {
    return json({error: 'GROQ_API_KEY secret is not set'}, 500);
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({error: 'Invalid JSON body'}, 400);
  }
  const {action, history} = body;
  if (!(action in TEMPERATURE) || !Array.isArray(history) || history.length > 100) {
    return json({error: 'Expected {action: "scenario" | "fate", history: Message[]}'}, 400);
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({
      model: Deno.env.get('GROQ_MODEL') ?? 'openai/gpt-oss-120b',
      temperature: TEMPERATURE[action],
      messages: [
        {role: 'system', content: modelfile},
        // tylko role user/assistant - klient nie może podmienić promptu systemowego
        ...history
          .filter(m => m.role === 'user' || m.role === 'assistant')
          .map(m => ({role: m.role, content: String(m.content).slice(0, 2000)}))
      ]
    })
  });

  if (!response.ok) {
    console.error('Groq error', response.status, await response.text());
    return json({error: `Groq error ${response.status}`}, 502);
  }

  const completion = await response.json();
  return json({content: completion.choices?.[0]?.message?.content ?? ''});
});

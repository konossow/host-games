import {supabase} from '../supabase';

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Wysyła historię rozmowy do Edge Function "oszukac-przeznaiczenie", która dokleja prompt systemowy
 * i pyta model Groq. Klucz Groq jest sekretem w Supabase - nie ma go w przeglądarce.
 * - "scenario": nowy scenariusz (wyższa temperatura)
 * - "fate": ocena strategii gracza (niższa temperatura)
 * Zwraca surową treść odpowiedzi modelu (JSON w postaci tekstu).
 */
export const askAi = async (action: 'scenario' | 'fate', history: AiMessage[]): Promise<string> => {
  const {data, error} = await supabase.functions.invoke<{content: string}>('oszukac-przeznaiczenie', {
    body: {action, history}
  });
  if (error || !data) {
    throw new Error(`oszukac-przeznaiczenie: ${error?.message ?? 'empty response'}`);
  }
  return data.content;
};

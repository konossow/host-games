import {markSeen} from "@host/shared";

// Dawniej: POST http://localhost:5555/players. Teraz: funkcja SQL mark_seen w Supabase.
export const updateSeed = async (seed: string | undefined, questionsIds: number[]) => {
  return await markSeen('potoczna-potyczka', seed, questionsIds);
}

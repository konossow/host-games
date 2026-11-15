import {potocznaPotyczkaApi} from "@host/shared";
import {GameMode} from "../model/GameMode";
import {GameTheme} from "../model/GameTheme";
import type Question from "../model/Question";

// Dawniej: POST http://localhost:5555/questions. Teraz: funkcja SQL pp_get_questions w Supabase.
export const getQuestions = async (seed?: string, mode?: GameMode, count?: number, themes?: GameTheme[]) => {
  return await potocznaPotyczkaApi.getQuestions({seed, mode, count, themes}) as Question[];
}

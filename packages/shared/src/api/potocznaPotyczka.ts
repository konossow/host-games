import {supabase} from '../supabase';

export interface PpQuestion {
  id: number;
  lang: 'pl' | 'en';
  description: string;
  themes: string[];
  answers: {description: string; points: number}[];
}

export interface GetQuestionsParams {
  seed?: string;
  mode?: string;
  count?: number;
  themes?: string[];
  lang?: 'pl' | 'en';
}

/**
 * Losuje pytania, których seed jeszcze nie widział (+50% zapasu na przelosowanie).
 * Logika siedzi w funkcji SQL public.pp_get_questions.
 */
export const getQuestions = async ({seed, mode, count, themes, lang}: GetQuestionsParams): Promise<PpQuestion[]> => {
  const {data, error} = await supabase.rpc('pp_get_questions', {
    p_seed: seed ?? null,
    p_mode: mode ?? 'classic',
    p_count: count ?? 10,
    p_themes: themes ?? [],
    p_lang: lang ?? 'pl'
  });
  if (error) {
    console.error('Failed to get questions', error);
    return [];
  }
  return data as PpQuestion[];
};

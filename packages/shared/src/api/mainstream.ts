import {mediaUrl, supabase} from '../supabase';

export interface MsRiddle {
  id: number;
  answer: string;
  themes: string[];
  /** gotowy, publiczny URL obrazka w Supabase Storage */
  imageUrl: string;
}

export interface GetRiddlesParams {
  seed?: string;
  count?: number;
  themes?: string[];
}

/**
 * Losuje zagadki, których seed jeszcze nie widział.
 * Bez motywów: wszystkie poza polskimi (motyw "pl"), w razie braku dopełnia już widzianymi.
 * Logika siedzi w funkcji SQL public.ms_get_riddles.
 */
export const getRiddles = async ({seed, count, themes}: GetRiddlesParams): Promise<MsRiddle[]> => {
  const {data, error} = await supabase.rpc('ms_get_riddles', {
    p_seed: seed ?? null,
    p_count: count ?? 6,
    p_themes: themes ?? []
  });
  if (error) {
    console.error('Failed to get riddles', error);
    return [];
  }
  return (data as {id: number; answer: string; themes: string[]; image_path: string}[]).map(r => ({
    id: r.id,
    answer: r.answer,
    themes: r.themes,
    imageUrl: mediaUrl(r.image_path)
  }));
};

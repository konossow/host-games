import {supabase} from '../supabase';

export type SeenGame = 'potoczna-potyczka' | 'mainstream';

/**
 * Zapisuje, że dany seed (np. "valhalla") widział już podane pytania/zagadki,
 * żeby przy kolejnej grze nie zostały wylosowane ponownie.
 * Odpowiednik dawnego POST /players.
 */
export const markSeen = async (game: SeenGame, seed: string | undefined, itemIds: number[]) => {
  if (!seed || itemIds.length === 0) {
    return;
  }
  const {error} = await supabase.rpc('mark_seen', {p_game: game, p_seed: seed, p_item_ids: itemIds});
  if (error) {
    console.error(`Failed to mark seen (${game}, ${seed}):`, itemIds, error);
  }
};

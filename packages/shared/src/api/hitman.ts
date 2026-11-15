import {supabase} from '../supabase';

/** Wszystkie zadania dla zabójców (tabela public.hm_quests). */
export const getQuests = async (): Promise<string[]> => {
  const {data, error} = await supabase.from('hm_quests').select('description').order('id');
  if (error) {
    console.error('Failed to get quests', error);
    return [];
  }
  return data.map(q => q.description);
};

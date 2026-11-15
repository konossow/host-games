import {createClient} from '@supabase/supabase-js';

// Wartości pochodzą z host-games/.env (Vite wstawia je do bundla podczas builda)
const url = import.meta.env.VITE_SUPABASE_URL as string;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

// Gry nie logują użytkowników, więc nie trzymamy sesji w przeglądarce
export const supabase = createClient(url, publishableKey, {
  auth: {persistSession: false, autoRefreshToken: false}
});

const MEDIA_BUCKET = 'games';

/**
 * Publiczny URL pliku z bucketa "games", np.
 * mediaUrl('potoczna-potyczka/sounds/round.mp3')
 */
export const mediaUrl = (path: string) =>
  supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;

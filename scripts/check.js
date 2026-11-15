// Szybki test, czy Supabase działa tak, jak widzą je gry.
// Używa tylko publicznego klucza publishable (tego samego co gry) i niczego nie zapisuje.
//
//   npm run check
import {createClient} from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const supabase = createClient(url, process.env.VITE_SUPABASE_PUBLISHABLE_KEY, {auth: {persistSession: false}});
const mediaUrl = (path) => supabase.storage.from('games').getPublicUrl(path).data.publicUrl;

let failed = 0;
const check = async (name, fn) => {
  try {
    const result = await fn();
    console.log(`  OK    ${name}${result ? ` - ${result}` : ''}`);
  } catch (err) {
    failed++;
    console.log(`  BŁĄD  ${name} - ${err.message}`);
  }
};
const rpc = async (fn, args) => {
  const {data, error} = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data;
};
const expect = (condition, message) => {
  if (!condition) throw new Error(message);
};

console.log('Baza (funkcje SQL i tabele):');
await check('potoczna-potyczka: pp_get_questions("valhalla")', async () => {
  const rows = await rpc('pp_get_questions', {p_seed: 'valhalla'});
  expect(rows.length > 0, 'brak pytań');
  return `${rows.length} pytań, np. "${rows[0].description}"`;
});
await check('potoczna-potyczka: pp_get_questions("demo")', async () => {
  const rows = await rpc('pp_get_questions', {p_seed: 'demo'});
  expect(rows.length === 2, `oczekiwano 2 pytań, jest ${rows.length}`);
});
await check('mainstream: ms_get_riddles("valhalla", 6, [valhalla-2026])', async () => {
  const rows = await rpc('ms_get_riddles', {p_seed: 'valhalla', p_count: 6, p_themes: ['valhalla-2026']});
  expect(rows.length > 0, 'brak zagadek');
  return rows.map(r => r.answer).join(', ');
});
await check('hitman: hm_quests', async () => {
  const {data, error} = await supabase.from('hm_quests').select('description');
  if (error) throw new Error(error.message);
  expect(data.length > 0, 'brak zadań');
  return `${data.length} zadań`;
});
await check('bezpieczeństwo: klucz publishable nie może zmieniać pytań', async () => {
  const {error} = await supabase.from('pp_questions').insert({id: -1, description: 'test', answers: []});
  expect(error, 'zapis się udał - RLS nie działa!');
  return 'zapis odrzucony (tak ma być)';
});

console.log('Storage (bucket "games"):');
for (const path of [
  'mainstream/images/qr.png',
  'mainstream/sounds/jazz.mp3',
  'oszukac-przeznaiczenie/images/evil-ai.png',
  'oszukac-przeznaiczenie/sounds/background.mp3',
  'potoczna-potyczka/sounds/correct.mp3',
  'turbo/sounds/drum.mp3'
]) {
  await check(path, async () => {
    const response = await fetch(mediaUrl(path), {method: 'HEAD'});
    expect(response.ok, `HTTP ${response.status}`);
  });
}
await check('obrazek zagadki z bazy', async () => {
  const [riddle] = await rpc('ms_get_riddles', {p_seed: 'check', p_count: 1});
  const response = await fetch(mediaUrl(riddle.image_path), {method: 'HEAD'});
  expect(response.ok, `${riddle.image_path}: HTTP ${response.status}`);
  return riddle.image_path;
});

console.log('Edge Function:');
await check('oszukac-przeznaiczenie (Groq)', async () => {
  const {data, error} = await supabase.functions.invoke('oszukac-przeznaiczenie', {
    body: {action: 'scenario', history: [{role: 'user', content: 'scenario'}]}
  });
  if (error) throw new Error(`${error.message} (logi: Dashboard -> Edge Functions -> oszukac-przeznaiczenie -> Logs)`);
  return JSON.parse(data.content).scenario;
});

console.log(failed ? `\n${failed} test(ów) nie przeszło.` : '\nWszystko działa.');
process.exit(failed ? 1 : 0);

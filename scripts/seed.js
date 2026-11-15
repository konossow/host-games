// Jednorazowa migracja danych i mediów do Supabase. Można uruchamiać wielokrotnie (upsert).
//
//   npm run seed            -> dane (tabele) + media (Storage)
//   npm run seed -- --data  -> tylko dane
//   npm run seed -- --media -> tylko media
//
// Wymaga SUPABASE_SECRET_KEY w host-games/.env.local (patrz .env.local.example).
// Dane czyta z supabase/seed/*.json, a media z oryginalnych folderów gier (../band-spot, ../death-by-ai itd. - te foldery mają stare nazwy).
import fs from 'node:fs';
import path from 'node:path';
import {createClient} from '@supabase/supabase-js';
import {slug} from './slug.js';

const ROOT = path.resolve(import.meta.dirname, '..');   // host-games/
const SEED = path.join(ROOT, 'supabase/seed');
const GAMES = path.resolve(ROOT, '..');                  // folder z oryginalnymi projektami gier
const BUCKET = 'games';

const url = process.env.VITE_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !secretKey) {
  console.error('Brak VITE_SUPABASE_URL lub SUPABASE_SECRET_KEY (uzupełnij host-games/.env.local)');
  process.exit(1);
}
// klucz secret omija RLS - używać tylko lokalnie, nigdy w grach
const supabase = createClient(url, secretKey, {auth: {persistSession: false}});

const readJson = (file) => JSON.parse(fs.readFileSync(path.join(SEED, file), 'utf8'));
const csvToIds = (csv) => (csv ? csv.split(',').map(Number).filter(Number.isInteger) : []);

const upsert = async (table, rows, options = {}) => {
  const {error} = await supabase.from(table).upsert(rows, options);
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`  ${table}: ${rows.length} wierszy`);
};

// ---------------------------------------------------------------------------
// DANE
// ---------------------------------------------------------------------------
const seedData = async () => {
  console.log('Dane:');

  // potoczna potyczka - PL mają własne id, EN nie miały id, więc dostają 1000 + indeks
  const pl = readJson('pp_questions_pl.json').map(q => ({
    id: q.id, lang: 'pl', description: q.description, themes: q.themes ?? [], answers: q.answers
  }));
  const en = readJson('pp_questions_en.json').map((q, i) => ({
    id: 1000 + i, lang: 'en', description: q.description, themes: q.themes ?? [], answers: q.answers
  }));
  await upsert('pp_questions', [...pl, ...en]);

  // mainstream - lista przygotowana z old/.../riddles.json (id zachowane) + nowe obrazki z band-spot/public/images
  await upsert('ms_riddles', readJson('ms_riddles.json'));

  // hitman
  await upsert('hm_quests', readJson('hm_quests.json').map((description, i) => ({id: i + 1, description})));

  // seen_items - dawne players.json: {"id": "valhalla", "seen_questions": "1,2,3"}
  const seen = [
    ...readJson('pp_seen.json').flatMap(p => csvToIds(p.seen_questions)
      .map(item_id => ({game: 'potoczna-potyczka', seed: p.id.toLowerCase(), item_id}))),
    ...readJson('ms_seen.json').flatMap(p => csvToIds(p.seen_riddles)
      .map(item_id => ({game: 'mainstream', seed: p.id.toLowerCase(), item_id})))
  ];
  await upsert('seen_items', seen, {ignoreDuplicates: true});
};

// ---------------------------------------------------------------------------
// MEDIA
// ---------------------------------------------------------------------------
const CONTENT_TYPES = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4'};

const upload = async (file, storagePath) => {
  // do 3 prób - przy ~150 plikach zdarzają się pojedyncze błędy sieci ("fetch failed")
  for (let attempt = 1; ; attempt++) {
    const {error} = await supabase.storage.from(BUCKET).upload(storagePath, fs.readFileSync(file), {
      contentType: CONTENT_TYPES[path.extname(file).toLowerCase()],
      cacheControl: '31536000', // rok - media się nie zmieniają
      upsert: true
    });
    if (!error) return;
    if (attempt === 3) throw new Error(`${storagePath}: ${error.message}`);
  }
};

// wszystkie pliki z folderu (bez podfolderów) -> <prefix>/<nazwa pliku>
const uploadDir = async (dir, prefix) => {
  const files = fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir, f)).isFile());
  for (const f of files) {
    await upload(path.join(dir, f), `${prefix}/${f}`);
  }
  console.log(`  ${prefix}: ${files.length} plików`);
};

const seedMedia = async () => {
  console.log('Media:');
  const game = (...p) => path.join(GAMES, ...p);

  // mainstream: zdjęcia zagadek pod nazwami ASCII (ms_riddles.image_path), reszta bez zmian
  const riddles = readJson('ms_riddles.json');
  const imagesDir = game('band-spot/public/images');
  const sources = [
    ...fs.readdirSync(imagesDir).filter(f => f.endsWith('.png')).map(f => path.join(imagesDir, f)),
    ...fs.readdirSync(path.join(imagesDir, 'pl')).map(f => path.join(imagesDir, 'pl', f))
  ];
  for (const riddle of riddles) {
    const source = sources.find(s => `mainstream/riddles/${slug(path.basename(s, '.png'))}.png` === riddle.image_path);
    if (!source) throw new Error(`Brak obrazka dla zagadki ${riddle.answer}`);
    await upload(source, riddle.image_path);
  }
  console.log(`  mainstream/riddles: ${riddles.length} plików`);
  await upload(game('band-spot/public/qr.png'), 'mainstream/images/qr.png');
  await uploadDir(game('band-spot/public/sounds'), 'mainstream/sounds');

  await uploadDir(game('death-by-ai/public/images'), 'oszukac-przeznaiczenie/images');
  await uploadDir(game('death-by-ai/public/sounds'), 'oszukac-przeznaiczenie/sounds');

  await uploadDir(game('potoczna potyczka/public/sounds'), 'potoczna-potyczka/sounds');

  await uploadDir(game('host-games/old/packages/turbo/public/sounds'), 'turbo/sounds');
};

const args = process.argv.slice(2);
const all = !args.includes('--data') && !args.includes('--media');
if (all || args.includes('--data')) await seedData();
if (all || args.includes('--media')) await seedMedia();
console.log('Gotowe.');

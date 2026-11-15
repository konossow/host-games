# host-games

Monorepo z grami imprezowymi opartymi o [Playroom](https://joinplayroom.com).

- Każda gra to osobna aplikacja React. Buduje się do statycznego folderu `dist/`, który wrzucasz na Playroom.
- Wspólne dane, media i API są w [Supabase](https://supabase.com). Nie ma żadnego serwera, który trzeba uruchamiać lokalnie.

```
 przeglądarka gracza / hosta                    Supabase (projekt wcbvmtlwcfecvbcqkicw)
┌────────────────────────────┐                 ┌───────────────────────────────────────────┐
│ apps/<gra>  (React + Vite) │                 │ Database (Postgres)                       │
│        │                   │  klucz          │   tabele: pytania, zagadki, zadania,      │
│        ▼                   │  publishable    │           seen_items                      │
│ packages/shared            │ ──────────────▶ │   funkcje SQL: pp_get_questions, ...      │
│   (klient Supabase + API)  │                 │ Storage: bucket "games" (obrazki, dźwięki)│
└────────────────────────────┘                 │ Edge Function: oszukac-przeznaiczenie ────┼──▶ Groq (AI)
                                               └───────────────────────────────────────────┘
```

---

## 1. Gry

| Folder | Gra | Port w `dev` | Supabase |
|---|---|---|---|
| `apps/mainstream` | **.mainstream**: zgadywanie zespołów z obrazków | 3001 | zagadki z bazy, obrazki i dźwięki ze Storage |
| `apps/oszukac-przeznaiczenie` | **Oszukać PrzeznAIczenie**: AI wymyśla zagrożenie i ocenia, czy przeżyjesz | 3002 | Edge Function (Groq), obrazki i dźwięki |
| `apps/hitman` | **Hitman**: każdy ma cel i zadanie do wykonania | 3003 | zadania z bazy |
| `apps/potoczna-potyczka` | **Potoczna potyczka**: familiada | 3004 | pytania z bazy, dźwięki |
| `apps/turbo` | **Turbo**: licznik z dźwiękami (bez Playroom) | 3005 | dźwięki |

Oryginalne projekty (`../band-spot`, `../death-by-ai`, `../hitman`, `../potoczna potyczka`) zostały nietknięte.
`scripts/seed.js` czyta z nich media, dlatego mają tam jeszcze stare nazwy.

---

## 2. Struktura projektu

```
host-games/
├─ package.json             skrypty npm (dev/build każdej gry, seed, check) + workspaces
├─ turbo.json               konfiguracja Turborepo (build, dev, check-types)
├─ tsconfig.base.json       wspólne ustawienia TypeScript (każda gra je rozszerza)
├─ .env                     publiczny URL i klucz publishable Supabase - wspólne dla wszystkich gier
├─ .env.local               (NIE w repo) SUPABASE_SECRET_KEY - tylko dla scripts/seed.js
├─ .env.local.example       wzór .env.local
│
├─ apps/                    gry - każda to osobna aplikacja Vite
│  └─ <gra>/
│     ├─ index.html         punkt wejścia
│     ├─ package.json       nazwa @host/<gra>, zależności gry
│     ├─ vite.config.ts     port dev, base './' (względne ścieżki), envDir '../..' (czyta wspólny .env)
│     ├─ public/            tylko favicon (reszta mediów jest w Supabase Storage)
│     ├─ src/assets/fonts/  fonty (zostały w aplikacji, bo są małe i potrzebne od razu)
│     ├─ src/               kod gry
│     └─ dist/              wynik `npm run build:<gra>` - TO wrzucasz na Playroom
│
├─ packages/shared/         @host/shared - jedyne miejsce, które rozmawia z Supabase
│  └─ src/
│     ├─ supabase.ts        klient Supabase + mediaUrl() (publiczny URL pliku ze Storage)
│     ├─ index.ts           to, co gry importują z "@host/shared"
│     └─ api/
│        ├─ potocznaPotyczka.ts   getQuestions()  -> rpc pp_get_questions
│        ├─ mainstream.ts         getRiddles()    -> rpc ms_get_riddles
│        ├─ hitman.ts             getQuests()     -> select z hm_quests
│        ├─ oszukacPrzeznaiczenie.ts  askAi()     -> Edge Function oszukac-przeznaiczenie
│        └─ seen.ts               markSeen()      -> rpc mark_seen (wspólne dla potyczki i mainstream)
│
├─ supabase/
│  ├─ config.toml           konfiguracja Supabase CLI (m.in. verify_jwt = false dla funkcji)
│  ├─ migrations/           historia zmian w bazie (SQL), w kolejności dat w nazwie
│  │  ├─ 20261021095824_init_games.sql     tabele, RLS, funkcje SQL, bucket "games"
│  │  └─ 20261021140000_rename_games.sql   band-spot -> mainstream (bs_ -> ms_)
│  ├─ functions/
│  │  └─ oszukac-przeznaiczenie/
│  │     ├─ index.ts        Edge Function: przyjmuje historię rozmowy, pyta Groq, zwraca odpowiedź
│  │     └─ modelfile.ts    prompt systemowy Mistrza Gry
│  └─ seed/                 dane źródłowe (JSON) - z nich wypełniono tabele
│     ├─ pp_questions_pl.json / pp_questions_en.json   pytania potyczki
│     ├─ pp_seen.json       które pytania widział który seed (dawne players.json)
│     ├─ ms_riddles.json    zagadki mainstream (odpowiedź, motywy, ścieżka obrazka)
│     ├─ ms_seen.json       które zagadki widział który seed
│     └─ hm_quests.json     zadania hitmana
│
├─ scripts/
│  ├─ seed.js               wgrywa supabase/seed/*.json do tabel i media do Storage (npm run seed)
│  ├─ check.js              sprawdza, czy wszystko w Supabase działa (npm run check)
│  └─ slug.js               zamiana nazw plików na ASCII ("Łzy.png" -> "lzy.png")
│
├─ old/, my-turborepo/      poprzednie próby; nic z nich nie korzysta
                            (seed.js czyta tylko dźwięki turbo z old/packages/turbo/public/sounds)
```

**Prefiksy w bazie** mówią, do której gry należy tabela lub funkcja:
`pp_` = potoczna potyczka, `ms_` = mainstream, `hm_` = hitman.

---

## 3. Komendy

Wszystkie uruchamiasz w folderze `host-games/`.

```bash
npm install                            # raz, po pobraniu projektu
npm run dev:mainstream                 # serwer deweloperski jednej gry (http://localhost:3001)
npm run dev:oszukac-przeznaiczenie     # ... :3002
npm run dev:hitman                     # ... :3003
npm run dev:potoczna-potyczka          # ... :3004
npm run dev:turbo                      # ... :3005

npm run build:mainstream               # build jednej gry -> apps/mainstream/dist
npm run build                          # build wszystkich gier
npm run check-types                    # sprawdzenie typów TypeScript we wszystkich pakietach

npm run check                          # test Supabase: baza, Storage, Edge Function (nic nie zapisuje)
npm run seed                           # ponowne wgranie danych + mediów (wymaga .env.local)
npm run seed -- --data                 #   tylko dane
npm run seed -- --media                #   tylko media
npm run deploy:functions               # wdrożenie Edge Function (wymaga `npx supabase login` w zwykłym terminalu)
```

**Publikacja na Playroom:** wrzucasz zawartość `apps/<gra>/dist` (`index.html` + `assets/`), tak jak wcześniej
folder `build/` z CRA. Ścieżki są względne, więc build działa pod dowolnym adresem.

---

## 4. Supabase od podstaw

### Czym jest Supabase w tym projekcie

| Pojęcie | Co to jest | U nas |
|---|---|---|
| **Projekt** | jedna „instancja” Supabase: baza + storage + funkcje, z własnym URL | `wcbvmtlwcfecvbcqkicw` |
| **Database** | zwykła baza PostgreSQL | tabele z pytaniami, zagadkami, zadaniami i `seen_items` |
| **Data API (REST)** | Supabase automatycznie wystawia tabele i funkcje SQL jako HTTP API; `supabase-js` z tego korzysta | `supabase.rpc('pp_get_questions', ...)`, `supabase.from('hm_quests').select()` |
| **Funkcja SQL (RPC)** | logika zapisana w bazie, wywoływana przez API | losowanie pytań i zagadek, zapis „obejrzanych” |
| **RLS** (Row Level Security) | reguły w bazie: kto może czytać/zapisywać które wiersze | każdy może czytać treści; zapisać można tylko „obejrzane” |
| **Storage** | przechowywanie plików (jak dysk w chmurze) w „bucketach” | publiczny bucket `games` z obrazkami i dźwiękami |
| **Edge Function** | mały serwer (TypeScript/Deno) uruchamiany przez Supabase na żądanie | `oszukac-przeznaiczenie`: pośrednik do Groq, trzyma klucz AI w tajemnicy |
| **Secrets** | zmienne środowiskowe dla Edge Functions, niewidoczne dla graczy | `GROQ_API_KEY`, `GROQ_MODEL` |
| **Migracja** | plik SQL ze zmianą struktury bazy; zapisujemy je, żeby wiedzieć, jak baza powstała | `supabase/migrations/*.sql` |

### Klucze API: który do czego

| Klucz | Gdzie jest | Kto może go znać | Co pozwala |
|---|---|---|---|
| **publishable** (`sb_publishable_...`) | `.env` → bundel każdej gry | każdy (jest jawny w przeglądarce) | tylko to, na co pozwala RLS: czytanie treści, dopisywanie „obejrzanych” |
| **secret** (`sb_secret_...`) | `.env.local` (nie w repo) | tylko Ty | wszystko, omija RLS; używa go wyłącznie `npm run seed` |
| **Groq** (`gsk_...`) | sekret Edge Function `GROQ_API_KEY` | tylko Supabase | wywołania modelu AI |

> Nigdy nie dodawaj prefiksu `VITE_` do klucza secret. Vite wstawia zmienne `VITE_*` do kodu gry, więc klucz trafiłby do każdego gracza.

### Linki: Dashboard (panel w przeglądarce)

| Co | Link |
|---|---|
| Strona główna projektu | https://supabase.com/dashboard/project/wcbvmtlwcfecvbcqkicw |
| **Table Editor**: podgląd i edycja danych jak w Excelu | https://supabase.com/dashboard/project/wcbvmtlwcfecvbcqkicw/editor |
| **SQL Editor**: wykonywanie zapytań SQL | https://supabase.com/dashboard/project/wcbvmtlwcfecvbcqkicw/sql/new |
| Funkcje SQL (`pp_get_questions` itd.) | https://supabase.com/dashboard/project/wcbvmtlwcfecvbcqkicw/database/functions |
| Polityki RLS | https://supabase.com/dashboard/project/wcbvmtlwcfecvbcqkicw/auth/policies |
| Historia migracji | https://supabase.com/dashboard/project/wcbvmtlwcfecvbcqkicw/database/migrations |
| **Storage**: bucket `games` z mediami | https://supabase.com/dashboard/project/wcbvmtlwcfecvbcqkicw/storage/buckets/games |
| **Edge Functions** | https://supabase.com/dashboard/project/wcbvmtlwcfecvbcqkicw/functions |
| Logi funkcji `oszukac-przeznaiczenie` | https://supabase.com/dashboard/project/wcbvmtlwcfecvbcqkicw/functions/oszukac-przeznaiczenie/logs |
| Sekrety Edge Functions | https://supabase.com/dashboard/project/wcbvmtlwcfecvbcqkicw/functions/secrets |
| Klucze API | https://supabase.com/dashboard/project/wcbvmtlwcfecvbcqkicw/settings/api-keys |
| Doradca bezpieczeństwa (wykrywa błędy w RLS itp.) | https://supabase.com/dashboard/project/wcbvmtlwcfecvbcqkicw/advisors/security |
| Wszystkie logi | https://supabase.com/dashboard/project/wcbvmtlwcfecvbcqkicw/logs/explorer |
| Klucze Groq | https://console.groq.com/keys |

### Linki: adresy, z których korzystają gry

- API (baza): `https://wcbvmtlwcfecvbcqkicw.supabase.co/rest/v1/`
- Edge Function: `https://wcbvmtlwcfecvbcqkicw.supabase.co/functions/v1/oszukac-przeznaiczenie`
- Pliki: `https://wcbvmtlwcfecvbcqkicw.supabase.co/storage/v1/object/public/games/<ścieżka>`, np.
  - https://wcbvmtlwcfecvbcqkicw.supabase.co/storage/v1/object/public/games/mainstream/images/qr.png
  - https://wcbvmtlwcfecvbcqkicw.supabase.co/storage/v1/object/public/games/oszukac-przeznaiczenie/images/evil-ai.png
  - https://wcbvmtlwcfecvbcqkicw.supabase.co/storage/v1/object/public/games/potoczna-potyczka/sounds/round.mp3

### Dane: tabele

| Tabela | Zawartość | Kolumny |
|---|---|---|
| `pp_questions` | 373 pytania potyczki (333 PL, 40 EN z id od 1000) | `id`, `lang` (pl/en), `description`, `themes[]`, `answers` (JSON) |
| `ms_riddles` | 133 zagadki mainstream | `id`, `answer`, `themes[]` (np. `pl`, `valhalla-2026`), `image_path` (ścieżka w Storage) |
| `hm_quests` | 54 zadania hitmana | `id`, `description` |
| `seen_items` | co który „seed” już widział (zamiast dawnych `players.json`) | `game`, `seed`, `item_id`, `seen_at` |

**Seed** to nazwa „konta” gry, np. `valhalla`. Gra losuje tylko pozycje, których ten seed jeszcze nie widział.
Seed `demo` zawsze dostaje te same pozycje testowe i niczego nie zużywa.

### Dane: funkcje SQL (API gier)

| Funkcja | Wywołuje | Co robi |
|---|---|---|
| `pp_get_questions(seed, mode, count, themes, lang)` | potoczna-potyczka | losowe, jeszcze niewidziane pytania + 50% zapasu na przelosowanie |
| `ms_get_riddles(seed, count, themes)` | mainstream (host po zalogowaniu) | losowe niewidziane zagadki; bez motywów pomija polskie (`pl`) i w razie braku dopełnia widzianymi |
| `mark_seen(game, seed, item_ids)` | potyczka i mainstream („Koniec gry”) | dopisuje pozycje do `seen_items` |

### Media: Storage, bucket `games`

```
games/
├─ mainstream/riddles/<zespół>.png      133 obrazki zagadek (nazwy ASCII, ścieżka zapisana w ms_riddles.image_path)
├─ mainstream/images/qr.png
├─ mainstream/sounds/                   jazz.mp3, elevator.mp3
├─ oszukac-przeznaiczenie/images/       evil-ai.png, evil-ai.mp4, live.png, rip.png, qr.png
├─ oszukac-przeznaiczenie/sounds/       background.mp3, scenario.mp3, live.mp3, rip.mp3
├─ potoczna-potyczka/sounds/            correct, error, fuse, mlg-airhorn, round (.mp3)
└─ turbo/sounds/                        banger, clock, drum, heartbeat (.mp3)
```

W kodzie gry: `mediaUrl('mainstream/sounds/jazz.mp3')` zwraca pełny publiczny URL.

---

## 5. Jak testować

### Krok 1: Supabase działa?

```bash
npm run check
```

Skrypt używa tego samego klucza co gry. Sprawdza każdą funkcję SQL, tabelę hitmana, to, że RLS blokuje zapis,
przykładowe pliki ze Storage i jedno wywołanie AI. Na końcu wypisuje `Wszystko działa.` albo listę błędów.

### Krok 2: Gra działa w przeglądarce?

```bash
npm run dev:potoczna-potyczka     # i otwórz http://localhost:3004
```

Playroom traktuje każdą kartę przeglądarki jak osobne urządzenie. Gry mają stały kod pokoju (`roomCode`
w `src/index.tsx`), więc kolejne karty z tym samym adresem dołączają do tego samego pokoju:

- **pierwsza karta**, która otworzy pokój, jest **hostem**,
- kolejne karty to **gracze** (w potyczce i mainstream: ekran „stream”),
- osobne okno incognito pozwala zagrać jako inny gracz z innym profilem.

Co sprawdzić w każdej grze:

| Gra | Jak wejść jako host | Co sprawdzić |
|---|---|---|
| potoczna-potyczka | pierwsza karta, hasło `2274` | wybierz seed `demo` i zobacz, czy pytania się ładują; dźwięki przy odpowiedziach |
| mainstream | pierwsza karta, hasło `2274` | host wypisuje 6 wylosowanych zespołów; w drugiej karcie widać obrazki, QR i muzykę |
| oszukac-przeznaiczenie | raz w konsoli (F12): `localStorage.setItem('host', '1')`, odśwież | scenariusz od AI, potem gracz wpisuje strategię i dostaje ocenę |
| hitman | brak hosta: zarejestruj kilku graczy (kilka kart) i wystartuj w lobby | każdy gracz ma cel i zadanie; „Wymień zadanie” losuje nowe |
| turbo | — | dźwięki się odtwarzają |

> Uwaga: potyczka i mainstream po zakończeniu gry zapisują wylosowane pozycje jako „obejrzane” dla danego seeda.
> Do testów używaj seeda `demo` albo np. `test`, żeby nie zużywać pytań seeda `valhalla`.
> Wpisy testowe usuniesz w SQL Editorze: `delete from seen_items where seed = 'test';`

**Gdy coś nie działa:** otwórz w przeglądarce F12:
- **Console** pokazuje błędy `Failed to get riddles`, `Failed to mark seen` itp. z treścią błędu z Supabase,
- **Network** pokazuje zapytania do `supabase.co` i ich odpowiedzi.

### Krok 3: build przed publikacją

```bash
npm run check-types && npm run build:mainstream
npx vite preview apps/mainstream --port 4001     # podgląd gotowego dist/ pod http://localhost:4001
```

### Przydatne zapytania (SQL Editor)

```sql
-- ile jest danych
select (select count(*) from pp_questions) pytania, (select count(*) from ms_riddles) zagadki,
       (select count(*) from hm_quests) zadania;

-- co już widział seed "valhalla"
select game, count(*) from seen_items where seed = 'valhalla' group by game;

-- "zresetuj" seed - wszystko znów będzie nowe
delete from seen_items where seed = 'valhalla' and game = 'mainstream';

-- wywołaj funkcję tak jak gra
select * from ms_get_riddles('valhalla', 6, '{valhalla-2026}');
select id, description from pp_get_questions('demo');
```

---

## 6. Typowe zmiany

- **Nowe pytanie, zagadka albo zadanie:** dopisz w Table Editorze (najprościej) albo w JSON-ie w `supabase/seed/`
  i uruchom `npm run seed -- --data`. Uwaga: seed nadpisuje wiersze o tych samych `id`, więc zmiany zrobione
  tylko w Dashboardzie warto przenieść też do JSON-a.
- **Nowa zagadka z obrazkiem:** wgraj obrazek do Storage (`games/mainstream/riddles/`) i dodaj wiersz w `ms_riddles`
  z `image_path` = `mainstream/riddles/<plik>.png`.
- **Inne zespoły na quiz w mainstream:** `apps/mainstream/src/hooks/useConfig.ts` (`SEED_NAME`, `THEMES`, liczba zagadek).
- **Zmiana struktury bazy:** zapisz SQL jako nowy plik w `supabase/migrations/` (nazwa `RRRRMMDDGGMMSS_opis.sql`)
  i wykonaj go w SQL Editorze.
- **Zmiana promptu AI:** `supabase/functions/oszukac-przeznaiczenie/modelfile.ts`, potem `npm run deploy:functions`.
- **Inny model AI:** zmień sekret `GROQ_MODEL` (lista: https://console.groq.com/docs/models), bez wdrażania.

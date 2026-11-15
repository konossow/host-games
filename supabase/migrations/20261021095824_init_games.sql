-- =============================================================================
-- Wspólna baza dla gier host-games.
-- Prefiksy tabel = gra:  pp_ = potoczna potyczka,  bs_ = band-spot,  hm_ = hitman
-- Gry łączą się kluczem publishable (rola "anon"), więc wszystko jest pod RLS:
--   * treści gier (pytania, zagadki, zadania) -> tylko odczyt
--   * seen_items (co dany seed już widział)  -> odczyt + dopisywanie
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Potoczna potyczka: pytania (dawniej server/database/questions*.json)
-- ---------------------------------------------------------------------------
create table public.pp_questions (
  id          integer primary key,          -- PL: oryginalne id z JSON, EN: 1000 + indeks
  lang        text    not null default 'pl' check (lang in ('pl', 'en')),
  description text    not null,
  themes      text[]  not null default '{}', -- np. {wedding,favourite}
  answers     jsonb   not null               -- [{ "description": "ZEBRA", "points": 28 }, ...]
);

-- ---------------------------------------------------------------------------
-- Band-spot: zagadki (dawniej lista w useRiddles.ts + old/.../riddles.json)
-- ---------------------------------------------------------------------------
create table public.bs_riddles (
  id         integer primary key,
  answer     text    not null,               -- nazwa zespołu wyświetlana graczom
  themes     text[]  not null default '{}',  -- np. {pl} albo {valhalla-2026}
  image_path text    not null                -- ścieżka w buckecie "games"
);

-- ---------------------------------------------------------------------------
-- Hitman: zadania (dawniej tablica allQuests w useQuests.ts)
-- ---------------------------------------------------------------------------
create table public.hm_quests (
  id          integer primary key,
  description text    not null unique
);

-- ---------------------------------------------------------------------------
-- Wspólne dla gier: które pytania/zagadki dany seed (np. "valhalla") już widział.
-- Zastępuje pliki players.json (pole seen_questions / seen_riddles).
-- ---------------------------------------------------------------------------
create table public.seen_items (
  game    text        not null check (game in ('potoczna-potyczka', 'band-spot')),
  seed    text        not null check (seed = lower(seed) and seed <> ''),
  item_id integer     not null,
  seen_at timestamptz not null default now(),
  primary key (game, seed, item_id)
);

-- ---------------------------------------------------------------------------
-- Dostęp (Data API + RLS)
-- ---------------------------------------------------------------------------
alter table public.pp_questions enable row level security;
alter table public.bs_riddles   enable row level security;
alter table public.hm_quests    enable row level security;
alter table public.seen_items   enable row level security;

grant select         on public.pp_questions, public.bs_riddles, public.hm_quests to anon, authenticated;
grant select, insert on public.seen_items                                       to anon, authenticated;

create policy "content is public" on public.pp_questions for select to anon, authenticated using (true);
create policy "content is public" on public.bs_riddles   for select to anon, authenticated using (true);
create policy "content is public" on public.hm_quests    for select to anon, authenticated using (true);
create policy "seen is public"    on public.seen_items   for select to anon, authenticated using (true);
create policy "seen can be added" on public.seen_items   for insert to anon, authenticated with check (true);

-- ---------------------------------------------------------------------------
-- API (wywoływane z gier przez supabase.rpc(...))
-- Wszystkie funkcje są SECURITY INVOKER, czyli podlegają tym samym regułom RLS co gra.
-- ---------------------------------------------------------------------------

-- Odpowiednik dawnego POST /questions (server/questions/getQuestions.ts)
create function public.pp_get_questions(
  p_seed   text    default null,
  p_mode   text    default 'classic',
  p_count  integer default 10,
  p_themes text[]  default '{}',
  p_lang   text    default 'pl'
)
returns setof public.pp_questions
language sql
stable
set search_path = ''
as $$
  -- seed "demo" zawsze dostaje te same 2 pytania (11: czego życzymy, 111: co lub kto spełnia życzenia)
  select q.* from public.pp_questions q
  where lower(p_seed) = 'demo' and q.id in (11, 111)
  union all
  select * from (
    select q.* from public.pp_questions q
    where coalesce(lower(p_seed), '') <> 'demo'
      and q.lang = p_lang
      and (cardinality(p_themes) = 0 or q.themes && p_themes)
      and (p_mode <> 'quiz' or jsonb_array_length(q.answers) = 6)  -- quiz: tylko pytania z 6 odpowiedziami
      and not exists (
        select 1 from public.seen_items s
        where s.game = 'potoczna-potyczka' and s.seed = lower(p_seed) and s.item_id = q.id
      )
    order by random()
    limit p_count + ceil(p_count / 2.0)::integer  -- +50% pytań na "przelosowanie"
  ) fresh;
$$;

-- Odpowiednik dawnego POST /mainstream/riddles (old/packages/api/mainstream/riddles/getRiddles.ts)
create function public.bs_get_riddles(
  p_seed   text    default null,
  p_count  integer default 6,
  p_themes text[]  default '{}'
)
returns setof public.bs_riddles
language plpgsql
stable
set search_path = ''
as $$
declare
  v_found integer;
begin
  if lower(p_seed) = 'demo' then
    return query select r.* from public.bs_riddles r where r.id in (13, 22);
    return;
  end if;

  -- najpierw zagadki, których seed jeszcze nie widział
  -- bez wybranych motywów: wszystko poza polskimi zespołami (motyw "pl")
  return query
    select r.* from public.bs_riddles r
    where (case when cardinality(p_themes) = 0 then not ('pl' = any(r.themes)) else r.themes && p_themes end)
      and not exists (
        select 1 from public.seen_items s
        where s.game = 'band-spot' and s.seed = lower(p_seed) and s.item_id = r.id
      )
    order by random()
    limit p_count;

  get diagnostics v_found = row_count;

  -- za mało nowych i bez motywów -> dopełnij losowymi już widzianymi
  if v_found < p_count and cardinality(p_themes) = 0 then
    return query
      select r.* from public.bs_riddles r
      where not ('pl' = any(r.themes))
        and exists (
          select 1 from public.seen_items s
          where s.game = 'band-spot' and s.seed = lower(p_seed) and s.item_id = r.id
        )
      order by random()
      limit p_count - v_found;
  end if;
end;
$$;

-- Odpowiednik dawnego POST /players: zapisuje, że seed widział podane pozycje
create function public.mark_seen(p_game text, p_seed text, p_item_ids integer[])
returns void
language sql
volatile
set search_path = ''
as $$
  insert into public.seen_items (game, seed, item_id)
  select p_game, lower(p_seed), unnest(p_item_ids)
  where coalesce(p_seed, '') <> ''
  on conflict do nothing;
$$;

-- ---------------------------------------------------------------------------
-- Storage: publiczny bucket na media gier (obrazki, dźwięki, wideo).
-- Pliki są czytane przez publiczny URL, wgrywane tylko skryptem z kluczem secret.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('games', 'games', true)
on conflict (id) do nothing;

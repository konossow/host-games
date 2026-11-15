-- Zmiana nazw gier: band-spot -> mainstream, death-by-ai -> oszukac-przeznaiczenie
-- Prefiks tabel mainstream: bs_ -> ms_
-- (death-by-ai nie ma tabel - używa tylko Edge Function i Storage)

-- tabela zagadek (polityki RLS i uprawnienia przechodzą razem z tabelą)
alter table public.bs_riddles rename to ms_riddles;
alter index public.bs_riddles_pkey rename to ms_riddles_pkey;

-- obrazki zagadek leżą teraz w Storage pod mainstream/riddles/...
update public.ms_riddles set image_path = replace(image_path, 'band-spot/', 'mainstream/');

-- nazwa gry w seen_items
alter table public.seen_items drop constraint seen_items_game_check;
update public.seen_items set game = 'mainstream' where game = 'band-spot';
alter table public.seen_items add constraint seen_items_game_check
  check (game in ('potoczna-potyczka', 'mainstream'));

-- funkcja losująca zagadki: nowa nazwa i nowa nazwa gry w seen_items
alter function public.bs_get_riddles(text, integer, text[]) rename to ms_get_riddles;

create or replace function public.ms_get_riddles(
  p_seed   text    default null,
  p_count  integer default 6,
  p_themes text[]  default '{}'
)
returns setof public.ms_riddles
language plpgsql
stable
set search_path = ''
as $$
declare
  v_found integer;
begin
  if lower(p_seed) = 'demo' then
    return query select r.* from public.ms_riddles r where r.id in (13, 22);
    return;
  end if;

  -- najpierw zagadki, których seed jeszcze nie widział
  -- bez wybranych motywów: wszystko poza polskimi zespołami (motyw "pl")
  return query
    select r.* from public.ms_riddles r
    where (case when cardinality(p_themes) = 0 then not ('pl' = any(r.themes)) else r.themes && p_themes end)
      and not exists (
        select 1 from public.seen_items s
        where s.game = 'mainstream' and s.seed = lower(p_seed) and s.item_id = r.id
      )
    order by random()
    limit p_count;

  get diagnostics v_found = row_count;

  -- za mało nowych i bez motywów -> dopełnij losowymi już widzianymi
  if v_found < p_count and cardinality(p_themes) = 0 then
    return query
      select r.* from public.ms_riddles r
      where not ('pl' = any(r.themes))
        and exists (
          select 1 from public.seen_items s
          where s.game = 'mainstream' and s.seed = lower(p_seed) and s.item_id = r.id
        )
      order by random()
      limit p_count - v_found;
  end if;
end;
$$;

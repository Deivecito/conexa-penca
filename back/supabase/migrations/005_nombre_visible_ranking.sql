-- Agregar columna nombre_visible a participantes
alter table public.participantes
  add column if not exists nombre_visible text;

-- Actualizar ranking_view para mostrar nickname en vez de nombre real
drop view if exists public.ranking_view;

create view public.ranking_view as
  select
    row_number() over (order by created_at asc) as posicion,
    coalesce(nombre_visible, split_part(nombre_completo, ' ', 1)) as nombre_visible,
    procedencia,
    0 as puntos,
    created_at
  from public.participantes
  where evento = 'mundial_2026'
  order by puntos desc, created_at asc;

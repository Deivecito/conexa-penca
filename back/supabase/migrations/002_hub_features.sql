-- ============================================================
-- Migración 002: Hub features
-- Agrega avatar_url a participantes y crea vista de ranking
-- ============================================================

-- Avatar en participantes
alter table public.participantes
  add column if not exists avatar_url text;

-- ============================================================
-- Storage bucket para avatares
-- Ejecutar en Supabase Dashboard > Storage > New bucket
-- Nombre: avatares, Public: true
-- ============================================================

-- ============================================================
-- Vista de ranking (cuando se agreguen puntos)
-- Por ahora ordena por fecha de registro
-- ============================================================
create or replace view public.ranking_view as
  select
    row_number() over (order by created_at asc) as posicion,
    nombre_completo,
    procedencia,
    0 as puntos,
    created_at
  from public.participantes
  where evento = 'mundial_2026'
  order by puntos desc, created_at asc;

-- Política RLS para que usuarios autenticados vean el ranking
create policy "Ranking público para autenticados"
  on public.participantes
  for select
  to authenticated
  using (true);

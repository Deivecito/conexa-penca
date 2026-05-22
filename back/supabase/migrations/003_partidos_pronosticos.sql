-- ============================================================
-- Migración 003: Pronósticos
-- Los partidos vienen de football-data.org (API externa).
-- Solo guardamos el pronóstico del usuario con el ID del partido.
-- ============================================================

create table public.pronosticos (
  id              uuid        default gen_random_uuid() primary key,
  correo          text        not null,
  match_id        integer     not null,   -- ID del partido en football-data.org
  goles_local     integer     not null check (goles_local >= 0),
  goles_visitante integer     not null check (goles_visitante >= 0),
  puntos          integer,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(correo, match_id)
);

-- RLS
alter table public.pronosticos enable row level security;

create policy "Ver propios pronósticos"
  on public.pronosticos for select to authenticated
  using (correo = (auth.jwt() ->> 'email'));

create policy "Insertar propios pronósticos"
  on public.pronosticos for insert to authenticated
  with check (correo = (auth.jwt() ->> 'email'));

create policy "Actualizar propios pronósticos"
  on public.pronosticos for update to authenticated
  using (correo = (auth.jwt() ->> 'email'));

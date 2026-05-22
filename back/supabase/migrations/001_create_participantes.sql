-- ============================================================
-- Tabla: participantes
-- Descripción: Registros de participantes para la Penca Conexa
-- ============================================================

create table if not exists public.participantes (
  id              uuid          default gen_random_uuid() primary key,
  created_at      timestamptz   default now() not null,
  nombre_completo text          not null check (length(nombre_completo) >= 3),
  telefono        text          not null check (length(telefono) >= 7),
  procedencia     text          not null check (length(procedencia) >= 2),
  correo          text          not null check (correo ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  evento          text          not null default 'mundial_2026'
);

-- Índice único en correo para evitar duplicados
create unique index if not exists participantes_correo_unique
  on public.participantes (lower(correo));

-- Índice para filtros por evento
create index if not exists participantes_evento_idx
  on public.participantes (evento);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table public.participantes enable row level security;

-- Política: cualquiera puede insertar (registro público)
create policy "Inserción pública"
  on public.participantes
  for insert
  to anon, authenticated
  with check (true);

-- Política: solo usuarios autenticados pueden leer
create policy "Lectura solo admin"
  on public.participantes
  for select
  to authenticated
  using (true);

-- Política: solo service_role puede actualizar/eliminar
-- (no se expone al frontend, solo para operaciones administrativas via backend)

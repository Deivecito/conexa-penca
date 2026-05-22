-- Columna de puntos totales en participantes (actualizada por el cron)
ALTER TABLE public.participantes
  ADD COLUMN IF NOT EXISTS puntos_total integer NOT NULL DEFAULT 0;

-- Ranking view actualizada: lee puntos_total directamente (sin join a pronosticos)
DROP VIEW IF EXISTS public.ranking_view;

CREATE VIEW public.ranking_view AS
  SELECT
    row_number() OVER (ORDER BY puntos_total DESC, created_at ASC) AS posicion,
    coalesce(nombre_visible, split_part(nombre_completo, ' ', 1))   AS nombre_visible,
    procedencia,
    puntos_total AS puntos,
    created_at
  FROM public.participantes
  WHERE evento = 'mundial_2026';

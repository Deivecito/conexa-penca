import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { normalizeMatch } from '@/lib/football-api'

function resultado(local: number, visitante: number): 'L' | 'V' | 'E' {
  if (local > visitante) return 'L'
  if (local < visitante) return 'V'
  return 'E'
}

function calcularPuntos(pL: number, pV: number, rL: number, rV: number): number {
  if (pL === rL && pV === rV) return 3
  if (resultado(pL, pV) === resultado(rL, rV)) return 1
  return 0
}

export async function GET(req: NextRequest) {
  // Auth: Vercel cron secret OR usuario admin
  const authHeader = req.headers.get('authorization')
  const isCron = !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`

  if (!isCron) {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
  }

  const admin = createAdminSupabaseClient()

  // 1. Traer partidos finalizados con resultado real
  const apiRes = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
    headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY! },
    cache: 'no-store',
  })
  if (!apiRes.ok) {
    return NextResponse.json({ error: 'Error al obtener partidos' }, { status: 502 })
  }
  const apiData = await apiRes.json()
  const finalizados = (apiData.matches ?? [])
    .map(normalizeMatch)
    .filter((p: ReturnType<typeof normalizeMatch>) =>
      p.estado === 'finalizado' &&
      p.goles_local != null &&
      p.goles_visitante != null
    )

  if (finalizados.length === 0) {
    return NextResponse.json({ scored: 0, message: 'No hay partidos finalizados aún' })
  }

  const matchIds = finalizados.map((p: ReturnType<typeof normalizeMatch>) => p.id)

  // 2. Traer pronósticos sin puntuar de esos partidos
  const { data: pronosticos, error: pronError } = await admin
    .from('pronosticos')
    .select('id, correo, match_id, goles_local, goles_visitante')
    .in('match_id', matchIds)
    .is('puntos', null)

  if (pronError) {
    return NextResponse.json({ error: pronError.message }, { status: 500 })
  }

  // 3. Calcular y guardar puntos por pronóstico
  let scored = 0
  const correosAfectados = new Set<string>()

  for (const pron of pronosticos ?? []) {
    const partido = finalizados.find((p: ReturnType<typeof normalizeMatch>) => p.id === pron.match_id)
    if (!partido) continue

    const puntos = calcularPuntos(
      pron.goles_local, pron.goles_visitante,
      partido.goles_local!, partido.goles_visitante!
    )

    await admin.from('pronosticos').update({ puntos }).eq('id', pron.id)
    correosAfectados.add(pron.correo)
    scored++
  }

  // 4. Recalcular puntos_total para cada participante afectado
  for (const correo of correosAfectados) {
    const { data: prons } = await admin
      .from('pronosticos')
      .select('puntos')
      .eq('correo', correo)
      .not('puntos', 'is', null)

    const total = (prons ?? []).reduce((sum, p) => sum + (p.puntos ?? 0), 0)
    await admin.from('participantes').update({ puntos_total: total }).eq('correo', correo)
  }

  return NextResponse.json({
    scored,
    participantes_actualizados: correosAfectados.size,
    message: `${scored} pronósticos puntuados, ${correosAfectados.size} participantes actualizados`,
  })
}

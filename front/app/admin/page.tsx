import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { normalizeMatch } from '@/lib/football-api'
import AdminHeader from '@/components/AdminHeader'
import AdminClient from '@/components/AdminClient'
import type { Participante } from '@/types'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')
  if (user.app_metadata?.role !== 'admin') redirect('/hub')

  const admin = createAdminSupabaseClient()

  const [
    { data: participantes },
    { data: pronosticos },
    partidosData,
  ] = await Promise.all([
    admin.from('participantes').select('*').order('created_at', { ascending: false }),
    admin.from('pronosticos').select('correo,match_id,goles_local,goles_visitante,puntos'),
    fetch('https://api.football-data.org/v4/competitions/WC/matches', {
      headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY! },
      next: { revalidate: 120 },
    }).then(r => r.json()).catch(() => ({ matches: [] })),
  ])

  const partidos = (partidosData.matches ?? []).map(normalizeMatch)

  const pronCountMap: Record<string, number> = {}
  for (const p of pronosticos ?? []) {
    pronCountMap[p.correo] = (pronCountMap[p.correo] ?? 0) + 1
  }

  const participantesConStats = (participantes ?? []).map(p => ({
    ...p,
    num_pronosticos: pronCountMap[p.correo] ?? 0,
  }))

  return (
    <div className="min-h-screen bg-gray-950">
      <AdminHeader userEmail={user.email ?? ''} />
      <AdminClient
        participantes={participantesConStats as (Participante & { num_pronosticos: number })[]}
        pronosticos={pronosticos ?? []}
        partidos={partidos}
      />
    </div>
  )
}

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import HubClient from '@/components/HubClient'

export default async function HubPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: participante } = await supabase
    .from('participantes')
    .select('nombre_completo, procedencia, avatar_url, nombre_visible, telefono')
    .eq('correo', user.email!)
    .single()

  const nombre = participante?.nombre_completo ?? user.user_metadata?.full_name ?? user.email ?? 'Participante'
  const procedencia = participante?.procedencia ?? ''
  const avatarUrl = participante?.avatar_url ?? user.user_metadata?.avatar_url ?? null
  const nombreVisible = participante?.nombre_visible ?? null
  const telefono = participante?.telefono ?? ''
  const isAdmin = user.app_metadata?.role === 'admin'

  return <HubClient nombre={nombre} procedencia={procedencia} avatarUrl={avatarUrl} userEmail={user.email!} nombreVisible={nombreVisible} telefono={telefono} isAdmin={isAdmin} />
}

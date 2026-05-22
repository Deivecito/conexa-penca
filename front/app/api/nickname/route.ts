import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { containsProfanity } from '@/lib/profanity'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const NICKNAME_REGEX = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_.\-]{2,30}$/

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers)
  if (!rateLimit(`nickname:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Demasiados intentos. Esperá un minuto.' }, { status: 429 })
  }

  const { nombre_visible } = await req.json()

  if (typeof nombre_visible !== 'string' || !NICKNAME_REGEX.test(nombre_visible)) {
    return NextResponse.json({ error: 'Formato de nickname inválido' }, { status: 400 })
  }

  if (containsProfanity(nombre_visible)) {
    return NextResponse.json({ error: 'Ese nickname no está permitido' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { error } = await supabase
    .from('participantes')
    .update({ nombre_visible })
    .eq('correo', user.email)

  if (error) {
    return NextResponse.json({ error: 'No se pudo guardar. Intentá de nuevo.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { registroSchema } from '@/lib/validations'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  if (!rateLimit(`registro:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Demasiados intentos. Esperá un minuto.' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const parsed = registroSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const supabase = createAdminSupabaseClient()

    const { data: existing } = await supabase
      .from('participantes')
      .select('id')
      .eq('correo', parsed.data.correo)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un registro con ese correo electrónico' },
        { status: 409 }
      )
    }

    const { error } = await supabase.from('participantes').insert({
      ...parsed.data,
      evento: 'mundial_2026',
    })

    if (error) throw error

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('Error en registro:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

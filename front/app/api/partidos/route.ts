import { NextResponse } from 'next/server'
import { normalizeMatch } from '@/lib/football-api'

const API_URL = 'https://api.football-data.org/v4/competitions/WC/matches'

export async function GET() {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API key no configurada' }, { status: 500 })
  }

  const res = await fetch(API_URL, {
    headers: { 'X-Auth-Token': apiKey },
    next: { revalidate: 60 },
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Error al obtener partidos' }, { status: 502 })
  }

  const data = await res.json()
  const partidos = (data.matches ?? []).map(normalizeMatch)

  return NextResponse.json(partidos)
}

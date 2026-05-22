import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY
  if (!apiKey) return NextResponse.json([])

  const res = await fetch('https://api.football-data.org/v4/competitions/WC/standings', {
    headers: { 'X-Auth-Token': apiKey },
    next: { revalidate: 300 },
  })

  if (!res.ok) return NextResponse.json([])

  const data = await res.json()
  const grupos = (data.standings ?? []).filter((s: { type: string }) => s.type === 'TOTAL')
  return NextResponse.json(grupos)
}

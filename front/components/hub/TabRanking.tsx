'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Trophy } from 'lucide-react'

interface RankingEntry {
  nombre_visible: string
  procedencia: string
  puntos: number
  posicion: number
}

export default function TabRanking() {
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRanking() {
      const supabase = createClient()
      const { data } = await supabase
        .from('ranking_view')
        .select('*')
        .limit(50)
      setRanking(data ?? [])
      setLoading(false)
    }
    fetchRanking()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    )
  }

  if (ranking.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Trophy className="w-12 h-12 text-gray-700" />
        <p className="text-gray-500 font-semibold">El ranking se habilitará cuando empiecen los partidos</p>
        <p className="text-gray-600 text-sm">¡Hacé tus pronósticos antes del Mundial!</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Tabla de posiciones</h2>
      {ranking.map((entry) => (
        <div
          key={entry.posicion}
          className={`flex items-center gap-3 p-3 rounded-xl border ${
            entry.posicion <= 3
              ? 'bg-gradient-to-r from-yellow-900/20 to-transparent border-yellow-700/30'
              : 'bg-white/5 border-white/10'
          }`}
        >
          <span className={`w-7 text-center font-black text-sm ${
            entry.posicion === 1 ? 'text-yellow-400' :
            entry.posicion === 2 ? 'text-gray-300' :
            entry.posicion === 3 ? 'text-amber-600' : 'text-gray-600'
          }`}>
            {entry.posicion === 1 ? '🥇' : entry.posicion === 2 ? '🥈' : entry.posicion === 3 ? '🥉' : entry.posicion}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{entry.nombre_visible}</p>
            <p className="text-gray-500 text-xs truncate">{entry.procedencia}</p>
          </div>
          <span className="font-black text-white text-lg">{entry.puntos}</span>
          <span className="text-gray-600 text-xs">pts</span>
        </div>
      ))}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { Wifi, Loader2 } from 'lucide-react'
import { iocToFlag } from '@/lib/football-api'

interface TeamStanding {
  position: number
  team: { name: string; shortName: string; tla: string }
  playedGames: number
  won: number
  draw: number
  lost: number
  points: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
}

interface GrupoStanding {
  group: string
  table: TeamStanding[]
}

export default function TabResultados() {
  const [grupos, setGrupos]   = useState<GrupoStanding[]>([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(false)

  useEffect(() => {
    fetch('/api/grupos')
      .then(r => r.json())
      .then(data => {
        setGrupos(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => { setApiError(true); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
      </div>
    )
  }

  if (apiError || grupos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Wifi className="w-10 h-10 text-gray-700" />
        <p className="text-gray-500 font-semibold">
          {apiError ? 'No se pudieron cargar los grupos' : 'Los grupos aún no están disponibles'}
        </p>
        <p className="text-gray-600 text-sm">Volvé cuando empiece el Mundial</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <p className="text-xs text-gray-600">
        <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1.5 align-middle" />
        Clasifican al siguiente round
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {grupos
          .sort((a, b) => a.group.localeCompare(b.group))
          .map(g => <GrupoCard key={g.group} grupo={g} />)
        }
      </div>
    </div>
  )
}

function GrupoCard({ grupo }: { grupo: GrupoStanding }) {
  const letra = grupo.group.replace('GROUP_', '')
  const torneoEmpezado = grupo.table.some(r => r.playedGames > 0)

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">

      {/* Header */}
      <div className="px-4 py-2.5 bg-white/3 border-b border-white/10">
        <span className="text-xs font-black text-gray-300 uppercase tracking-widest">
          Grupo {letra}
        </span>
      </div>

      {/* Table — scrollable on mobile so no column gets cut */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[340px]">
          <thead>
            <tr className="text-gray-600 border-b border-white/5">
              <th className="text-left pl-4 pr-2 py-2 font-semibold">Equipo</th>
              <th className="text-center px-2 py-2 font-semibold">PJ</th>
              <th className="text-center px-2 py-2 font-semibold">G</th>
              <th className="text-center px-2 py-2 font-semibold">E</th>
              <th className="text-center px-2 py-2 font-semibold">P</th>
              <th className="text-center px-2 py-2 font-semibold">GF</th>
              <th className="text-center px-2 py-2 font-semibold">GC</th>
              <th className="text-center px-2 py-2 font-semibold">+/-</th>
              <th className="text-center px-2 pr-4 py-2 font-bold text-white">Pts</th>
            </tr>
          </thead>
          <tbody>
            {grupo.table.map((row, idx) => {
              const qualify = idx < 2
              const gd = row.goalDifference

              return (
                <tr
                  key={row.team.tla}
                  className={`border-b border-white/5 last:border-0 transition-colors ${
                    qualify ? 'bg-blue-900/10' : ''
                  }`}
                >
                  {/* Team */}
                  <td className="pl-3 pr-2 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-0.5 h-5 rounded-full shrink-0 ${qualify ? 'bg-blue-500' : 'bg-transparent'}`} />
                      <span className="text-gray-500 w-3 shrink-0 text-center">{row.position}</span>
                      <span className="text-base leading-none shrink-0">{iocToFlag(row.team.tla)}</span>
                      <span className={`font-semibold truncate ${qualify ? 'text-white' : 'text-gray-300'}`}>
                        {row.team.shortName}
                      </span>
                    </div>
                  </td>

                  {/* Stats */}
                  <td className="text-center px-2 py-2.5 text-gray-400">{row.playedGames}</td>
                  <td className="text-center px-2 py-2.5 text-gray-400">
                    {torneoEmpezado ? <span className={row.won > 0 ? 'text-green-400 font-semibold' : ''}>{row.won}</span> : '–'}
                  </td>
                  <td className="text-center px-2 py-2.5 text-gray-400">
                    {torneoEmpezado ? row.draw : '–'}
                  </td>
                  <td className="text-center px-2 py-2.5 text-gray-400">
                    {torneoEmpezado ? <span className={row.lost > 0 ? 'text-red-400/70' : ''}>{row.lost}</span> : '–'}
                  </td>
                  <td className="text-center px-2 py-2.5 text-gray-300">
                    {torneoEmpezado ? row.goalsFor : '–'}
                  </td>
                  <td className="text-center px-2 py-2.5 text-gray-400">
                    {torneoEmpezado ? row.goalsAgainst : '–'}
                  </td>
                  <td className={`text-center px-2 py-2.5 font-semibold ${
                    !torneoEmpezado ? 'text-gray-600' :
                    gd > 0 ? 'text-green-400' :
                    gd < 0 ? 'text-red-400' : 'text-gray-500'
                  }`}>
                    {torneoEmpezado ? (gd > 0 ? `+${gd}` : gd) : '–'}
                  </td>
                  <td className="text-center px-2 pr-4 py-2.5 font-black text-white">
                    {torneoEmpezado ? row.points : '–'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

'use client'

import { useState, useMemo } from 'react'
import {
  Search, Download, Users, MapPin, Target,
  ChevronRight, X, BarChart2, Trophy, User, RefreshCw,
} from 'lucide-react'
import type { Participante } from '@/types'
import type { PartidoNormalizado } from '@/lib/football-api'

// ─── Types ────────────────────────────────────────────────────────────────────

type ParticipanteAdmin = Participante & { num_pronosticos: number }

interface PronosticoAdmin {
  correo: string
  match_id: number
  goles_local: number
  goles_visitante: number
  puntos: number | null
}

interface AdminClientProps {
  participantes: ParticipanteAdmin[]
  pronosticos: PronosticoAdmin[]
  partidos: PartidoNormalizado[]
}

type Tab = 'resumen' | 'participantes' | 'pronosticos'

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function AdminClient({ participantes, pronosticos, partidos }: AdminClientProps) {
  const [tab, setTab]         = useState<Tab>('resumen')
  const [selected, setSelected] = useState<ParticipanteAdmin | null>(null)

  const TAB_ITEMS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'resumen',        label: 'Resumen',        icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'participantes',  label: 'Participantes',  icon: <Users className="w-4 h-4" /> },
    { id: 'pronosticos',    label: 'Pronósticos',    icon: <Target className="w-4 h-4" /> },
  ]

  return (
    <div className="flex min-h-[calc(100vh-53px)]">

      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-gray-900 border-r border-gray-800 p-3 gap-1">
        {TAB_ITEMS.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSelected(null) }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-left transition-colors ${
              tab === t.id
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                : 'text-gray-500 hover:text-white hover:bg-gray-800'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
        <div className="mt-auto pt-4 px-4 text-xs text-gray-700 space-y-1">
          <p>{participantes.length} participantes</p>
          <p>{pronosticos.length} pronósticos cargados</p>
        </div>
      </aside>

      {/* Mobile tab bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 flex bg-gray-900 border-t border-gray-800">
        {TAB_ITEMS.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSelected(null) }}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-semibold transition-colors ${
              tab === t.id ? 'text-blue-400' : 'text-gray-600'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 px-4 py-6 lg:px-8 pb-20 lg:pb-6 max-w-5xl">
        {tab === 'resumen'       && <TabResumen participantes={participantes} pronosticos={pronosticos} />}
        {tab === 'participantes' && (
          selected
            ? <ParticipanteDetail
                p={selected}
                pronosticos={pronosticos.filter(pr => pr.correo === selected.correo)}
                partidos={partidos}
                onBack={() => setSelected(null)}
              />
            : <TabParticipantes participantes={participantes} onSelect={setSelected} />
        )}
        {tab === 'pronosticos' && <TabPronosticos pronosticos={pronosticos} partidos={partidos} participantes={participantes} />}
      </main>
    </div>
  )
}

// ─── Tab Resumen ──────────────────────────────────────────────────────────────

function TabResumen({ participantes, pronosticos }: { participantes: ParticipanteAdmin[]; pronosticos: PronosticoAdmin[] }) {
  const [recalcState, setRecalcState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [recalcMsg, setRecalcMsg]     = useState('')

  const handleRecalcular = async () => {
    setRecalcState('loading')
    setRecalcMsg('')
    const res = await fetch('/api/cron/calcular-puntos')
    const json = await res.json()
    setRecalcState(res.ok ? 'done' : 'error')
    setRecalcMsg(json.message ?? json.error ?? '')
    setTimeout(() => setRecalcState('idle'), 5000)
  }

  const conProns    = participantes.filter(p => p.num_pronosticos > 0).length
  const sinProns    = participantes.length - conProns
  const avgProns    = participantes.length
    ? (pronosticos.length / participantes.length).toFixed(1)
    : '0'

  const procedencias = useMemo(() => {
    const map: Record<string, number> = {}
    for (const p of participantes) {
      const key = p.procedencia || 'Sin datos'
      map[key] = (map[key] ?? 0) + 1
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10)
  }, [participantes])

  const ultimos = participantes.slice(0, 8)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-black text-white">Resumen</h1>
        <div className="flex items-center gap-3">
          {recalcMsg && (
            <span className={`text-xs font-semibold ${recalcState === 'done' ? 'text-green-400' : 'text-red-400'}`}>
              {recalcMsg}
            </span>
          )}
          <button
            onClick={handleRecalcular}
            disabled={recalcState === 'loading'}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recalcState === 'loading' ? 'animate-spin' : ''}`} />
            Recalcular puntos
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Registrados" value={participantes.length} icon={<Users className="w-5 h-5" />} color="blue" />
        <StatCard label="Con pronósticos" value={conProns} icon={<Target className="w-5 h-5" />} color="green" />
        <StatCard label="Sin pronósticos" value={sinProns} icon={<User className="w-5 h-5" />} color="yellow" />
        <StatCard label="Prom. pronósticos" value={avgProns} icon={<BarChart2 className="w-5 h-5" />} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top procedencias */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Por procedencia
          </h2>
          <div className="flex flex-col gap-2">
            {procedencias.map(([ciudad, count]) => {
              const pct = Math.round((count / participantes.length) * 100)
              return (
                <div key={ciudad}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300 font-semibold">{ciudad}</span>
                    <span className="text-gray-500">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Últimos registrados */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4" /> Últimos registrados
          </h2>
          <div className="flex flex-col divide-y divide-gray-800">
            {ultimos.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-white text-sm font-semibold">{p.nombre_completo}</p>
                  <p className="text-gray-600 text-xs">{p.procedencia}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {new Date(p.created_at).toLocaleDateString('es-UY', { day: '2-digit', month: 'short' })}
                  </p>
                  <p className="text-xs text-blue-400">{p.num_pronosticos} pron.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab Participantes ────────────────────────────────────────────────────────

function TabParticipantes({ participantes, onSelect }: { participantes: ParticipanteAdmin[]; onSelect: (p: ParticipanteAdmin) => void }) {
  const [search, setSearch]         = useState('')
  const [filterProns, setFilterProns] = useState<'todos' | 'con' | 'sin'>('todos')
  const [sortBy, setSortBy]         = useState<'fecha' | 'nombre' | 'prons'>('fecha')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return participantes
      .filter(p => {
        if (filterProns === 'con' && p.num_pronosticos === 0) return false
        if (filterProns === 'sin' && p.num_pronosticos > 0) return false
        if (!q) return true
        return (
          p.nombre_completo.toLowerCase().includes(q) ||
          p.correo.toLowerCase().includes(q) ||
          p.procedencia.toLowerCase().includes(q) ||
          (p.nombre_visible ?? '').toLowerCase().includes(q) ||
          p.telefono.includes(q)
        )
      })
      .sort((a, b) => {
        if (sortBy === 'nombre') return a.nombre_completo.localeCompare(b.nombre_completo)
        if (sortBy === 'prons')  return b.num_pronosticos - a.num_pronosticos
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  }, [participantes, search, filterProns, sortBy])

  const exportCSV = () => {
    const headers = ['Nombre', 'Nick', 'Teléfono', 'Procedencia', 'Correo', 'Pronósticos', 'Registrado']
    const rows = filtered.map(p => [
      `"${p.nombre_completo}"`,
      `"${p.nombre_visible ?? ''}"`,
      `"${p.telefono}"`,
      `"${p.procedencia}"`,
      `"${p.correo}"`,
      p.num_pronosticos,
      `"${new Date(p.created_at).toLocaleString('es-UY')}"`,
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url
    a.download = `penca-participantes-${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-white">Participantes</h1>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Nombre, nick, correo, procedencia..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
        <select
          value={filterProns}
          onChange={e => setFilterProns(e.target.value as typeof filterProns)}
          className="px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none"
        >
          <option value="todos">Todos</option>
          <option value="con">Con pronósticos</option>
          <option value="sin">Sin pronósticos</option>
        </select>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none"
        >
          <option value="fecha">Más recientes</option>
          <option value="nombre">Nombre A-Z</option>
          <option value="prons">Más pronósticos</option>
        </select>
      </div>

      <p className="text-xs text-gray-600">{filtered.length} de {participantes.length} participantes</p>

      {/* Mobile cards */}
      <div className="sm:hidden flex flex-col gap-2">
        {filtered.map(p => (
          <button key={p.id} onClick={() => onSelect(p)} className="text-left w-full bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-blue-500/40 transition-colors flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">{p.nombre_completo}</p>
              {p.nombre_visible && <p className="text-blue-400 text-xs">@{p.nombre_visible}</p>}
              <p className="text-gray-500 text-xs truncate">{p.procedencia} · {p.correo}</p>
            </div>
            <div className="text-right shrink-0 flex items-center gap-2">
              <div>
                <p className="text-white font-black text-sm">{p.num_pronosticos}</p>
                <p className="text-gray-600 text-xs">pron.</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </div>
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 border-b border-gray-800 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Nombre</th>
              <th className="text-left px-4 py-3 font-semibold">Nick</th>
              <th className="text-left px-4 py-3 font-semibold">Procedencia</th>
              <th className="text-left px-4 py-3 font-semibold">Correo</th>
              <th className="text-left px-4 py-3 font-semibold">Teléfono</th>
              <th className="text-center px-4 py-3 font-semibold">Pron.</th>
              <th className="text-left px-4 py-3 font-semibold">Registrado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-600">Sin resultados</td></tr>
            ) : filtered.map(p => (
              <tr
                key={p.id}
                onClick={() => onSelect(p)}
                className="bg-gray-950 hover:bg-gray-900 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 text-white font-semibold">{p.nombre_completo}</td>
                <td className="px-4 py-3 text-blue-400 text-xs">{p.nombre_visible ? `@${p.nombre_visible}` : '—'}</td>
                <td className="px-4 py-3 text-gray-400">{p.procedencia}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{p.correo}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{p.telefono}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-black text-sm ${p.num_pronosticos > 0 ? 'text-green-400' : 'text-gray-700'}`}>
                    {p.num_pronosticos}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {new Date(p.created_at).toLocaleDateString('es-UY', { day: '2-digit', month: 'short', year: '2-digit' })}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  <ChevronRight className="w-4 h-4" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Participant detail ───────────────────────────────────────────────────────

function ParticipanteDetail({
  p, pronosticos, partidos, onBack,
}: {
  p: ParticipanteAdmin
  pronosticos: PronosticoAdmin[]
  partidos: PartidoNormalizado[]
  onBack: () => void
}) {
  const [search, setSearch] = useState('')

  const pronConPartido = useMemo(() => {
    return pronosticos
      .map(pr => ({ pr, partido: partidos.find(pa => pa.id === pr.match_id) }))
      .filter(({ partido }) => partido)
      .filter(({ partido }) =>
        !search || (partido!.equipo_local + partido!.equipo_visitante).toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => new Date(a.partido!.fecha).getTime() - new Date(b.partido!.fecha).getTime())
  }, [pronosticos, partidos, search])

  return (
    <div className="flex flex-col gap-5">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-white text-sm font-semibold transition-colors">
        <X className="w-4 h-4" /> Volver
      </button>

      {/* Info card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-white font-black text-lg">{p.nombre_completo}</p>
            {p.nombre_visible && <p className="text-blue-400 text-sm font-semibold">@{p.nombre_visible}</p>}
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-900/40 text-blue-300 text-xs font-bold shrink-0">
            {p.num_pronosticos} pronósticos
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 text-sm">
          <InfoRow label="Correo"      value={p.correo} />
          <InfoRow label="Teléfono"    value={p.telefono} />
          <InfoRow label="Procedencia" value={p.procedencia} />
          <InfoRow label="Registrado"  value={new Date(p.created_at).toLocaleDateString('es-UY', { day: '2-digit', month: 'short', year: 'numeric' })} />
        </div>
      </div>

      {/* Pronósticos */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Sus pronósticos</h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar partido..."
              className="pl-8 pr-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-600 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/40"
            />
          </div>
        </div>

        {pronConPartido.length === 0 ? (
          <p className="text-gray-600 text-sm py-6 text-center">No hay pronósticos cargados</p>
        ) : (
          <div className="flex flex-col gap-2">
            {pronConPartido.map(({ pr, partido }) => {
              const finished = partido!.estado === 'finalizado'
              const acerto   = finished &&
                pr.goles_local === partido!.goles_local &&
                pr.goles_visitante === partido!.goles_visitante
              return (
                <div key={pr.match_id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
                  acerto ? 'bg-green-900/10 border-green-700/30' : 'bg-gray-900 border-gray-800'
                }`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">
                      {partido!.bandera_local} {partido!.equipo_local} vs {partido!.equipo_visitante} {partido!.bandera_visitante}
                    </p>
                    <p className="text-gray-600 text-xs">
                      {new Date(partido!.fecha).toLocaleDateString('es-UY', { weekday: 'short', day: '2-digit', month: 'short' })}
                      {partido!.grupo ? ` · Grupo ${partido!.grupo}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-white font-black">{pr.goles_local} – {pr.goles_visitante}</p>
                    {finished && (
                      <p className={`text-xs ${acerto ? 'text-green-400 font-bold' : 'text-gray-600'}`}>
                        {acerto ? '✓ Exacto' : `Real: ${partido!.goles_local ?? '?'}-${partido!.goles_visitante ?? '?'}`}
                      </p>
                    )}
                    {pr.puntos != null && (
                      <p className="text-xs text-yellow-400 font-bold">{pr.puntos} pts</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tab Pronósticos (por partido) ───────────────────────────────────────────

function TabPronosticos({
  pronosticos, partidos, participantes,
}: {
  pronosticos: PronosticoAdmin[]
  partidos: PartidoNormalizado[]
  participantes: ParticipanteAdmin[]
}) {
  const [matchId, setMatchId] = useState<number | null>(null)

  const matchOptions = partidos
    .filter(p => pronosticos.some(pr => pr.match_id === p.id))
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())

  const partido = partidos.find(p => p.id === matchId)

  const prons = useMemo(() => {
    if (!matchId) return []
    return pronosticos
      .filter(pr => pr.match_id === matchId)
      .map(pr => ({
        ...pr,
        participante: participantes.find(p => p.correo === pr.correo),
      }))
      .sort((a, b) => (a.participante?.nombre_completo ?? '').localeCompare(b.participante?.nombre_completo ?? ''))
  }, [matchId, pronosticos, participantes])

  const resultadoMap = useMemo(() => {
    const map: Record<string, number> = {}
    for (const pr of prons) {
      const key = `${pr.goles_local}-${pr.goles_visitante}`
      map[key] = (map[key] ?? 0) + 1
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [prons])

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-black text-white">Pronósticos por partido</h1>

      <select
        value={matchId ?? ''}
        onChange={e => setMatchId(e.target.value ? Number(e.target.value) : null)}
        className="w-full max-w-lg px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      >
        <option value="">— Seleccioná un partido —</option>
        {matchOptions.map(p => (
          <option key={p.id} value={p.id}>
            {new Date(p.fecha).toLocaleDateString('es-UY', { day: '2-digit', month: 'short' })}
            {' '}{p.bandera_local} {p.equipo_local} vs {p.equipo_visitante} {p.bandera_visitante}
            {p.grupo ? ` (Gr. ${p.grupo})` : ''}
          </option>
        ))}
      </select>

      {partido && (
        <>
          {/* Match header */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center gap-4">
            <div className="text-2xl">{partido.bandera_local}</div>
            <div className="flex-1 text-center">
              <p className="text-white font-black text-base">
                {partido.equipo_local} vs {partido.equipo_visitante}
              </p>
              <p className="text-gray-500 text-xs mt-0.5">
                {partido.estado === 'finalizado'
                  ? `Final: ${partido.goles_local} – ${partido.goles_visitante}`
                  : partido.estado === 'en_curso'
                  ? `En curso: ${partido.goles_local ?? '?'} – ${partido.goles_visitante ?? '?'}`
                  : new Date(partido.fecha).toLocaleString('es-UY', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="text-2xl">{partido.bandera_visitante}</div>
          </div>

          {/* Score distribution */}
          {resultadoMap.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Resultados más elegidos</p>
              <div className="flex flex-wrap gap-2">
                {resultadoMap.map(([score, count]) => (
                  <span key={score} className="px-3 py-1.5 rounded-lg bg-gray-800 text-white text-sm font-bold">
                    {score} <span className="text-gray-500 font-normal text-xs">×{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Individual predictions */}
          <p className="text-xs text-gray-500">{prons.length} pronósticos cargados</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {prons.map(pr => {
              const acerto = partido.estado === 'finalizado' &&
                pr.goles_local === partido.goles_local &&
                pr.goles_visitante === partido.goles_visitante
              return (
                <div key={pr.correo} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                  acerto ? 'bg-green-900/10 border-green-700/30' : 'bg-gray-900 border-gray-800'
                }`}>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-semibold truncate">
                      {pr.participante?.nombre_completo ?? pr.correo}
                    </p>
                    {pr.participante?.nombre_visible && (
                      <p className="text-gray-600 text-xs">@{pr.participante.nombre_visible}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-white font-black">{pr.goles_local} – {pr.goles_visitante}</p>
                    {acerto && <p className="text-green-400 text-xs font-bold">✓ Exacto</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {!matchId && (
        <div className="text-center py-16 text-gray-700">
          <Target className="w-10 h-10 mx-auto mb-3" />
          <p>Seleccioná un partido para ver los pronósticos</p>
        </div>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    blue:   'text-blue-400 bg-blue-900/20',
    green:  'text-green-400 bg-green-900/20',
    yellow: 'text-yellow-400 bg-yellow-900/20',
    purple: 'text-purple-400 bg-purple-900/20',
  }
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-2xl font-black text-white">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-600 text-xs">{label}</p>
      <p className="text-gray-300 text-sm font-medium">{value}</p>
    </div>
  )
}

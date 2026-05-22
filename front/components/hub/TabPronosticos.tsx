'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { containsProfanity } from '@/lib/profanity'
import { Loader2, CheckCircle2, Lock, Sparkles, Trophy, Wifi } from 'lucide-react'
import type { PartidoNormalizado } from '@/lib/football-api'
import { iocToFlag } from '@/lib/football-api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TabPronosticosProps {
  userEmail: string
  nombreVisible: string | null
  onNombreVisibleSet: (nombre: string) => void
  isAdmin?: boolean
}

interface PronState {
  local: string
  visitante: string
  saving: boolean
  saved: boolean
  error: string
}

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

// ─── Constants ────────────────────────────────────────────────────────────────

const TAB_LABEL: Record<string, string> = {
  grupos:         'Grupos',
  dieciseisavos:  '16avos',
  octavos:        '8avos',
  cuartos:        'Cuartos',
  semifinal:      'Semis',
  tercer_puesto:  '3° Puesto',
  final:          'Final',
}

const FASE_ORDER = ['grupos', 'dieciseisavos', 'octavos', 'cuartos', 'semifinal', 'tercer_puesto', 'final']

// ─── Entry point ──────────────────────────────────────────────────────────────

export default function TabPronosticos({ userEmail, nombreVisible, onNombreVisibleSet, isAdmin }: TabPronosticosProps) {
  if (!nombreVisible && !isAdmin) {
    return <NicknameSetup userEmail={userEmail} onDone={onNombreVisibleSet} />
  }
  return <PronosticosContent userEmail={userEmail} isAdmin={isAdmin} />
}

// ─── Nickname setup ───────────────────────────────────────────────────────────

const NICK_REGEX = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_.\-]{2,30}$/

function NicknameSetup({ userEmail, onDone }: { userEmail: string; onDone: (n: string) => void }) {
  const [value, setValue]   = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const formatOk  = NICK_REGEX.test(value)
  const isProfane = formatOk && containsProfanity(value)
  const isValid   = formatOk && !isProfane

  const hint = value.length === 0
    ? 'Mínimo 2 caracteres'
    : isProfane
    ? 'Ese nickname no está permitido'
    : !formatOk
    ? 'Solo letras, números, puntos, guiones y _'
    : ''

  const handleSave = async () => {
    if (!isValid) return
    setSaving(true)
    setError('')
    const res = await fetch('/api/nickname', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre_visible: value }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'No se pudo guardar. Intentá de nuevo.'); setSaving(false); return }
    onDone(value)
  }

  return (
    <div className="flex flex-col items-center gap-6 py-10 max-w-sm mx-auto text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-yellow-400" />
      </div>
      <div>
        <h3 className="text-white font-black text-xl">Elegí tu nickname</h3>
        <p className="text-gray-400 text-sm mt-2 leading-relaxed">
          Este nombre aparece en el ranking. Podés cambiarlo después desde Ajustes.
        </p>
      </div>
      <div className="w-full flex flex-col gap-2">
        <input
          value={value}
          onChange={e => { setValue(e.target.value); setError('') }}
          placeholder="Ej: ElPibe10, Toro, CR7Fan"
          maxLength={30}
          autoFocus
          className={`w-full px-4 py-3.5 rounded-xl bg-white/10 border text-white placeholder-gray-500 text-base focus:outline-none focus:ring-2 transition-all ${
            value.length === 0
              ? 'border-white/20 focus:ring-blue-500/40 focus:border-blue-400'
              : isValid
              ? 'border-green-500 focus:ring-green-500/30'
              : 'border-red-500 focus:ring-red-500/30'
          }`}
        />
        <div className="flex justify-between text-xs px-1">
          <span className={value.length > 0 && !isValid ? 'text-red-400' : 'text-gray-600'}>
            {hint}
          </span>
          <span className="text-gray-600">{value.length}/30</span>
        </div>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        onClick={handleSave}
        disabled={!isValid || saving}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-base active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {saving
          ? <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</>
          : <><CheckCircle2 className="w-5 h-5" /> Confirmar nickname</>}
      </button>
    </div>
  )
}

// ─── Pronósticos content ──────────────────────────────────────────────────────

function PronosticosContent({ userEmail, isAdmin }: { userEmail: string; isAdmin?: boolean }) {
  const [partidos, setPartidos]         = useState<PartidoNormalizado[]>([])
  const [grupos, setGrupos]             = useState<GrupoStanding[]>([])
  const [prons, setProns]               = useState<Record<number, PronState>>({})
  const [loading, setLoading]           = useState(true)
  const [apiError, setApiError]         = useState(false)
  const [faseActiva, setFaseActiva]     = useState<string>('grupos')
  const [grupoActivo, setGrupoActivo]   = useState<string>('A')

  useEffect(() => {
    async function load() {
      const [partidosRes, gruposRes] = await Promise.all([
        fetch('/api/partidos').then(r => r.json()).catch(() => null),
        fetch('/api/grupos').then(r => r.json()).catch(() => []),
      ])

      if (!partidosRes || !Array.isArray(partidosRes)) {
        setApiError(true)
        setLoading(false)
        return
      }

      setPartidos(partidosRes)
      setGrupos(Array.isArray(gruposRes) ? gruposRes : [])

      if (!isAdmin) {
        const { data: pronData } = await createClient().from('pronosticos').select('*').eq('correo', userEmail)
        const map: Record<number, PronState> = {}
        for (const p of pronData ?? []) {
          map[p.match_id] = {
            local:     String(p.goles_local),
            visitante: String(p.goles_visitante),
            saving: false, saved: true, error: '',
          }
        }
        setProns(map)
      }

      setLoading(false)
    }
    load()
  }, [userEmail, isAdmin])

  const handleChange = useCallback((matchId: number, field: 'local' | 'visitante', val: string) => {
    if (!/^\d{0,2}$/.test(val)) return
    setProns(prev => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] ?? { local: '', visitante: '', saving: false, saved: false, error: '' }),
        [field]: val,
        saved: false,
      },
    }))
  }, [])

  const handleSave = useCallback(async (partido: PartidoNormalizado) => {
    const p = prons[partido.id]
    if (!p || p.local === '' || p.visitante === '') return

    setProns(prev => ({ ...prev, [partido.id]: { ...prev[partido.id], saving: true, error: '' } }))

    const { error } = await createClient().from('pronosticos').upsert({
      correo:          userEmail,
      match_id:        partido.id,
      goles_local:     parseInt(p.local),
      goles_visitante: parseInt(p.visitante),
      updated_at:      new Date().toISOString(),
    }, { onConflict: 'correo,match_id' })

    setProns(prev => ({
      ...prev,
      [partido.id]: { ...prev[partido.id], saving: false, saved: !error, error: error ? 'Error al guardar' : '' },
    }))
  }, [prons, userEmail])

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(6)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />)}
      </div>
    )
  }

  if (apiError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Wifi className="w-10 h-10 text-gray-700" />
        <p className="text-gray-500 font-semibold">No se pudieron cargar los partidos</p>
        <p className="text-gray-600 text-sm">Verificá que la API key esté configurada</p>
      </div>
    )
  }

  if (partidos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Trophy className="w-10 h-10 text-gray-700" />
        <p className="text-gray-500 font-semibold">No hay partidos disponibles aún</p>
      </div>
    )
  }

  const fases = FASE_ORDER.filter(f => partidos.some(p => p.fase === f))
  const activeFase = fases.includes(faseActiva) ? faseActiva : (fases[0] ?? 'grupos')
  const partidosDeFase = partidos.filter(p => p.fase === activeFase)

  return (
    <div className="flex flex-col gap-4 animate-fade-in">

      {/* Phase tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {fases.map(fase => (
          <button
            key={fase}
            onClick={() => setFaseActiva(fase)}
            className={`shrink-0 px-3.5 py-1.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              activeFase === fase
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {TAB_LABEL[fase] ?? fase}
          </button>
        ))}
      </div>

      {isAdmin && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-900/20 border border-yellow-700/30 text-yellow-400 text-xs font-semibold">
          <span>👁</span> Modo admin — vista de lectura. Los pronósticos se gestionan desde el panel.
        </div>
      )}

      {activeFase === 'grupos' ? (
        <GruposView
          partidos={partidosDeFase}
          grupos={grupos}
          prons={prons}
          grupoActivo={grupoActivo}
          onGrupoChange={setGrupoActivo}
          onChange={handleChange}
          onSave={handleSave}
          isAdmin={isAdmin}
        />
      ) : (
        <FaseView
          partidos={partidosDeFase}
          prons={prons}
          onChange={handleChange}
          onSave={handleSave}
          isAdmin={isAdmin}
        />
      )}
    </div>
  )
}

// ─── Grupos view ──────────────────────────────────────────────────────────────

function GruposView({
  partidos,
  grupos,
  prons,
  grupoActivo,
  onGrupoChange,
  onChange,
  onSave,
  isAdmin,
}: {
  partidos: PartidoNormalizado[]
  grupos: GrupoStanding[]
  prons: Record<number, PronState>
  grupoActivo: string
  onGrupoChange: (g: string) => void
  onChange: (matchId: number, field: 'local' | 'visitante', val: string) => void
  onSave: (partido: PartidoNormalizado) => void
  isAdmin?: boolean
}) {
  const grupoLetras = [...new Set(
    partidos.map(p => p.grupo).filter(Boolean)
  )].sort() as string[]

  const activeGrupo = grupoLetras.includes(grupoActivo) ? grupoActivo : (grupoLetras[0] ?? 'A')
  const standingForGroup = grupos.find(g => g.group === `GROUP_${activeGrupo}`)
  const partidosDeGrupo = partidos.filter(p => p.grupo === activeGrupo)

  return (
    <div className="flex flex-col gap-4">

      {/* Group letter tabs */}
      {grupoLetras.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {grupoLetras.map(letra => (
            <button
              key={letra}
              onClick={() => onGrupoChange(letra)}
              className={`shrink-0 w-9 h-9 rounded-lg text-sm font-black transition-all ${
                activeGrupo === letra
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'
              }`}
            >
              {letra}
            </button>
          ))}
        </div>
      )}

      {/* Standings table */}
      {standingForGroup && standingForGroup.table.length > 0 && (
        <GrupoTable standing={standingForGroup} />
      )}

      {/* Matches */}
      <div className="flex flex-col gap-2">
        {groupByDate(partidosDeGrupo).map(({ label, items }) => (
          <div key={label}>
            <p className="text-xs text-blue-400/70 font-semibold mb-2 pl-1 capitalize">{label}</p>
            <div className="flex flex-col gap-2">
              {items.map(partido => (
                <MatchCard
                  key={partido.id}
                  partido={partido}
                  pron={prons[partido.id]}
                  onChange={(field, val) => onChange(partido.id, field, val)}
                  onSave={() => onSave(partido)}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Group standings table ────────────────────────────────────────────────────

function GrupoTable({ standing }: { standing: GrupoStanding }) {
  const letra = standing.group.replace('GROUP_', '')
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <div className="px-3 py-2 border-b border-white/10">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Grupo {letra}</p>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-gray-600 border-b border-white/5">
            <th className="text-left px-3 py-2 font-semibold">Equipo</th>
            <th className="text-center px-2 py-2 font-semibold">PJ</th>
            <th className="text-center px-2 py-2 font-semibold">G</th>
            <th className="text-center px-2 py-2 font-semibold">E</th>
            <th className="text-center px-2 py-2 font-semibold">P</th>
            <th className="text-center px-2 py-2 font-semibold">+/-</th>
            <th className="text-center px-2 py-2 font-bold text-white">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standing.table.map((row, idx) => (
            <tr
              key={row.team.tla}
              className={`border-b border-white/5 last:border-0 ${idx < 2 ? 'bg-green-900/10' : ''}`}
            >
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 w-3 shrink-0">{row.position}</span>
                  <span className="text-base leading-none shrink-0">{iocToFlag(row.team.tla)}</span>
                  <span className="text-gray-200 font-semibold truncate">{row.team.shortName}</span>
                </div>
              </td>
              <td className="text-center px-2 py-2.5 text-gray-400">{row.playedGames}</td>
              <td className="text-center px-2 py-2.5 text-gray-400">{row.won}</td>
              <td className="text-center px-2 py-2.5 text-gray-400">{row.draw}</td>
              <td className="text-center px-2 py-2.5 text-gray-400">{row.lost}</td>
              <td className={`text-center px-2 py-2.5 font-semibold ${
                row.goalDifference > 0 ? 'text-green-400' :
                row.goalDifference < 0 ? 'text-red-400' : 'text-gray-500'
              }`}>
                {row.goalDifference > 0 ? '+' : ''}{row.goalDifference}
              </td>
              <td className="text-center px-2 py-2.5 font-black text-white">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Non-group fase view ──────────────────────────────────────────────────────

function FaseView({
  partidos,
  prons,
  onChange,
  onSave,
  isAdmin,
}: {
  partidos: PartidoNormalizado[]
  prons: Record<number, PronState>
  onChange: (matchId: number, field: 'local' | 'visitante', val: string) => void
  onSave: (partido: PartidoNormalizado) => void
  isAdmin?: boolean
}) {
  if (partidos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <Lock className="w-8 h-8 text-gray-700" />
        <p className="text-gray-500 text-sm">Los partidos de esta fase se definirán al avanzar el torneo</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {groupByDate(partidos).map(({ label, items }) => (
        <div key={label}>
          <p className="text-xs text-blue-400/70 font-semibold mb-2 pl-1 capitalize">{label}</p>
          <div className="flex flex-col gap-2">
            {items.map(partido => (
              <MatchCard
                key={partido.id}
                partido={partido}
                pron={prons[partido.id]}
                onChange={(field, val) => onChange(partido.id, field, val)}
                onSave={() => onSave(partido)}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Match card ───────────────────────────────────────────────────────────────

function MatchCard({ partido, pron, onChange, onSave, isAdmin }: {
  partido: PartidoNormalizado
  pron: PronState | undefined
  onChange: (field: 'local' | 'visitante', val: string) => void
  onSave: () => void
  isAdmin?: boolean
}) {
  const locked   = isAdmin || partido.estado !== 'pendiente'
  const live     = partido.estado === 'en_curso'
  const finished = partido.estado === 'finalizado'
  const canSave  = !locked && pron && pron.local !== '' && pron.visitante !== '' && !pron.saved && !pron.saving
  const hora     = new Date(partido.fecha).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })

  const minuteLabel = live
    ? partido.medio_tiempo
      ? 'HT'
      : partido.minuto != null
        ? `${partido.minuto}'`
        : 'EN VIVO'
    : null

  return (
    <div className={`rounded-xl border p-4 transition-all ${
      live     ? 'bg-green-900/10 border-green-600/40 shadow-[0_0_0_1px_rgba(74,222,128,0.1)]' :
      finished ? 'bg-white/3 border-white/8' :
                 'bg-white/5 border-white/10'
    }`}>
      {/* Meta row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{hora} hs</span>
          {partido.estadio && <span className="text-xs text-gray-600 hidden sm:inline">· {partido.estadio}</span>}
        </div>
        <div className="flex items-center gap-2">
          {live && (
            <div className="flex items-center gap-1.5">
              <span className="text-base animate-bounce leading-none">⚽</span>
              <span className="text-xs font-black text-green-400 tabular-nums">{minuteLabel}</span>
            </div>
          )}
          {locked && !live && <Lock className="w-3.5 h-3.5 text-gray-600" />}
        </div>
      </div>

      {/* Teams + score */}
      <div className="flex items-center gap-2">
        <TeamLabel flag={partido.bandera_local} name={partido.equipo_local} align="left" />
        <div className="flex items-center gap-1.5 shrink-0">
          {finished || live ? (
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-black text-lg ${
              live ? 'bg-green-900/30 text-green-100' : 'bg-white/5 text-white'
            }`}>
              <span>{partido.goles_local ?? '?'}</span>
              <span className="text-gray-500 mx-0.5">-</span>
              <span>{partido.goles_visitante ?? '?'}</span>
            </div>
          ) : (
            <>
              <ScoreInput value={pron?.local ?? ''} onChange={v => onChange('local', v)} />
              <span className="text-gray-600 font-bold text-sm">-</span>
              <ScoreInput value={pron?.visitante ?? ''} onChange={v => onChange('visitante', v)} />
            </>
          )}
        </div>
        <TeamLabel flag={partido.bandera_visitante} name={partido.equipo_visitante} align="right" />
      </div>

      {/* Pronóstico guardado sobre partido ya bloqueado */}
      {locked && !isAdmin && pron && (
        <p className="mt-2 text-xs text-center text-gray-600">
          Tu pronóstico: <span className="text-gray-400">{pron.local} - {pron.visitante}</span>
        </p>
      )}

      {/* Guardar */}
      {!locked && (
        <div className="mt-3 flex items-center justify-end gap-2">
          {pron?.error && <span className="text-red-400 text-xs">{pron.error}</span>}
          {pron?.saved && !pron.saving && (
            <span className="text-green-400 text-xs flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Guardado
            </span>
          )}
          <button
            onClick={onSave}
            disabled={!canSave}
            className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {pron?.saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Guardar
          </button>
        </div>
      )}
    </div>
  )
}

function TeamLabel({ flag, name, align }: { flag: string; name: string; align: 'left' | 'right' }) {
  return (
    <div className={`flex-1 flex items-center gap-2 min-w-0 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
      <span className="text-2xl leading-none shrink-0">{flag}</span>
      <span className={`text-white text-sm font-semibold truncate ${align === 'right' ? 'text-right' : ''}`}>{name}</span>
    </div>
  )
}

function ScoreInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0} max={99}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="-"
      className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 text-white text-center text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
  )
}

function groupByDate(partidos: PartidoNormalizado[]): { label: string; items: PartidoNormalizado[] }[] {
  const map = new Map<string, PartidoNormalizado[]>()
  for (const p of partidos) {
    const label = new Date(p.fecha).toLocaleDateString('es-UY', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(p)
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }))
}

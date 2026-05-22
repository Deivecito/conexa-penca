// Mapeo TLA de football-data.org → ISO 3166-1 alpha-2 para generar emoji de bandera
const IOC_TO_ISO: Record<string, string> = {
  ALG: 'DZ', ARG: 'AR', AUS: 'AU', AUT: 'AT', BEL: 'BE',
  BIH: 'BA', BRA: 'BR', CAN: 'CA', CPV: 'CV', COL: 'CO',
  COD: 'CD', CRO: 'HR', CUW: 'CW', CZE: 'CZ', ECU: 'EC',
  EGY: 'EG', ENG: 'GB', FRA: 'FR', GER: 'DE', GHA: 'GH',
  HAI: 'HT', IRN: 'IR', IRQ: 'IQ', CIV: 'CI', JPN: 'JP',
  JOR: 'JO', MEX: 'MX', MAR: 'MA', NED: 'NL', NZL: 'NZ',
  NOR: 'NO', PAN: 'PA', PAR: 'PY', POR: 'PT', QAT: 'QA',
  KSA: 'SA', SCO: 'GB', SEN: 'SN', RSA: 'ZA', KOR: 'KR',
  ESP: 'ES', SWE: 'SE', SUI: 'CH', TUN: 'TN', TUR: 'TR',
  USA: 'US', URY: 'UY', UZB: 'UZ',
}

export function iocToFlag(code: string): string {
  const iso = IOC_TO_ISO[code?.toUpperCase()]
  if (!iso) return '🏳️'
  return [...iso.toUpperCase()].map(c =>
    String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)
  ).join('')
}

const STAGE_MAP: Record<string, string> = {
  GROUP_STAGE:       'grupos',
  LAST_32:           'dieciseisavos',
  ROUND_OF_16:       'octavos',
  QUARTER_FINALS:    'cuartos',
  SEMI_FINALS:       'semifinal',
  THIRD_PLACE:       'tercer_puesto',
  FINAL:             'final',
}

const STATUS_MAP: Record<string, string> = {
  SCHEDULED:  'pendiente',
  TIMED:      'pendiente',
  IN_PLAY:    'en_curso',
  PAUSED:     'en_curso',
  FINISHED:   'finalizado',
  SUSPENDED:  'pendiente',
  POSTPONED:  'pendiente',
  CANCELLED:  'pendiente',
}

export interface PartidoNormalizado {
  id: number
  fase: string
  grupo: string | null
  equipo_local: string
  bandera_local: string
  equipo_visitante: string
  bandera_visitante: string
  fecha: string
  estadio: string | null
  ciudad: string | null
  goles_local: number | null
  goles_visitante: number | null
  estado: string
  minuto: number | null
  medio_tiempo: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeMatch(m: any): PartidoNormalizado {
  const homeCode = m.homeTeam?.tla ?? ''
  const awayCode = m.awayTeam?.tla ?? ''
  return {
    id:               m.id,
    fase:             STAGE_MAP[m.stage] ?? m.stage ?? 'grupos',
    grupo:            m.group ? m.group.replace('GROUP_', '') : null,
    equipo_local:     m.homeTeam?.shortName ?? m.homeTeam?.name ?? 'TBD',
    bandera_local:    iocToFlag(homeCode),
    equipo_visitante: m.awayTeam?.shortName ?? m.awayTeam?.name ?? 'TBD',
    bandera_visitante: iocToFlag(awayCode),
    fecha:            m.utcDate,
    estadio:          m.venue ?? null,
    ciudad:           null,
    goles_local:      m.score?.fullTime?.home ?? m.score?.regularTime?.home ?? null,
    goles_visitante:  m.score?.fullTime?.away ?? m.score?.regularTime?.away ?? null,
    estado:           STATUS_MAP[m.status] ?? 'pendiente',
    minuto:           m.minute ?? null,
    medio_tiempo:     m.status === 'PAUSED',
  }
}

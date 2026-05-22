'use client'

import { Gift } from 'lucide-react'

const PREMIOS = [
  { posicion: 1,  emoji: '🥇', titulo: '1° Lugar',  descripcion: 'Premio sorpresa especial' },
  { posicion: 2,  emoji: '🥈', titulo: '2° Lugar',  descripcion: 'Premio a confirmar' },
  { posicion: 3,  emoji: '🥉', titulo: '3° Lugar',  descripcion: 'Premio a confirmar' },
  { posicion: 4,  emoji: '🎖️', titulo: '4° Lugar',  descripcion: 'Premio a confirmar' },
  { posicion: 5,  emoji: '🎖️', titulo: '5° Lugar',  descripcion: 'Premio a confirmar' },
  { posicion: 6,  emoji: '🎁', titulo: '6° Lugar',  descripcion: 'Premio a confirmar' },
  { posicion: 7,  emoji: '🎁', titulo: '7° Lugar',  descripcion: 'Premio a confirmar' },
  { posicion: 8,  emoji: '🎁', titulo: '8° Lugar',  descripcion: 'Premio a confirmar' },
  { posicion: 9,  emoji: '🎁', titulo: '9° Lugar',  descripcion: 'Premio a confirmar' },
  { posicion: 10, emoji: '🎁', titulo: '10° Lugar', descripcion: 'Premio a confirmar' },
]

export default function TabPremios() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Premios</h2>
        <p className="text-gray-600 text-xs">Los premios se entregan al finalizar el Mundial 2026</p>
      </div>

      <div className="flex flex-col gap-3">
        {PREMIOS.map(({ posicion, emoji, titulo, descripcion }) => (
          <div
            key={posicion}
            className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
              posicion === 1
                ? 'bg-gradient-to-r from-yellow-900/30 to-yellow-800/10 border-yellow-600/40'
                : posicion === 2
                ? 'bg-gradient-to-r from-gray-700/30 to-gray-600/10 border-gray-500/40'
                : posicion === 3
                ? 'bg-gradient-to-r from-amber-900/30 to-amber-800/10 border-amber-700/40'
                : 'bg-white/5 border-white/8'
            }`}
          >
            <span className="text-2xl w-9 text-center shrink-0">{emoji}</span>
            <div className="flex-1 min-w-0">
              <p className={`font-bold text-sm ${
                posicion === 1 ? 'text-yellow-300' :
                posicion === 2 ? 'text-gray-300'   :
                posicion === 3 ? 'text-amber-500'  : 'text-white'
              }`}>{titulo}</p>
              <p className="text-gray-500 text-xs mt-0.5">{descripcion}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-900/10 border border-blue-500/20">
        <Gift className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-blue-300/80 text-xs leading-relaxed">
          Los premios definitivos serán anunciados próximamente. ¡Seguí sumando puntos con tus pronósticos!
        </p>
      </div>
    </div>
  )
}

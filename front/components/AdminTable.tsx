'use client'

import { useState, useMemo } from 'react'
import { Participante } from '@/types'
import { Search, Download, Users } from 'lucide-react'

interface AdminTableProps {
  participantes: Participante[]
}

export default function AdminTable({ participantes }: AdminTableProps) {
  const [search, setSearch] = useState('')
  const [eventoFilter, setEventoFilter] = useState('todos')

  const eventos = useMemo(() => {
    const set = new Set(participantes.map((p) => p.evento))
    return ['todos', ...Array.from(set)]
  }, [participantes])

  const filtered = useMemo(() => {
    return participantes.filter((p) => {
      const matchEvento = eventoFilter === 'todos' || p.evento === eventoFilter
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        p.nombre_completo.toLowerCase().includes(q) ||
        p.correo.toLowerCase().includes(q) ||
        p.procedencia.toLowerCase().includes(q) ||
        p.telefono.includes(q)
      return matchEvento && matchSearch
    })
  }, [participantes, search, eventoFilter])

  const exportCSV = () => {
    const headers = ['Nombre', 'Teléfono', 'Procedencia', 'Correo', 'Evento', 'Fecha']
    const rows = filtered.map((p) => [
      `"${p.nombre_completo}"`,
      `"${p.telefono}"`,
      `"${p.procedencia}"`,
      `"${p.correo}"`,
      `"${p.evento}"`,
      `"${new Date(p.created_at).toLocaleString('es-AR')}"`,
    ])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `penca-participantes-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Total registrados" value={participantes.length} icon={<Users className="w-5 h-5" />} />
        <StatCard label="Filtrados" value={filtered.length} icon={<Search className="w-5 h-5" />} />
        <StatCard
          label="Eventos"
          value={eventos.length - 1}
          icon={<span className="text-lg">🏆</span>}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, correo..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <select
          value={eventoFilter}
          onChange={(e) => setEventoFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          {eventos.map((e) => (
            <option key={e} value={e}>
              {e === 'todos' ? 'Todos los eventos' : e}
            </option>
          ))}
        </select>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Table - mobile: cards, desktop: table */}
      <div className="sm:hidden flex flex-col gap-3">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Sin resultados</p>
        ) : (
          filtered.map((p) => <ParticipanteCard key={p.id} p={p} />)
        )}
      </div>

      <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-700">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
            <tr>
              {['Nombre', 'Teléfono', 'Procedencia', 'Correo', 'Evento', 'Fecha'].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-500">
                  Sin resultados
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="bg-gray-900 hover:bg-gray-800/60 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{p.nombre_completo}</td>
                  <td className="px-4 py-3 text-gray-300">{p.telefono}</td>
                  <td className="px-4 py-3 text-gray-300">{p.procedencia}</td>
                  <td className="px-4 py-3 text-gray-300">{p.correo}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-300 text-xs">
                      {p.evento}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(p.created_at).toLocaleString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ParticipanteCard({ p }: { p: Participante }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-2">
        <span className="font-bold text-white">{p.nombre_completo}</span>
        <span className="px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-300 text-xs shrink-0">
          {p.evento}
        </span>
      </div>
      <span className="text-gray-400 text-sm">{p.correo}</span>
      <span className="text-gray-400 text-sm">{p.telefono}</span>
      <span className="text-gray-500 text-xs">{p.procedencia}</span>
      <span className="text-gray-600 text-xs">
        {new Date(p.created_at).toLocaleString('es-AR')}
      </span>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  className = '',
}: {
  label: string
  value: number
  icon: React.ReactNode
  className?: string
}) {
  return (
    <div className={`bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-center gap-3 ${className}`}>
      <div className="text-blue-400">{icon}</div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  )
}

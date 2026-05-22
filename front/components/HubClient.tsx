'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Trophy, Calendar, Settings, LogOut, User, Menu, X, BarChart2, ShieldCheck, Gift } from 'lucide-react'
import Link from 'next/link'
import TabRanking from './hub/TabRanking'
import TabPronosticos from './hub/TabPronosticos'
import TabAjustes from './hub/TabAjustes'
import TabResultados from './hub/TabResultados'
import TabPremios from './hub/TabPremios'

type Tab = 'ranking' | 'pronosticos' | 'resultados' | 'premios' | 'ajustes'

interface HubClientProps {
  nombre: string
  procedencia: string
  avatarUrl: string | null
  userEmail: string
  nombreVisible: string | null
  telefono: string
  isAdmin: boolean
}

const TABS = [
  { id: 'ranking'      as Tab, label: 'Ranking',      icon: Trophy    },
  { id: 'pronosticos'  as Tab, label: 'Pronósticos',  icon: Calendar  },
  { id: 'resultados'   as Tab, label: 'Resultados',   icon: BarChart2 },
  { id: 'premios'      as Tab, label: 'Premios',      icon: Gift      },
  { id: 'ajustes'      as Tab, label: 'Ajustes',      icon: Settings  },
]

export default function HubClient({ nombre, procedencia, avatarUrl, userEmail, nombreVisible: initialNombreVisible, telefono, isAdmin }: HubClientProps) {
  const [tab, setTab]           = useState<Tab>('ranking')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [nombreVisible, setNombreVisible] = useState<string | null>(initialNombreVisible)
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const firstName = nombre.split(' ')[0]

  const Avatar = () => avatarUrl ? (
    <img src={avatarUrl} alt={nombre} className="w-full h-full object-cover" />
  ) : (
    <User className="w-1/2 h-1/2 text-white" />
  )

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">

      {/* ── SIDEBAR (desktop) ── */}
      <aside className="hidden lg:flex flex-col w-72 min-h-screen bg-[#0d1118] border-r border-white/8 sticky top-0 h-screen">
        {/* Logo */}
        <div className="px-6 pt-8 pb-6 border-b border-white/8">
          <span className="text-sm font-black tracking-widest text-white uppercase">
            Conexa <span className="text-red-500">Penca</span>
          </span>
          <p className="text-gray-600 text-xs mt-0.5">Mundial 2026</p>
        </div>

        {/* Profile */}
        <div className="px-6 py-6 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shrink-0 overflow-hidden">
              <Avatar />
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm truncate">{nombre}</p>
              {procedencia && <p className="text-gray-500 text-xs truncate">📍 {procedencia}</p>}
              <p className="text-gray-600 text-xs truncate">{userEmail}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                tab === id
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Admin + Logout */}
        <div className="px-3 pb-6 flex flex-col gap-1">
          {isAdmin && (
            <Link
              href="/admin"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-yellow-500/80 hover:text-yellow-400 hover:bg-yellow-900/10 transition-all"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              Panel Admin
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:text-red-400 hover:bg-red-900/10 transition-all"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-10 w-72 bg-[#0d1118] border-r border-white/10 flex flex-col min-h-screen">
            <div className="px-6 pt-8 pb-6 border-b border-white/8 flex items-center justify-between">
              <span className="text-sm font-black tracking-widest text-white uppercase">
                Conexa <span className="text-red-500">Penca</span>
              </span>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-6 border-b border-white/8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shrink-0 overflow-hidden">
                  <Avatar />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-bold text-sm truncate">{nombre}</p>
                  {procedencia && <p className="text-gray-500 text-xs truncate">📍 {procedencia}</p>}
                </div>
              </div>
            </div>
            <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { setTab(id); setSidebarOpen(false) }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                    tab === id
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                      : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </button>
              ))}
            </nav>
            <div className="px-3 pb-6 flex flex-col gap-1">
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setSidebarOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-yellow-500/80 hover:text-yellow-400 hover:bg-yellow-900/10 transition-all"
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  Panel Admin
                </Link>
              )}
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:text-red-400 hover:bg-red-900/10 transition-all">
                <LogOut className="w-4 h-4 shrink-0" />
                Cerrar sesión
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-5 pt-8 pb-4 bg-gradient-to-b from-[#0d1b3e] to-transparent sticky top-0 z-10 bg-[#0a0a0f]">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-black tracking-widest text-white uppercase">
            Conexa <span className="text-red-500">Penca</span>
          </span>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center overflow-hidden">
            <Avatar />
          </div>
        </header>

        {/* Desktop page title */}
        <div className="hidden lg:flex items-center justify-between px-8 pt-8 pb-6 border-b border-white/8">
          <div>
            <h1 className="text-2xl font-black text-white">
              {tab === 'ranking'     ? '🏆 Ranking'     :
               tab === 'pronosticos' ? '🔮 Pronósticos' :
               tab === 'resultados'  ? '📊 Resultados'  :
               tab === 'premios'     ? '🎁 Premios'     : '⚙️ Ajustes'}
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {tab === 'ranking'     ? 'Tabla de posiciones · Mundial 2026'      :
               tab === 'pronosticos' ? 'Predecí los resultados de cada partido'  :
               tab === 'resultados'  ? 'Grupos, tabla y resultados de partidos'  :
               tab === 'premios'     ? '¿Qué te llevás si ganás?'                :
               `¡Hola, ${firstName}! Gestioná tu perfil`}
            </p>
          </div>
        </div>

        {/* Mobile tab nav */}
        <nav className="lg:hidden flex border-b border-white/10 px-2 bg-[#0a0a0f] sticky top-[60px] z-10">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-semibold transition-colors border-b-2 ${
                tab === id ? 'text-white border-blue-500' : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>

        {/* Tab content */}
        <main className="flex-1 px-5 py-6 lg:px-8 lg:py-8 max-w-4xl w-full">
          {tab === 'ranking'     && <TabRanking />}
          {tab === 'pronosticos' && <TabPronosticos userEmail={userEmail} nombreVisible={nombreVisible} onNombreVisibleSet={setNombreVisible} isAdmin={isAdmin} />}
          {tab === 'resultados'  && <TabResultados />}
          {tab === 'premios'     && <TabPremios />}
          {tab === 'ajustes'     && <TabAjustes nombre={nombre} userEmail={userEmail} avatarUrl={avatarUrl} telefono={telefono} nombreVisible={nombreVisible} />}
        </main>
      </div>
    </div>
  )
}

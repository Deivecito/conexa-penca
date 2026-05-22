import RegistroForm from '@/components/RegistroForm'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] flex flex-col lg:flex-row">
      {/* Blobs de fondo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-red-600/10 blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-64 h-64 rounded-full bg-red-800/8 blur-3xl" />
      </div>

      {/* ── COLUMNA IZQUIERDA: hero ── */}
      <div className="relative lg:flex-1 lg:flex lg:flex-col lg:justify-center lg:min-h-screen px-6 pt-14 pb-6 lg:px-16 xl:px-24 lg:pt-0 lg:pb-0 bg-gradient-to-b lg:bg-gradient-to-r from-[#0d1b3e]/80 via-[#0a0a0f] to-transparent">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left max-w-xl mx-auto lg:mx-0">

          <span className="px-3 py-1 rounded-full bg-blue-600/20 text-blue-300 text-xs font-semibold tracking-widest uppercase mb-5 border border-blue-500/30">
            Mundial 2026
          </span>

          <div className="text-5xl sm:text-6xl lg:text-7xl mb-5 animate-float select-none">⚽</div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white tracking-tight leading-[0.95]">
            CONEXA{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-400">
              PENCA
            </span>
          </h1>

          <p className="mt-4 text-gray-400 text-base lg:text-lg max-w-sm leading-relaxed">
            Registrate, predecí los resultados y competí contra todos. La penca del Mundial más épica te espera.
          </p>

          <div className="flex gap-2 mt-5 text-2xl lg:text-3xl">
            🇺🇸🇨🇦🇲🇽
          </div>

          {/* Stats — solo visible en desktop */}
          <div className="hidden lg:grid grid-cols-3 gap-4 mt-10 w-full max-w-sm">
            {[
              { value: '48', label: 'Selecciones' },
              { value: '104', label: 'Partidos' },
              { value: '∞', label: 'Emoción' },
            ].map(({ value, label }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <div className="text-2xl font-black text-white">{value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Features — solo visible en desktop */}
          <ul className="hidden lg:flex flex-col gap-3 mt-8 text-sm text-gray-400">
            {[
              '🏆 Ranking en tiempo real',
              '🔮 Pronósticos partido a partido',
              '🎖️ Puntos y posiciones actualizados',
            ].map((feat) => (
              <li key={feat}>{feat}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── COLUMNA DERECHA: formulario ── */}
      <div className="relative lg:w-[480px] xl:w-[520px] lg:flex lg:items-center lg:justify-center lg:min-h-screen px-5 pb-14 pt-2 lg:px-10 lg:py-12">
        <div className="w-full max-w-md">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 lg:p-8 shadow-2xl">
            <h2 className="text-xl lg:text-2xl font-bold text-white mb-1">Inscribite gratis</h2>
            <p className="text-gray-400 text-sm mb-6">Completá tus datos para participar</p>
            <RegistroForm />
          </div>
          <p className="text-center text-gray-600 text-xs mt-5">
            Tus datos son usados únicamente para gestionar la penca.
          </p>
        </div>
      </div>
    </main>
  )
}

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Loader2, Mail, CheckCircle2 } from 'lucide-react'

interface AuthOptionsProps {
  email: string
  nombre: string
}

export default function AuthOptions({ email, nombre }: AuthOptionsProps) {
  const [magicSent, setMagicSent] = useState(false)
  const [loadingMagic, setLoadingMagic] = useState(false)
  const [error, setError] = useState('')

  const handleMagicLink = async () => {
    setLoadingMagic(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/hub`,
        data: { nombre_completo: nombre },
      },
    })
    if (error) {
      setError('No se pudo enviar el link. Intentá de nuevo.')
    } else {
      setMagicSent(true)
    }
    setLoadingMagic(false)
  }

  if (magicSent) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-blue-900/40 flex items-center justify-center">
          <Mail className="w-8 h-8 text-blue-400" />
        </div>
        <h3 className="text-lg font-bold text-white">¡Revisá tu email!</h3>
        <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
          Te enviamos un link a{' '}
          <span className="text-white font-medium">{email}</span>.
          Hacé click ahí para entrar a tu hub.
        </p>
        <p className="text-gray-600 text-xs mt-1">Revisá spam si no aparece en unos segundos.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="flex flex-col items-center gap-2 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-400" />
        <h3 className="text-xl font-bold text-white">¡Estás anotado, {nombre.split(' ')[0]}!</h3>
        <p className="text-gray-400 text-sm">Te mandamos un link para acceder a tu hub</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-1">
        <span className="text-xs text-gray-500">Tu correo</span>
        <span className="text-white font-medium text-sm">{email}</span>
      </div>

      <button
        onClick={handleMagicLink}
        disabled={loadingMagic}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-base active:scale-95 transition-all duration-150 disabled:opacity-60"
      >
        {loadingMagic ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</>
        ) : (
          <><Mail className="w-5 h-5" /> Enviar link de acceso</>
        )}
      </button>

      {error && (
        <p className="text-red-400 text-sm text-center bg-red-900/20 rounded-lg p-3">{error}</p>
      )}
    </div>
  )
}

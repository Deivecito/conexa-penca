'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registroSchema, RegistroSchema } from '@/lib/validations'
import { Loader2, CheckCircle2, AlertCircle, Mail } from 'lucide-react'
import PhoneInput from './PhoneInput'
import AuthOptions from './AuthOptions'
import { createClient } from '@/lib/supabase'

export default function RegistroForm() {
  const [mode, setMode] = useState<'registro' | 'login'>('registro')
  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [registeredData, setRegisteredData] = useState<{ email: string; nombre: string } | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, touchedFields },
  } = useForm<RegistroSchema>({
    resolver: zodResolver(registroSchema),
    mode: 'onChange',
  })

  if (mode === 'login') {
    return <LoginMagicLink onBack={() => setMode('registro')} />
  }

  const onSubmit = async (data: RegistroSchema) => {
    setSubmitState('loading')
    setErrorMessage('')
    try {
      const res = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        setErrorMessage(json.error || 'Ocurrió un error. Intentá de nuevo.')
        setSubmitState('error')
        return
      }
      setRegisteredData({ email: data.correo, nombre: data.nombre_completo })
      setSubmitState('success')
      reset()
    } catch {
      setErrorMessage('Error de conexión. Verificá tu internet.')
      setSubmitState('error')
    }
  }

  if (submitState === 'success' && registeredData) {
    return <AuthOptions email={registeredData.email} nombre={registeredData.nombre} />
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <Field label="Nombre completo" error={errors.nombre_completo?.message} valid={!errors.nombre_completo && !!touchedFields.nombre_completo}>
        <input
          {...register('nombre_completo')}
          placeholder="Ej: Juan Pérez"
          className={inputClass(!!errors.nombre_completo, !errors.nombre_completo && !!touchedFields.nombre_completo)}
          autoComplete="name"
        />
      </Field>

      <Field label="Teléfono" error={errors.telefono?.message} valid={!errors.telefono && !!touchedFields.telefono}>
        <Controller
          name="telefono"
          control={control}
          render={({ field }) => (
            <PhoneInput
              value={field.value}
              onChange={field.onChange}
              error={!!errors.telefono}
              valid={!errors.telefono && !!touchedFields.telefono}
            />
          )}
        />
      </Field>

      <Field label="Procedencia (país / ciudad)" error={errors.procedencia?.message} valid={!errors.procedencia && !!touchedFields.procedencia}>
        <input
          {...register('procedencia')}
          placeholder="Ej: Paysandú, Uruguay"
          className={inputClass(!!errors.procedencia, !errors.procedencia && !!touchedFields.procedencia)}
        />
      </Field>

      <Field label="Correo electrónico" error={errors.correo?.message} valid={!errors.correo && !!touchedFields.correo}>
        <input
          {...register('correo')}
          type="email"
          placeholder="Ej: juan@email.com"
          className={inputClass(!!errors.correo, !errors.correo && !!touchedFields.correo)}
          autoComplete="email"
          inputMode="email"
        />
      </Field>

      {submitState === 'error' && (
        <p className="text-red-400 text-sm text-center bg-red-900/30 rounded-lg p-3">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={submitState === 'loading'}
        className="mt-2 w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-lg tracking-wide shadow-lg active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitState === 'loading' ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Registrando...
          </>
        ) : (
          '¡Quiero participar!'
        )}
      </button>

      <p className="text-center text-gray-600 text-sm mt-1">
        ¿Ya te registraste?{' '}
        <button
          type="button"
          onClick={() => setMode('login')}
          className="text-blue-400 hover:text-blue-300 font-semibold underline-offset-2 hover:underline transition-colors"
        >
          Ingresá acá
        </button>
      </p>
    </form>
  )
}

// ─── Login con magic link ─────────────────────────────────────────────────────

function LoginMagicLink({ onBack }: { onBack: () => void }) {
  const [email, setEmail]   = useState('')
  const [state, setState]   = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setState('loading')
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/hub` },
    })
    setState(error ? 'error' : 'sent')
  }

  if (state === 'sent') {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-blue-900/40 flex items-center justify-center">
          <Mail className="w-8 h-8 text-blue-400" />
        </div>
        <h3 className="text-lg font-bold text-white">¡Revisá tu email!</h3>
        <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
          Te enviamos un link a <span className="text-white font-medium">{email}</span>.
          Hacé click ahí para entrar.
        </p>
        <p className="text-gray-600 text-xs">Revisá spam si no aparece.</p>
        <button onClick={onBack} className="text-gray-600 hover:text-gray-400 text-xs mt-2 transition-colors">
          ← Volver al registro
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSend} className="flex flex-col gap-5 animate-fade-in">
      <div>
        <h3 className="text-white font-black text-lg">Ingresá a tu cuenta</h3>
        <p className="text-gray-400 text-sm mt-1">Te mandamos un link directo a tu correo</p>
      </div>

      <Field label="Tu correo electrónico">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="juan@email.com"
          required
          autoFocus
          className="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all"
        />
      </Field>

      {state === 'error' && (
        <p className="text-red-400 text-sm text-center bg-red-900/30 rounded-lg p-3">
          No se pudo enviar el link. Intentá de nuevo.
        </p>
      )}

      <button
        type="submit"
        disabled={state === 'loading' || !email}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-base active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {state === 'loading'
          ? <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</>
          : <><Mail className="w-5 h-5" /> Enviar link de acceso</>}
      </button>

      <button type="button" onClick={onBack} className="text-gray-600 hover:text-gray-400 text-sm text-center transition-colors">
        ← Volver al registro
      </button>
    </form>
  )
}

function Field({
  label, error, valid, children,
}: {
  label: string
  error?: string
  valid?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-200 tracking-wide">{label}</label>
      <div className="relative">
        {children}
        {valid && !error && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400 pointer-events-none" />
        )}
        {error && (
          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-400 pointer-events-none" />
        )}
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}

function inputClass(hasError: boolean, isValid?: boolean) {
  if (hasError) return 'w-full px-4 pr-10 py-3.5 rounded-xl bg-white/10 border border-red-500 text-white placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-red-500/40 transition-all duration-150'
  if (isValid)  return 'w-full px-4 pr-10 py-3.5 rounded-xl bg-white/10 border border-green-500 text-white placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-green-500/40 transition-all duration-150'
  return 'w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-150'
}

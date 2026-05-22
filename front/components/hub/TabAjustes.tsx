'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { containsProfanity } from '@/lib/profanity'
import { User, Camera, Loader2, CheckCircle2 } from 'lucide-react'

const NICK_REGEX = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_.\-]{2,30}$/

interface TabAjustesProps {
  nombre: string
  userEmail: string
  avatarUrl: string | null
  telefono: string
  nombreVisible: string | null
}

export default function TabAjustes({ nombre, userEmail, avatarUrl, telefono, nombreVisible: initialNick }: TabAjustesProps) {
  const [displayNombre, setDisplayNombre] = useState(nombre)
  const [displayTelefono, setDisplayTelefono] = useState(telefono)
  const [nick, setNick] = useState(initialNick ?? '')
  const [nickError, setNickError] = useState('')
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(avatarUrl)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen debe pesar menos de 2MB')
      return
    }

    setUploadingAvatar(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `avatars/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatares')
      .upload(path, file, { upsert: true })

    if (!uploadError) {
      const { data } = supabase.storage.from('avatares').getPublicUrl(path)
      setPreviewAvatar(data.publicUrl)
    }
    setUploadingAvatar(false)
  }

  const handleSave = async () => {
    setNickError('')
    const nickTrimmed = nick.trim()

    if (nickTrimmed) {
      if (!NICK_REGEX.test(nickTrimmed)) {
        setNickError('Solo letras, números, puntos, guiones y _ (2–30 caracteres)')
        return
      }
      if (containsProfanity(nickTrimmed)) {
        setNickError('Ese nickname no está permitido')
        return
      }
    }

    setSaving(true)

    const updates: Record<string, string | null> = {
      nombre_completo: displayNombre,
      avatar_url: previewAvatar,
      telefono: displayTelefono || telefono,
    }
    if (nickTrimmed) updates.nombre_visible = nickTrimmed

    const supabase = createClient()
    await supabase.from('participantes').update(updates).eq('correo', userEmail)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Mi perfil</h2>

      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          {previewAvatar ? (
            <img src={previewAvatar} alt="avatar" className="w-24 h-24 rounded-2xl object-cover" />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            {uploadingAvatar ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Camera className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        <p className="text-gray-600 text-xs">Tocá la cámara para cambiar tu foto</p>
      </div>

      {/* Nombre */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-300">Nombre</label>
        <input
          value={displayNombre}
          onChange={(e) => setDisplayNombre(e.target.value)}
          className="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
        />
      </div>

      {/* Nickname (ranking) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-300">
          Nickname del ranking
          <span className="ml-2 text-gray-600 font-normal text-xs">Visible para todos</span>
        </label>
        <input
          value={nick}
          onChange={(e) => { setNick(e.target.value); setNickError('') }}
          placeholder="Ej: ElPibe10"
          maxLength={30}
          className={`w-full px-4 py-3.5 rounded-xl bg-white/10 border text-white placeholder-gray-400 text-base focus:outline-none focus:ring-2 transition-all ${
            nickError ? 'border-red-500 focus:ring-red-500/40' : 'border-white/20 focus:ring-blue-500/50 focus:border-blue-400'
          }`}
        />
        {nickError && <p className="text-red-400 text-xs">{nickError}</p>}
      </div>

      {/* Teléfono */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-300">Teléfono</label>
        <input
          type="tel"
          inputMode="tel"
          value={displayTelefono}
          onChange={(e) => setDisplayTelefono(e.target.value)}
          className="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
        />
      </div>

      {/* Email (solo lectura) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-300">Correo</label>
        <div className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-gray-500 text-base">
          {userEmail}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || uploadingAvatar}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-base active:scale-95 transition-all duration-150 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {saving ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</>
        ) : saved ? (
          <><CheckCircle2 className="w-5 h-5" /> ¡Guardado!</>
        ) : (
          'Guardar cambios'
        )}
      </button>
    </div>
  )
}

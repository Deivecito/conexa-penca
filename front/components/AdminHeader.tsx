'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { LogOut, ArrowLeft } from 'lucide-react'

export default function AdminHeader({ userEmail }: { userEmail: string }) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link
          href="/hub"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Hub
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xl">⚽</span>
          <span className="font-bold text-white text-sm">Conexa Penca</span>
          <span className="hidden sm:inline text-gray-600 text-xs">/ Admin</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-gray-500 text-xs hidden sm:block">{userEmail}</span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Salir
        </button>
      </div>
    </header>
  )
}

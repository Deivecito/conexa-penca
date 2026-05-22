import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Conexa Penca – Mundial 2026',
  description: 'Registrate para la Penca del Mundial 2026 y competí con tus amigos.',
  openGraph: {
    title: 'Conexa Penca – Mundial 2026',
    description: 'Registrate para la Penca del Mundial 2026',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a0a0f',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className={`${inter.className} min-h-full`}>{children}</body>
    </html>
  )
}

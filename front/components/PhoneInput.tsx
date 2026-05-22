'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

const COUNTRIES = [
  { code: '+598', flag: '🇺🇾', name: 'Uruguay' },
  { code: '+54',  flag: '🇦🇷', name: 'Argentina' },
  { code: '+55',  flag: '🇧🇷', name: 'Brasil' },
  { code: '+595', flag: '🇵🇾', name: 'Paraguay' },
  { code: '+56',  flag: '🇨🇱', name: 'Chile' },
  { code: '+591', flag: '🇧🇴', name: 'Bolivia' },
  { code: '+34',  flag: '🇪🇸', name: 'España' },
  { code: '+1',   flag: '🇺🇸', name: 'EE.UU.' },
]

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  error?: boolean
  valid?: boolean
}

export default function PhoneInput({ value, onChange, error, valid }: PhoneInputProps) {
  const [selected, setSelected] = useState(COUNTRIES[0])
  const [open, setOpen] = useState(false)
  const [number, setNumber] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCountrySelect = (country: typeof COUNTRIES[0]) => {
    setSelected(country)
    setOpen(false)
    onChange(`${country.code} ${number}`.trim())
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d\s\-]/g, '')
    setNumber(raw)
    onChange(`${selected.code} ${raw}`.trim())
  }

  const borderClass = error
    ? 'border-red-500 focus-within:ring-red-500/50'
    : valid
    ? 'border-green-500 focus-within:ring-green-500/40'
    : 'border-white/20 focus-within:ring-blue-500/50 focus-within:border-blue-400'

  return (
    <div className={`relative flex rounded-xl bg-white/10 border transition-all duration-150 focus-within:ring-2 ${borderClass}`} ref={dropdownRef}>
      {/* Country selector */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-3.5 border-r border-white/20 shrink-0 text-white"
      >
        <span className="text-xl leading-none">{selected.flag}</span>
        <span className="text-sm font-medium">{selected.code}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Number input */}
      <input
        type="tel"
        inputMode="tel"
        value={number}
        onChange={handleNumberChange}
        placeholder="99 123 456"
        className="flex-1 px-3 py-3.5 bg-transparent text-white placeholder-gray-400 text-base focus:outline-none"
      />

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-2xl min-w-[200px]">
          {COUNTRIES.map((country) => (
            <button
              key={country.code}
              type="button"
              onClick={() => handleCountrySelect(country)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-800 transition-colors ${
                selected.code === country.code ? 'bg-blue-900/30 text-blue-300' : 'text-white'
              }`}
            >
              <span className="text-xl">{country.flag}</span>
              <span className="text-sm flex-1">{country.name}</span>
              <span className="text-xs text-gray-400">{country.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

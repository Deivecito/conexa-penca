export interface Participante {
  id: string
  nombre_completo: string
  nombre_visible: string | null
  avatar_url: string | null
  telefono: string
  procedencia: string
  correo: string
  evento: string
  created_at: string
}

export interface RegistroFormData {
  nombre_completo: string
  telefono: string
  procedencia: string
  correo: string
}

export interface AdminStats {
  total: number
  por_evento: Record<string, number>
}

import { z } from 'zod'

export const registroSchema = z.object({
  nombre_completo: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre es demasiado largo')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/, 'Solo se permiten letras y espacios'),
  telefono: z
    .string()
    .min(7, 'El teléfono debe tener al menos 7 dígitos')
    .max(20, 'El teléfono es demasiado largo')
    .regex(/^[+\d\s\-()]+$/, 'Formato de teléfono inválido'),
  procedencia: z
    .string()
    .min(2, 'Indica tu procedencia')
    .max(100, 'Demasiado largo'),
  correo: z
    .string()
    .email('Correo electrónico inválido')
    .max(150, 'El correo es demasiado largo'),
})

export type RegistroSchema = z.infer<typeof registroSchema>

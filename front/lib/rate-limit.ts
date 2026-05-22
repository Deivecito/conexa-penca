// In-memory rate limiter — funciona en Vercel Serverless (por instancia).
// Para escala real usar Upstash Redis, pero para una penca es más que suficiente.

const store = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true // permitido
  }

  if (entry.count >= limit) return false // bloqueado

  entry.count++
  return true
}

// Cloudflare pone la IP real en CF-Connecting-IP.
// Sin esto, el rate limiter vería siempre la IP de Cloudflare y bloquearía a todos.
export function getClientIp(headers: Headers): string {
  return (
    headers.get('cf-connecting-ip') ??
    headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    'unknown'
  )
}

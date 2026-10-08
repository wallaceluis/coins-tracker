/** Variáveis de ambiente do backend (configuradas na Vercel). */
export function env(name: string): string | undefined {
  const value = process.env[name]
  return value && value.trim() ? value.trim() : undefined
}

export function requireEnv(name: string): string {
  const value = env(name)
  if (!value) throw new Error(`Missing environment variable ${name}`)
  return value
}

/** URL pública do app, usada nos links dos e-mails. */
export const appUrl = () => (env('APP_URL') ?? 'http://localhost:5173').replace(/\/+$/, '')

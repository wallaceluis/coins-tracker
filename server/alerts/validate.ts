import { TICKER_PATTERN } from '../../shared/stock.js'
import type { Condition } from './evaluate.js'

export const FIATS = ['BRL', 'USD', 'EUR', 'GBP', 'JPY'] as const
export const MAX_ACTIVE_PER_EMAIL = 10
export const MAX_PENDING_PER_HOUR = 5

export interface AlertInput {
  email: string
  kind: 'crypto' | 'stock'
  symbol: string
  condition: Condition
  target: number
  currency: string
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const CRYPTO_ID = /^[a-z0-9-]{1,64}$/

export type Validation = { ok: true; value: AlertInput } | { ok: false; error: string }

/** Valida e normaliza o corpo de POST /api/alerts. */
export function validateAlertInput(body: unknown): Validation {
  if (!body || typeof body !== 'object') return { ok: false, error: 'invalid_body' }
  const b = body as Record<string, unknown>

  // Campo invisível no formulário: robôs costumam preencher tudo
  if (typeof b.website === 'string' && b.website) return { ok: false, error: 'invalid_body' }

  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : ''
  if (!EMAIL.test(email) || email.length > 254) return { ok: false, error: 'invalid_email' }

  const kind = b.kind
  if (kind !== 'crypto' && kind !== 'stock') return { ok: false, error: 'invalid_kind' }

  const rawSymbol = typeof b.symbol === 'string' ? b.symbol.trim() : ''
  const symbol = kind === 'stock' ? rawSymbol.toUpperCase() : rawSymbol.toLowerCase()
  if (kind === 'stock' ? !TICKER_PATTERN.test(symbol) : !CRYPTO_ID.test(symbol)) {
    return { ok: false, error: 'invalid_symbol' }
  }

  const condition = b.condition
  if (condition !== 'above' && condition !== 'below') return { ok: false, error: 'invalid_condition' }

  const target = typeof b.target === 'number' ? b.target : Number(b.target)
  if (!Number.isFinite(target) || target <= 0 || target > 1e12) return { ok: false, error: 'invalid_target' }

  const currency = kind === 'stock' ? 'BRL' : String(b.currency ?? '').toUpperCase()
  if (!(FIATS as readonly string[]).includes(currency)) return { ok: false, error: 'invalid_currency' }

  return { ok: true, value: { email, kind, symbol, condition, target, currency } }
}

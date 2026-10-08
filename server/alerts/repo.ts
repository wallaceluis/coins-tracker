import { randomBytes } from 'node:crypto'
import type { Sql } from '../db.js'
import type { Condition } from './evaluate.js'
import type { AlertInput } from './validate.js'
import { MAX_ACTIVE_PER_EMAIL, MAX_PENDING_PER_HOUR } from './validate.js'

export const newToken = () => randomBytes(24).toString('base64url')

export interface AlertRow {
  id: string
  email: string
  kind: 'crypto' | 'stock'
  symbol: string
  ticker: string
  name: string
  currency: string
  condition: Condition
  target: number
  token: string
  confirmed_at: Date | null
  triggered: boolean
  last_price: number | null
  last_sent_at: Date | null
  created_at: Date
}

// NUMERIC chega como string do driver; normaliza para número
const toRow = (r: Record<string, unknown>): AlertRow => ({
  ...(r as unknown as AlertRow),
  id: String(r.id),
  target: Number(r.target),
  last_price: r.last_price === null ? null : Number(r.last_price),
})

export type CreateResult = { ok: true; alert: AlertRow } | { ok: false; error: 'too_many_alerts' | 'too_many_requests' }

export async function createAlert(sql: Sql, input: AlertInput & { name: string; ticker: string }): Promise<CreateResult> {
  const [counts] = await sql<{ active: number; recent: number }[]>`
    SELECT
      count(*) FILTER (WHERE confirmed_at IS NOT NULL)::int AS active,
      count(*) FILTER (WHERE confirmed_at IS NULL AND created_at > now() - interval '1 hour')::int AS recent
    FROM alerts WHERE lower(email) = ${input.email}
  `
  if (counts!.active >= MAX_ACTIVE_PER_EMAIL) return { ok: false, error: 'too_many_alerts' }
  if (counts!.recent >= MAX_PENDING_PER_HOUR) return { ok: false, error: 'too_many_requests' }

  const [row] = await sql`
    INSERT INTO alerts (email, kind, symbol, ticker, name, currency, condition, target, token)
    VALUES (${input.email}, ${input.kind}, ${input.symbol}, ${input.ticker}, ${input.name}, ${input.currency},
            ${input.condition}, ${input.target}, ${newToken()})
    RETURNING *
  `
  return { ok: true, alert: toRow(row!) }
}

/** Confirma o alerta e devolve o token de gestão do e-mail (criado no primeiro uso). */
export async function confirmAlert(sql: Sql, token: string): Promise<{ alert: AlertRow; manageToken: string } | null> {
  const [row] = await sql`
    UPDATE alerts SET confirmed_at = coalesce(confirmed_at, now())
    WHERE token = ${token} RETURNING *
  `
  if (!row) return null
  const alert = toRow(row)
  const manageToken = await manageTokenFor(sql, alert.email)
  return { alert, manageToken }
}

export async function manageTokenFor(sql: Sql, email: string): Promise<string> {
  const [row] = await sql<{ manage_token: string }[]>`
    INSERT INTO subscribers (email, manage_token) VALUES (${email.toLowerCase()}, ${newToken()})
    ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
    RETURNING manage_token
  `
  return row!.manage_token
}

export async function alertsForManageToken(sql: Sql, manageToken: string): Promise<{ email: string; alerts: AlertRow[] } | null> {
  const [sub] = await sql<{ email: string }[]>`SELECT email FROM subscribers WHERE manage_token = ${manageToken}`
  if (!sub) return null
  const rows = await sql`
    SELECT * FROM alerts WHERE lower(email) = ${sub.email} AND confirmed_at IS NOT NULL ORDER BY created_at DESC
  `
  return { email: sub.email, alerts: rows.map(toRow) }
}

/** Remove um alerta pelo token do próprio alerta (link do e-mail) ou pelo token de gestão + id. */
export async function deleteAlertByToken(sql: Sql, token: string): Promise<boolean> {
  const rows = await sql`DELETE FROM alerts WHERE token = ${token} RETURNING id`
  return rows.length > 0
}

export async function deleteAlertForManager(sql: Sql, manageToken: string, id: string): Promise<boolean> {
  const rows = await sql`
    DELETE FROM alerts a USING subscribers s
    WHERE s.manage_token = ${manageToken} AND lower(a.email) = s.email AND a.id = ${id}
    RETURNING a.id
  `
  return rows.length > 0
}

export async function activeAlerts(sql: Sql): Promise<AlertRow[]> {
  const rows = await sql`SELECT * FROM alerts WHERE confirmed_at IS NOT NULL ORDER BY id`
  return rows.map(toRow)
}

export async function markChecked(sql: Sql, id: string, price: number, change: { triggered?: boolean; sent?: boolean }) {
  await sql`
    UPDATE alerts SET
      last_price = ${price},
      last_checked_at = now(),
      triggered = coalesce(${change.triggered ?? null}, triggered),
      last_sent_at = CASE WHEN ${change.sent ?? false} THEN now() ELSE last_sent_at END
    WHERE id = ${id}
  `
}

/** Pedidos nunca confirmados somem depois de 2 dias. */
export async function purgeUnconfirmed(sql: Sql) {
  await sql`DELETE FROM alerts WHERE confirmed_at IS NULL AND created_at < now() - interval '2 days'`
}

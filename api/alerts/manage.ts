import { db } from '../../server/db.js'
import { alertsForManageToken, deleteAlertForManager } from '../../server/alerts/repo.js'
import { json, param } from '../../server/http.js'

/** GET /api/alerts/manage?token=... → alertas ativos do e-mail dono do token. */
export async function GET(req: Request): Promise<Response> {
  const token = param(req, 'token')
  const data = token ? await alertsForManageToken(await db(), token) : null
  if (!data) return json({ error: 'invalid_token' }, 404)

  return json(
    {
      email: data.email,
      alerts: data.alerts.map((a) => ({
        id: a.id,
        kind: a.kind,
        symbol: a.symbol,
        name: a.name,
        currency: a.currency,
        condition: a.condition,
        target: a.target,
        triggered: a.triggered,
        lastPrice: a.last_price,
        lastSentAt: a.last_sent_at,
        createdAt: a.created_at,
      })),
    },
    200,
    { 'cache-control': 'no-store' },
  )
}

/** DELETE /api/alerts/manage?token=...&id=... */
export async function DELETE(req: Request): Promise<Response> {
  const token = param(req, 'token')
  const id = param(req, 'id')
  if (!token || !id || !/^\d+$/.test(id)) return json({ error: 'invalid_request' }, 400)
  const removed = await deleteAlertForManager(await db(), token, id)
  return removed ? json({ ok: true }) : json({ error: 'not_found' }, 404)
}

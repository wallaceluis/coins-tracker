import { timingSafeEqual } from 'node:crypto'
import { db } from '../../server/db.js'
import { env } from '../../server/env.js'
import { runCheck } from '../../server/alerts/check.js'
import { json } from '../../server/http.js'

function authorized(req: Request): boolean {
  const secret = env('CRON_SECRET')
  const header = req.headers.get('authorization') ?? ''
  if (!secret) return false
  const expected = Buffer.from(`Bearer ${secret}`)
  const given = Buffer.from(header)
  return expected.length === given.length && timingSafeEqual(expected, given)
}

/**
 * Chamado a cada 15 min pelo GitHub Actions (.github/workflows/alerts-cron.yml)
 * com `Authorization: Bearer $CRON_SECRET`.
 */
export async function POST(req: Request): Promise<Response> {
  if (!authorized(req)) return json({ error: 'unauthorized' }, 401)
  const summary = await runCheck(await db())
  console.log('[cron] check-alerts', JSON.stringify(summary))
  return json(summary)
}

export const GET = POST

import { db, hasDatabase } from '../../server/db.js'
import { appUrl } from '../../server/env.js'
import { createAlert } from '../../server/alerts/repo.js'
import { validateAlertInput } from '../../server/alerts/validate.js'
import { sendEmail } from '../../server/email/resend.js'
import { confirmationEmail } from '../../server/email/templates.js'
import { json } from '../../server/http.js'
import { QuoteError, fetchStock } from '../../server/quotes/brapi.js'
import { fetchCryptoInfo, fetchCryptoPrices } from '../../server/quotes/coingecko.js'

/**
 * POST /api/alerts  { email, kind, symbol, condition, target, currency }
 * Cria o alerta pendente e envia o e-mail de confirmação (double opt-in).
 */
export async function POST(req: Request): Promise<Response> {
  if (!hasDatabase()) return json({ error: 'alerts_disabled' }, 503)

  const parsed = validateAlertInput(await req.json().catch(() => null))
  if (!parsed.ok) return json({ error: parsed.error }, 400)
  const input = parsed.value

  // Confirma que o ativo existe e pega o nome e o preço atual para o e-mail
  let name: string
  let ticker: string
  let currentPrice: number | null = null
  try {
    if (input.kind === 'stock') {
      const quote = await fetchStock(input.symbol)
      name = quote.name
      ticker = quote.symbol
      currentPrice = quote.price
    } else {
      const found = await fetchCryptoInfo(input.symbol)
      if (!found) return json({ error: 'unknown_symbol' }, 400)
      name = found.name
      ticker = found.ticker
      const prices = await fetchCryptoPrices([input.symbol], [input.currency]).catch(() => ({}))
      currentPrice = (prices as Record<string, Record<string, number>>)[input.symbol]?.[input.currency.toLowerCase()] ?? null
    }
  } catch (err) {
    if (err instanceof QuoteError && err.status === 404) return json({ error: 'unknown_symbol' }, 400)
    console.error('[alerts] lookup failed', err)
    return json({ error: 'upstream_error' }, 502)
  }

  const sql = await db()
  const created = await createAlert(sql, { ...input, name, ticker })
  if (!created.ok) return json({ error: created.error }, 429)

  const confirm = `${appUrl()}/api/alerts/confirm?token=${created.alert.token}`
  try {
    await sendEmail({ to: input.email, ...confirmationEmail(created.alert, { confirm }, currentPrice) })
  } catch (err) {
    console.error('[alerts] confirmation email failed', err)
    await sql`DELETE FROM alerts WHERE id = ${created.alert.id}`
    return json({ error: 'email_failed' }, 502)
  }

  return json({ status: 'pending_confirmation' }, 202)
}

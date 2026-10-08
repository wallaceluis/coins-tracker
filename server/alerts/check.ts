import type { Sql } from '../db.js'
import { appUrl } from '../env.js'
import { sendEmail, type Email } from '../email/resend.js'
import { triggeredEmail } from '../email/templates.js'
import { isB3Open } from '../market-hours.js'
import { getStocks } from '../quotes/cache.js'
import { fetchCryptoPrices } from '../quotes/coingecko.js'
import { evaluate } from './evaluate.js'
import { activeAlerts, manageTokenFor, markChecked, purgeUnconfirmed, type AlertRow } from './repo.js'

export interface CheckSummary {
  checked: number
  notified: number
  rearmed: number
  skippedStocks: boolean
  errors: string[]
}

interface Deps {
  now?: Date
  fetchImpl?: typeof fetch
  send?: (email: Email) => Promise<void>
}

/**
 * Uma rodada do cron: busca os preços de todos os ativos com alerta e
 * dispara/rearma conforme `evaluate`. Fora do pregão, alertas de ações
 * ficam para a próxima rodada (o preço não muda e poupa a cota da brapi).
 */
export async function runCheck(sql: Sql, { now = new Date(), fetchImpl = fetch, send }: Deps = {}): Promise<CheckSummary> {
  const deliver = send ?? ((email: Email) => sendEmail(email, fetchImpl))
  const summary: CheckSummary = { checked: 0, notified: 0, rearmed: 0, skippedStocks: false, errors: [] }

  await purgeUnconfirmed(sql)
  const alerts = await activeAlerts(sql)
  const crypto = alerts.filter((a) => a.kind === 'crypto')
  const stocks = alerts.filter((a) => a.kind === 'stock')

  const prices = new Map<AlertRow, number>()

  if (crypto.length) {
    try {
      const ids = [...new Set(crypto.map((a) => a.symbol))]
      const currencies = [...new Set(crypto.map((a) => a.currency))]
      const data = await fetchCryptoPrices(ids, currencies, fetchImpl)
      for (const a of crypto) {
        const price = data[a.symbol]?.[a.currency.toLowerCase()]
        if (typeof price === 'number') prices.set(a, price)
      }
    } catch (err) {
      summary.errors.push(`crypto: ${(err as Error).message}`)
    }
  }

  if (stocks.length) {
    if (!isB3Open(now)) {
      summary.skippedStocks = true
    } else {
      try {
        const quotes = await getStocks([...new Set(stocks.map((a) => a.symbol))], { now, fetchImpl })
        const bySymbol = new Map(quotes.map((q) => [q.symbol, q.price]))
        for (const a of stocks) {
          const price = bySymbol.get(a.symbol)
          if (price !== undefined) prices.set(a, price)
        }
      } catch (err) {
        summary.errors.push(`stocks: ${(err as Error).message}`)
      }
    }
  }

  const base = appUrl()
  for (const [alert, price] of prices) {
    summary.checked++
    const decision = evaluate(alert, price)
    try {
      if (decision === 'notify') {
        const manage = await manageTokenFor(sql, alert.email)
        const email = triggeredEmail(alert, price, {
          unsubscribe: `${base}/api/alerts/unsubscribe?token=${alert.token}`,
          manage: `${base}/alertas?token=${manage}`,
          view: `${base}/?${alert.kind === 'stock' ? 'tab=stocks&' : ''}asset=${encodeURIComponent(alert.symbol)}`,
        })
        await deliver({ to: alert.email, ...email, unsubscribeUrl: `${base}/api/alerts/unsubscribe?token=${alert.token}` })
        await markChecked(sql, alert.id, price, { triggered: true, sent: true })
        summary.notified++
      } else if (decision === 'rearm') {
        await markChecked(sql, alert.id, price, { triggered: false })
        summary.rearmed++
      } else {
        await markChecked(sql, alert.id, price, {})
      }
    } catch (err) {
      // Falha no envio: não marca como disparado, tenta de novo na próxima rodada
      summary.errors.push(`alert ${alert.id}: ${(err as Error).message}`)
    }
  }

  return summary
}

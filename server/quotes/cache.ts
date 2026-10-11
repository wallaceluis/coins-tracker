import type { StockQuote } from '../../shared/stock.js'
import { db, hasDatabase } from '../db.js'
import { isB3Open } from '../market-hours.js'
import { fetchStock } from './brapi.js'

/** Quantas chamadas à brapi rodam ao mesmo tempo: em rajada ela recusa parte dos papéis. */
export const BRAPI_CONCURRENCY = 3

/** Busca os papéis em lotes pequenos e registra os que falharam. */
async function fetchMany(symbols: string[], fetchImpl: typeof fetch) {
  const results: PromiseSettledResult<StockQuote>[] = []
  for (let i = 0; i < symbols.length; i += BRAPI_CONCURRENCY) {
    const batch = symbols.slice(i, i + BRAPI_CONCURRENCY)
    results.push(...(await Promise.allSettled(batch.map((s) => fetchStock(s, fetchImpl)))))
  }
  results.forEach((r, i) => {
    if (r.status === 'rejected') console.warn('[quotes]', symbols[i], (r.reason as Error).message)
  })
  return results
}

/** Com o pregão aberto a cotação vale por 15 min; fechado, por 6 h. */
export const ttlMs = (now = new Date()) => (isB3Open(now) ? 15 : 6 * 60) * 60_000

/**
 * Lê as cotações do cache no Postgres e só chama a brapi para as vencidas.
 * Sem banco configurado, busca direto (o cache de CDN da Vercel ainda ajuda).
 * Erros por papel não derrubam a lista: o papel fica de fora (ou com o valor antigo).
 */
export async function getStocks(
  symbols: string[],
  { now = new Date(), fetchImpl = fetch }: { now?: Date; fetchImpl?: typeof fetch } = {},
): Promise<StockQuote[]> {
  const unique = [...new Set(symbols)]
  if (!hasDatabase()) {
    const results = await fetchMany(unique, fetchImpl)
    return results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []))
  }

  const sql = await db()
  const rows = await sql<{ symbol: string; data: StockQuote; fetched_at: Date }[]>`
    SELECT symbol, data, fetched_at FROM quote_cache WHERE symbol IN ${sql(unique)}
  `
  const cached = new Map(rows.map((r) => [r.symbol, r]))
  const maxAge = ttlMs(now)
  const stale = unique.filter((s) => {
    const row = cached.get(s)
    return !row || now.getTime() - new Date(row.fetched_at).getTime() > maxAge
  })

  const fresh = await fetchMany(stale, fetchImpl)
  const updated = new Map<string, StockQuote>()
  fresh.forEach((result, i) => {
    if (result.status === 'fulfilled') updated.set(stale[i]!, result.value)
  })

  if (updated.size) {
    const values = [...updated.values()].map((q) => ({
      symbol: q.symbol,
      data: sql.json(q as never),
    }))
    await sql`
      INSERT INTO quote_cache ${sql(values as never, 'symbol', 'data')}
      ON CONFLICT (symbol) DO UPDATE SET data = EXCLUDED.data, fetched_at = now()
    `
  }

  return unique.flatMap((s) => {
    const quote = updated.get(s) ?? cached.get(s)?.data
    return quote ? [quote] : []
  })
}

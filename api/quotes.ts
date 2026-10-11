import { DEFAULT_TICKERS, TICKER_PATTERN } from '../shared/stock.js'
import { json, param } from '../server/http.js'
import { getStocks } from '../server/quotes/cache.js'

const MAX_TICKERS = 20

/**
 * GET /api/quotes?tickers=PETR4,VALE3
 * Proxy da brapi: esconde o token e deixa a CDN da Vercel cachear a resposta.
 */
export async function GET(req: Request): Promise<Response> {
  const raw = param(req, 'tickers')
  const tickers = raw
    ? raw
        .split(',')
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean)
    : [...DEFAULT_TICKERS]

  if (tickers.length > MAX_TICKERS || tickers.some((t) => !TICKER_PATTERN.test(t))) {
    return json({ error: 'invalid_tickers' }, 400)
  }

  try {
    const quotes = await getStocks(tickers)
    // Lista completa: 5 min na CDN. Se faltou algum papel, guarda só 30 s para tentar de novo logo
    const complete = quotes.length === new Set(tickers).size
    return json({ quotes }, 200, {
      'cache-control': complete
        ? 'public, s-maxage=300, stale-while-revalidate=600'
        : 'public, s-maxage=30',
    })
  } catch (err) {
    console.error('[quotes]', err)
    return json({ error: 'upstream_error' }, 502)
  }
}

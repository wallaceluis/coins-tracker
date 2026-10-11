import { json, param } from '../server/http.js'
import { CoinGeckoError, fetchMarkets, MARKET_CURRENCIES } from '../server/quotes/coingecko.js'

const MAX_PER_PAGE = 50

/**
 * GET /api/markets?vs_currency=brl&per_page=20
 * Proxy da CoinGecko: a chave fica no servidor e a CDN da Vercel segura o volume,
 * então todos os visitantes dividem as mesmas poucas chamadas por minuto.
 */
export async function GET(req: Request): Promise<Response> {
  const currency = (param(req, 'vs_currency') ?? 'brl').toLowerCase()
  const perPage = Number(param(req, 'per_page') ?? 20)

  if (
    !(MARKET_CURRENCIES as readonly string[]).includes(currency) ||
    !Number.isInteger(perPage) ||
    perPage < 1 ||
    perPage > MAX_PER_PAGE
  ) {
    return json({ error: 'invalid_params' }, 400)
  }

  try {
    const coins = await fetchMarkets(currency, perPage)
    return json(coins, 200, {
      // 1 min na CDN, e serve a versão antiga enquanto revalida
      'cache-control': 'public, s-maxage=60, stale-while-revalidate=300',
    })
  } catch (err) {
    console.error('[markets]', err)
    const status = err instanceof CoinGeckoError && err.status === 429 ? 429 : 502
    return json({ error: status === 429 ? 'rate_limited' : 'upstream_error' }, status)
  }
}

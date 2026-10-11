import { json, param } from '../server/http.js'
import {
  CoinGeckoError,
  fetchCryptoHistory,
  HISTORY_DAYS,
  MARKET_CURRENCIES,
} from '../server/quotes/coingecko.js'

const CRYPTO_ID = /^[a-z0-9-]{1,64}$/

/**
 * GET /api/crypto-history?id=bitcoin&vs_currency=brl&days=30
 * Série de preços para o gráfico de 30 dias, 3 meses ou 1 ano, com a chave no servidor.
 */
export async function GET(req: Request): Promise<Response> {
  const id = param(req, 'id') ?? ''
  const currency = (param(req, 'vs_currency') ?? 'brl').toLowerCase()
  const days = Number(param(req, 'days'))

  if (
    !CRYPTO_ID.test(id) ||
    !(MARKET_CURRENCIES as readonly string[]).includes(currency) ||
    !(HISTORY_DAYS as readonly number[]).includes(days)
  ) {
    return json({ error: 'invalid_params' }, 400)
  }

  try {
    const prices = await fetchCryptoHistory(id, currency, days)
    return json({ prices }, 200, {
      // períodos longos mudam devagar: 10 min na CDN já basta
      'cache-control': 'public, s-maxage=600, stale-while-revalidate=1800',
    })
  } catch (err) {
    console.error('[crypto-history]', err)
    if (err instanceof CoinGeckoError && err.status === 404)
      return json({ error: 'not_found' }, 404)
    const status = err instanceof CoinGeckoError && err.status === 429 ? 429 : 502
    return json({ error: status === 429 ? 'rate_limited' : 'upstream_error' }, status)
  }
}

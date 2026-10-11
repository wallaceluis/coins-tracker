import { env } from '../env.js'

/**
 * Preço atual de várias moedas de uma vez, em várias moedas fiduciárias:
 * { bitcoin: { brl: 512000, usd: 95000 }, ... }
 */
export async function fetchCryptoPrices(
  ids: string[],
  currencies: string[],
  fetchImpl: typeof fetch = fetch,
): Promise<Record<string, Record<string, number>>> {
  if (!ids.length) return {}
  const params = new URLSearchParams({
    ids: ids.join(','),
    vs_currencies: currencies.map((c) => c.toLowerCase()).join(','),
  })
  const key = env('COINGECKO_API_KEY')
  const res = await fetchImpl(`https://api.coingecko.com/api/v3/simple/price?${params}`, {
    headers: key ? { 'x-cg-demo-api-key': key } : {},
    signal: AbortSignal.timeout(8_000),
  })
  if (!res.ok) throw new Error(`CoinGecko responded ${res.status}`)
  return (await res.json()) as Record<string, Record<string, number>>
}

/** Nome e ticker da moeda (para o e-mail); null quando o id não existe. */
export async function fetchCryptoInfo(
  id: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ name: string; ticker: string } | null> {
  const key = env('COINGECKO_API_KEY')
  const res = await fetchImpl(
    `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false`,
    { headers: key ? { 'x-cg-demo-api-key': key } : {}, signal: AbortSignal.timeout(8_000) },
  )
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`CoinGecko responded ${res.status}`)
  const body = (await res.json()) as { name?: string; symbol?: string }
  return body.name ? { name: body.name, ticker: (body.symbol ?? id).toUpperCase() } : null
}

/** Moedas fiduciárias aceitas em /api/markets (as mesmas do seletor do front). */
export const MARKET_CURRENCIES = ['brl', 'usd', 'eur', 'gbp', 'jpy'] as const

export class CoinGeckoError extends Error {
  constructor(readonly status: number) {
    super(`CoinGecko responded ${status}`)
    this.name = 'CoinGeckoError'
  }
}

/** Top moedas por valor de mercado, com sparkline de 7 dias (a lista da aba Cripto). */
export async function fetchMarkets(
  currency: string,
  perPage: number,
  fetchImpl: typeof fetch = fetch,
): Promise<unknown> {
  const params = new URLSearchParams({
    vs_currency: currency,
    order: 'market_cap_desc',
    per_page: String(perPage),
    page: '1',
    sparkline: 'true',
    price_change_percentage: '24h,7d',
  })
  const key = env('COINGECKO_API_KEY')
  const res = await fetchImpl(`https://api.coingecko.com/api/v3/coins/markets?${params}`, {
    headers: key ? { 'x-cg-demo-api-key': key } : {},
    signal: AbortSignal.timeout(8_000),
  })
  if (!res.ok) throw new CoinGeckoError(res.status)
  return res.json()
}

/** Períodos aceitos em /api/crypto-history (7 dias já vem no sparkline de /api/markets). */
export const HISTORY_DAYS = [30, 90, 365] as const
const MAX_POINTS = 180

/** Reduz a série para no máximo `max` pontos, mantendo o primeiro e o último. */
export function downsample(points: number[], max = MAX_POINTS): number[] {
  if (points.length <= max) return points
  const step = (points.length - 1) / (max - 1)
  return Array.from({ length: max }, (_, i) => points[Math.round(i * step)]!)
}

/** Preços de uma moeda no período, do mais antigo ao mais recente. */
export async function fetchCryptoHistory(
  id: string,
  currency: string,
  days: number,
  fetchImpl: typeof fetch = fetch,
): Promise<number[]> {
  const params = new URLSearchParams({ vs_currency: currency, days: String(days) })
  const key = env('COINGECKO_API_KEY')
  const res = await fetchImpl(
    `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}/market_chart?${params}`,
    { headers: key ? { 'x-cg-demo-api-key': key } : {}, signal: AbortSignal.timeout(8_000) },
  )
  if (!res.ok) throw new CoinGeckoError(res.status)
  const body = (await res.json()) as { prices?: [number, number][] }
  return downsample((body.prices ?? []).map((p) => p[1]))
}

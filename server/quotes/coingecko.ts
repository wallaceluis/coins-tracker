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

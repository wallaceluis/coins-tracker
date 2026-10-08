import type { Coin, FiatCode } from '@/types/market'

const BASE_URL = 'https://api.coingecko.com/api/v3'
// Opcional: a API pública funciona sem chave; uma chave "demo" só aumenta o limite.
const DEMO_KEY = import.meta.env.VITE_COINGECKO_API_KEY as string | undefined

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Top moedas por valor de mercado, já cotadas na moeda fiduciária pedida
 * (a CoinGecko converte do lado dela, sem precisar de API de câmbio).
 */
export async function fetchMarkets(
  currency: FiatCode,
  perPage = 20,
  signal?: AbortSignal,
): Promise<Coin[]> {
  const params = new URLSearchParams({
    vs_currency: currency.toLowerCase(),
    order: 'market_cap_desc',
    per_page: String(perPage),
    page: '1',
    sparkline: 'true',
    price_change_percentage: '24h,7d',
  })
  const headers: HeadersInit = DEMO_KEY ? { 'x-cg-demo-api-key': DEMO_KEY } : {}

  const res = await fetch(`${BASE_URL}/coins/markets?${params}`, { headers, signal })
  if (!res.ok) {
    throw new ApiError(res.status === 429 ? 'rate_limited' : 'request_failed', res.status)
  }
  return (await res.json()) as Coin[]
}

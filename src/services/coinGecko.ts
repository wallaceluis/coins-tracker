import type { Coin, FiatCode } from '@/types/market'

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
 * Passa pela nossa API (/api/markets), que guarda a chave da CoinGecko no servidor.
 */
export async function fetchMarkets(
  currency: FiatCode,
  perPage = 20,
  signal?: AbortSignal,
): Promise<Coin[]> {
  const params = new URLSearchParams({
    vs_currency: currency.toLowerCase(),
    per_page: String(perPage),
  })
  const res = await fetch(`/api/markets?${params}`, { signal })
  if (!res.ok) {
    throw new ApiError(res.status === 429 ? 'rate_limited' : 'request_failed', res.status)
  }
  return (await res.json()) as Coin[]
}

/** Preços de uma moeda em 30 dias, 3 meses ou 1 ano (/api/crypto-history). */
export async function fetchCryptoHistory(
  id: string,
  currency: FiatCode,
  days: number,
  signal?: AbortSignal,
): Promise<number[]> {
  const params = new URLSearchParams({
    id,
    vs_currency: currency.toLowerCase(),
    days: String(days),
  })
  const res = await fetch(`/api/crypto-history?${params}`, { signal })
  if (!res.ok) {
    throw new ApiError(res.status === 429 ? 'rate_limited' : 'request_failed', res.status)
  }
  return ((await res.json()) as { prices: number[] }).prices
}

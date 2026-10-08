import type { StockQuote } from '../../shared/stock.js'
import { env } from '../env.js'

const BASE_URL = 'https://brapi.dev/api'

export class QuoteError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'QuoteError'
  }
}

type Raw = Record<string, unknown>
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null)

/** Converte um item de `results` da brapi, tolerando campos ausentes. */
export function parseBrapiResult(raw: Raw): StockQuote | null {
  const symbol = str(raw.symbol)
  const price = num(raw.regularMarketPrice)
  if (!symbol || price === null) return null

  const history = Array.isArray(raw.historicalDataPrice)
    ? (raw.historicalDataPrice as Raw[])
        .map((p) => ({ date: num(p.date) ?? 0, close: num(p.close) }))
        .filter((p): p is { date: number; close: number } => p.close !== null)
        .sort((a, b) => a.date - b.date)
        .map((p) => p.close)
    : []

  const time = raw.regularMarketTime
  const updatedAt =
    typeof time === 'string' ? time : typeof time === 'number' ? new Date(time * 1000).toISOString() : null

  return {
    symbol,
    name: str(raw.longName) ?? str(raw.shortName) ?? symbol,
    logo: str(raw.logourl),
    currency: str(raw.currency) ?? 'BRL',
    price,
    changePercent: num(raw.regularMarketChangePercent),
    dayHigh: num(raw.regularMarketDayHigh),
    dayLow: num(raw.regularMarketDayLow),
    volume: num(raw.regularMarketVolume),
    marketCap: num(raw.marketCap),
    previousClose: num(raw.regularMarketPreviousClose),
    fiftyTwoWeekHigh: num(raw.fiftyTwoWeekHigh),
    fiftyTwoWeekLow: num(raw.fiftyTwoWeekLow),
    history,
    updatedAt,
  }
}

/**
 * Busca um papel por requisição: o plano grátis da brapi aceita um ativo por
 * chamada, então paralelizamos e deixamos o cache segurar o volume.
 */
export async function fetchStock(symbol: string, fetchImpl: typeof fetch = fetch): Promise<StockQuote> {
  const params = new URLSearchParams({ range: '1mo', interval: '1d' })
  const token = env('BRAPI_TOKEN')
  if (token) params.set('token', token)

  const res = await fetchImpl(`${BASE_URL}/quote/${encodeURIComponent(symbol)}?${params}`, {
    signal: AbortSignal.timeout(8_000),
  })
  if (res.status === 404) throw new QuoteError(`Ticker ${symbol} not found`, 404)
  if (!res.ok) throw new QuoteError(`brapi responded ${res.status}`, res.status)

  const body = (await res.json()) as { results?: Raw[] }
  const quote = body.results?.[0] ? parseBrapiResult(body.results[0]) : null
  if (!quote) throw new QuoteError(`Ticker ${symbol} not found`, 404)
  return quote
}

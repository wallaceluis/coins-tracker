import type { Coin } from './market'
import type { StockQuote } from '../../shared/stock'

export type AssetKind = 'crypto' | 'stock'

/** Períodos do gráfico, em dias. A brapi grátis vai até 3 meses; a CoinGecko, até 1 ano. */
export type PeriodDays = 7 | 30 | 90 | 365
export const STOCK_PERIODS: PeriodDays[] = [7, 30, 90]
export const CRYPTO_PERIODS: PeriodDays[] = [7, 30, 90, 365]

const DAY = 86_400

/** Variação % entre o primeiro e o último ponto da série. */
export function periodChange(history: number[]): number | null {
  const first = history[0]
  const last = history[history.length - 1]
  return first && last !== undefined ? ((last - first) / first) * 100 : null
}

/** Recorta a série diária da ação para o período (por data; sem datas, por pregões). */
export function sliceStockHistory(q: StockQuote, days: PeriodDays): number[] {
  const dates = q.historyDates
  if (dates?.length === q.history.length && dates.length) {
    const cutoff = dates[dates.length - 1]! - days * DAY
    return q.history.filter((_, i) => dates[i]! >= cutoff)
  }
  const tradingDays = Math.ceil((days * 5) / 7) + 1
  return q.history.slice(-tradingDays)
}

/** Visão comum de uma cripto ou ação, usada pela lista, pelo detalhe e pelo conversor. */
export interface Asset {
  kind: AssetKind
  /** id CoinGecko (bitcoin) ou ticker (PETR4): é o que vai para a API de alertas */
  id: string
  /** símbolo de exibição (BTC, PETR4) */
  symbol: string
  name: string
  image: string | null
  price: number
  currency: string
  rank: number | null
  changeDay: number | null
  changePeriod: number | null
  high: number | null
  low: number | null
  volume: number | null
  marketCap: number | null
  /** série do gráfico no período `historyDays` */
  history: number[]
  historyDays: PeriodDays
  extra: {
    label: 'supply' | 'ath' | 'week52High' | 'week52Low' | 'prevClose'
    value: number | null
    unit?: string
  }[]
}

/** `history` substitui o sparkline de 7 dias quando o usuário escolhe outro período. */
export function coinToAsset(
  c: Coin,
  currency: string,
  history?: { days: PeriodDays; prices: number[] } | null,
): Asset {
  return {
    kind: 'crypto',
    id: c.id,
    symbol: c.symbol.toUpperCase(),
    name: c.name,
    image: c.image,
    price: c.current_price,
    currency,
    rank: c.market_cap_rank,
    changeDay: c.price_change_percentage_24h,
    changePeriod: history
      ? periodChange(history.prices)
      : (c.price_change_percentage_7d_in_currency ?? null),
    high: c.high_24h,
    low: c.low_24h,
    volume: c.total_volume,
    marketCap: c.market_cap,
    history: history?.prices ?? c.sparkline_in_7d?.price ?? [],
    historyDays: history?.days ?? 7,
    extra: [
      { label: 'supply', value: c.circulating_supply, unit: c.symbol.toUpperCase() },
      { label: 'ath', value: c.ath },
    ],
  }
}

export function stockToAsset(q: StockQuote, days: PeriodDays = 30): Asset {
  const history = sliceStockHistory(q, days)
  return {
    kind: 'stock',
    id: q.symbol,
    symbol: q.symbol,
    name: q.name,
    image: q.logo,
    price: q.price,
    currency: q.currency || 'BRL',
    rank: null,
    changeDay: q.changePercent,
    changePeriod: periodChange(history),
    high: q.dayHigh,
    low: q.dayLow,
    volume: q.volume,
    marketCap: q.marketCap,
    history,
    historyDays: days,
    extra: [
      { label: 'week52High', value: q.fiftyTwoWeekHigh },
      { label: 'week52Low', value: q.fiftyTwoWeekLow },
    ],
  }
}

import type { Coin } from './market'
import type { StockQuote } from '../../shared/stock'

export type AssetKind = 'crypto' | 'stock'

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
  /** série do gráfico: 7 dias horários (cripto) ou 1 mês diário (ações) */
  history: number[]
  historyDays: 7 | 30
  extra: {
    label: 'supply' | 'ath' | 'week52High' | 'week52Low' | 'prevClose'
    value: number | null
    unit?: string
  }[]
}

export function coinToAsset(c: Coin, currency: string): Asset {
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
    changePeriod: c.price_change_percentage_7d_in_currency ?? null,
    high: c.high_24h,
    low: c.low_24h,
    volume: c.total_volume,
    marketCap: c.market_cap,
    history: c.sparkline_in_7d?.price ?? [],
    historyDays: 7,
    extra: [
      { label: 'supply', value: c.circulating_supply, unit: c.symbol.toUpperCase() },
      { label: 'ath', value: c.ath },
    ],
  }
}

export function stockToAsset(q: StockQuote): Asset {
  const first = q.history[0]
  const last = q.history[q.history.length - 1]
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
    changePeriod: first && last ? ((last - first) / first) * 100 : null,
    high: q.dayHigh,
    low: q.dayLow,
    volume: q.volume,
    marketCap: q.marketCap,
    history: q.history,
    historyDays: 30,
    extra: [
      { label: 'week52High', value: q.fiftyTwoWeekHigh },
      { label: 'week52Low', value: q.fiftyTwoWeekLow },
    ],
  }
}

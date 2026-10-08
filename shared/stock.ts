/** Cotação de um papel da B3, no formato que a API /api/quotes devolve ao front. */
export interface StockQuote {
  symbol: string
  name: string
  logo: string | null
  currency: string
  price: number
  changePercent: number | null
  dayHigh: number | null
  dayLow: number | null
  volume: number | null
  marketCap: number | null
  previousClose: number | null
  fiftyTwoWeekHigh: number | null
  fiftyTwoWeekLow: number | null
  /** Fechamentos diários do último mês, do mais antigo ao mais recente */
  history: number[]
  /** ISO 8601 do último negócio */
  updatedAt: string | null
}

/** Papéis mostrados por padrão na aba Bolsa. */
export const DEFAULT_TICKERS = [
  'PETR4',
  'VALE3',
  'ITUB4',
  'BBDC4',
  'BBAS3',
  'ABEV3',
  'WEGE3',
  'B3SA3',
  'MGLU3',
  'ITSA4',
  'RENT3',
  'SUZB3',
] as const

export const TICKER_PATTERN = /^[A-Z]{4}\d{1,2}[A-Z]?$/

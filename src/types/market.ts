/** Subconjunto do retorno de GET /coins/markets da CoinGecko que a UI usa. */
export interface Coin {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  total_volume: number
  high_24h: number | null
  low_24h: number | null
  price_change_percentage_24h: number | null
  price_change_percentage_7d_in_currency?: number | null
  circulating_supply: number | null
  ath: number | null
  sparkline_in_7d?: { price: number[] }
}

export type FiatCode = 'BRL' | 'USD' | 'EUR' | 'GBP' | 'JPY'

export const FIAT_CURRENCIES: FiatCode[] = ['BRL', 'USD', 'EUR', 'GBP', 'JPY']

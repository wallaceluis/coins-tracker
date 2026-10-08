import type { Coin } from '@/types/market'

/** Série de 7 dias determinística (sem Math.random) para testes reprodutíveis. */
export function series(start: number, end: number, points = 168, wobble = 0.02) {
  return Array.from({ length: points }, (_, i) => {
    const t = i / (points - 1)
    return start + (end - start) * t + start * wobble * Math.sin(i / 6)
  })
}

export function makeCoin(overrides: Partial<Coin> = {}): Coin {
  return {
    id: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
    image: 'https://example.com/btc.png',
    current_price: 500_000,
    market_cap: 9_900_000_000_000,
    market_cap_rank: 1,
    total_volume: 250_000_000_000,
    high_24h: 505_000,
    low_24h: 490_000,
    price_change_percentage_24h: 1.25,
    price_change_percentage_7d_in_currency: -2.5,
    circulating_supply: 19_800_000,
    ath: 600_000,
    sparkline_in_7d: { price: series(510_000, 500_000) },
    ...overrides,
  }
}

export const COINS: Coin[] = [
  makeCoin(),
  makeCoin({
    id: 'ethereum',
    symbol: 'eth',
    name: 'Ethereum',
    current_price: 18_000,
    market_cap_rank: 2,
    price_change_percentage_24h: -0.8,
  }),
  makeCoin({
    id: 'solana',
    symbol: 'sol',
    name: 'Solana',
    current_price: 900,
    market_cap_rank: 5,
    price_change_percentage_24h: 4.2,
  }),
]

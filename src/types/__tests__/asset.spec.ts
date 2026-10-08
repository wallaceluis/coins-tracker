import { describe, expect, it } from 'vitest'
import { coinToAsset, stockToAsset } from '../asset'
import { makeCoin } from '@/test/fixtures'
import type { StockQuote } from '../../../shared/stock'

describe('asset mappers', () => {
  it('maps a CoinGecko coin', () => {
    const asset = coinToAsset(makeCoin(), 'USD')
    expect(asset).toMatchObject({
      kind: 'crypto',
      id: 'bitcoin',
      symbol: 'BTC',
      currency: 'USD',
      rank: 1,
      historyDays: 7,
    })
  })

  it('maps a B3 quote and derives the 30-day change from the history', () => {
    const quote: StockQuote = {
      symbol: 'PETR4',
      name: 'Petrobras',
      logo: null,
      currency: 'BRL',
      price: 44,
      changePercent: 1.5,
      dayHigh: 45,
      dayLow: 43,
      volume: 10,
      marketCap: null,
      previousClose: 43.3,
      fiftyTwoWeekHigh: 50,
      fiftyTwoWeekLow: 30,
      history: [40, 42, 44],
      updatedAt: null,
    }
    const asset = stockToAsset(quote)
    expect(asset).toMatchObject({
      kind: 'stock',
      id: 'PETR4',
      symbol: 'PETR4',
      rank: null,
      historyDays: 30,
    })
    expect(asset.changePeriod).toBeCloseTo(10)
  })
})

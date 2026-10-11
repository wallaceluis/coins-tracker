import { describe, expect, it } from 'vitest'
import { coinToAsset, sliceStockHistory, stockToAsset } from '../asset'
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

  it('uses the longer crypto series and its change when a period is picked', () => {
    const asset = coinToAsset(makeCoin(), 'BRL', { days: 90, prices: [100, 150] })
    expect(asset.historyDays).toBe(90)
    expect(asset.history).toEqual([100, 150])
    expect(asset.changePeriod).toBeCloseTo(50)
  })

  it('slices the stock history by date for the chosen period', () => {
    const day = 86_400
    const quote = {
      history: [10, 20, 30, 40],
      historyDates: [0, 50 * day, 80 * day, 90 * day],
    } as unknown as StockQuote
    expect(sliceStockHistory(quote, 90)).toEqual([10, 20, 30, 40])
    expect(sliceStockHistory(quote, 30)).toEqual([30, 40])
    expect(sliceStockHistory(quote, 7)).toEqual([40])
  })
})

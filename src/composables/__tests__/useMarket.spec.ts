import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { useMarket } from '../useMarket'
import { COINS } from '@/test/fixtures'

const ok = (body: unknown): Promise<Response> =>
  Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))

function setup(refreshMs = 60_000) {
  const scope = effectScope()
  const market = scope.run(() => useMarket(refreshMs))!
  return { market, stop: () => scope.stop() }
}

describe('useMarket', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('loads coins and exposes the selected one', async () => {
    const fetchMock = vi.fn<(url: string) => Promise<Response>>(() => ok(COINS))
    vi.stubGlobal('fetch', fetchMock)
    const { market, stop } = setup()

    await market.refresh()

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(String(fetchMock.mock.calls[0]![0])).toContain('vs_currency=brl')
    expect(market.coins.value).toHaveLength(3)
    expect(market.selected.value?.id).toBe('bitcoin')
    expect(market.lastUpdated.value).toBeInstanceOf(Date)
    stop()
  })

  it('falls back to the first coin when the saved selection is gone', async () => {
    localStorage.setItem('ct:selected', 'dogecoin')
    vi.stubGlobal(
      'fetch',
      vi.fn(() => ok(COINS)),
    )
    const { market, stop } = setup()

    await market.refresh()

    expect(market.selectedId.value).toBe('bitcoin')
    stop()
  })

  it('keeps the last data and reports rate limiting', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => ok(COINS))
      .mockImplementationOnce(() => Promise.resolve(new Response('', { status: 429 })))
    vi.stubGlobal('fetch', fetchMock)
    const { market, stop } = setup()

    await market.refresh()
    await market.refresh()

    expect(market.error.value).toBe('rate_limited')
    expect(market.coins.value).toHaveLength(3)
    stop()
  })

  it('refetches when the currency changes and on the refresh interval', async () => {
    const fetchMock = vi.fn<(url: string) => Promise<Response>>(() => ok(COINS))
    vi.stubGlobal('fetch', fetchMock)
    const { market, stop } = setup(1_000)
    const lastUrl = () => String(fetchMock.mock.calls[fetchMock.mock.calls.length - 1]![0])

    market.currency.value = 'USD'
    await nextTick()
    expect(lastUrl()).toContain('vs_currency=usd')

    const before = fetchMock.mock.calls.length
    await vi.advanceTimersByTimeAsync(3_000)
    expect(fetchMock.mock.calls.length).toBe(before + 3)
    stop()
  })
})

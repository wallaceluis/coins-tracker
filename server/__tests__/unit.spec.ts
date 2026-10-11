// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GET as getMarkets } from '../../api/markets'
import { evaluate } from '../alerts/evaluate'
import { validateAlertInput } from '../alerts/validate'
import { confirmationEmail, money, triggeredEmail } from '../email/templates'
import { isB3Open } from '../market-hours'
import { fetchStock, parseBrapiResult } from '../quotes/brapi'
import { downsample } from '../quotes/coingecko'
import { GET as getCryptoHistory } from '../../api/crypto-history'
import { ttlMs } from '../quotes/cache'
import { DEFAULT_TICKERS, TICKER_PATTERN } from '../../shared/stock'

describe('evaluate', () => {
  const above = { condition: 'above' as const, target: 100, triggered: false }
  const below = { condition: 'below' as const, target: 100, triggered: false }

  it('notifies when the price crosses the target', () => {
    expect(evaluate(above, 99.9)).toBe('none')
    expect(evaluate(above, 100)).toBe('notify')
    expect(evaluate(below, 100.1)).toBe('none')
    expect(evaluate(below, 95)).toBe('notify')
  })

  it('does not notify again while the price stays past the target', () => {
    expect(evaluate({ ...above, triggered: true }, 120)).toBe('none')
  })

  it('rearms only after the price moves back by the margin', () => {
    expect(evaluate({ ...above, triggered: true }, 99.8)).toBe('none') // dentro da folga de 0,5%
    expect(evaluate({ ...above, triggered: true }, 99.4)).toBe('rearm')
    expect(evaluate({ ...below, triggered: true }, 100.3)).toBe('none')
    expect(evaluate({ ...below, triggered: true }, 100.6)).toBe('rearm')
  })
})

describe('validateAlertInput', () => {
  const base = {
    email: ' Wallace@Example.com ',
    kind: 'stock',
    symbol: 'petr4',
    condition: 'below',
    target: '35.5',
  }

  it('normalizes a valid stock alert (BRL forced)', () => {
    expect(validateAlertInput({ ...base, currency: 'USD' })).toEqual({
      ok: true,
      value: {
        email: 'wallace@example.com',
        kind: 'stock',
        symbol: 'PETR4',
        condition: 'below',
        target: 35.5,
        currency: 'BRL',
      },
    })
  })

  it('normalizes a crypto alert with its currency', () => {
    const r = validateAlertInput({ ...base, kind: 'crypto', symbol: 'Bitcoin', currency: 'usd' })
    expect(r.ok && r.value).toMatchObject({ symbol: 'bitcoin', currency: 'USD' })
  })

  it.each([
    [{ ...base, email: 'not-an-email' }, 'invalid_email'],
    [{ ...base, kind: 'forex' }, 'invalid_kind'],
    [{ ...base, symbol: 'PETRO' }, 'invalid_symbol'],
    [{ ...base, condition: 'equals' }, 'invalid_condition'],
    [{ ...base, target: -1 }, 'invalid_target'],
    [{ ...base, target: 'abc' }, 'invalid_target'],
    [{ ...base, kind: 'crypto', symbol: 'bitcoin', currency: 'ARS' }, 'invalid_currency'],
    [{ ...base, website: 'http://spam' }, 'invalid_body'],
    [null, 'invalid_body'],
  ])('rejects %j with %s', (body, error) => {
    expect(validateAlertInput(body)).toEqual({ ok: false, error })
  })
})

describe('isB3Open / ttlMs', () => {
  // 2026-10-08 é quinta-feira; Brasília = UTC-3
  it('is open on weekdays between 10:00 and 18:30 BRT', () => {
    expect(isB3Open(new Date('2026-10-08T12:59:00Z'))).toBe(false) // 09:59
    expect(isB3Open(new Date('2026-10-08T13:00:00Z'))).toBe(true) // 10:00
    expect(isB3Open(new Date('2026-10-08T21:30:00Z'))).toBe(true) // 18:30
    expect(isB3Open(new Date('2026-10-08T21:31:00Z'))).toBe(false)
    expect(isB3Open(new Date('2026-10-10T15:00:00Z'))).toBe(false) // sábado
  })

  it('caches longer while the market is closed', () => {
    expect(ttlMs(new Date('2026-10-08T15:00:00Z'))).toBe(15 * 60_000)
    expect(ttlMs(new Date('2026-10-10T15:00:00Z'))).toBe(6 * 60 * 60_000)
  })
})

describe('parseBrapiResult', () => {
  it('maps the brapi quote and sorts the history by date', () => {
    const quote = parseBrapiResult({
      symbol: 'PETR4',
      shortName: 'PETROBRAS PN',
      longName: 'Petróleo Brasileiro S.A. - Petrobras',
      currency: 'BRL',
      regularMarketPrice: 38.12,
      regularMarketChangePercent: -1.2,
      regularMarketDayHigh: 38.9,
      regularMarketDayLow: 37.8,
      regularMarketVolume: 1000,
      regularMarketTime: '2026-10-08T17:00:00.000Z',
      logourl: 'https://icons.brapi.dev/icons/PETR4.svg',
      historicalDataPrice: [
        { date: 3, close: 38.12 },
        { date: 1, close: 37 },
        { date: 2, close: null },
      ],
    })
    expect(quote).toMatchObject({
      symbol: 'PETR4',
      name: 'Petróleo Brasileiro S.A. - Petrobras',
      price: 38.12,
      changePercent: -1.2,
      marketCap: null,
      history: [37, 38.12],
      updatedAt: '2026-10-08T17:00:00.000Z',
    })
  })

  it('returns null without a symbol or price', () => {
    expect(parseBrapiResult({ symbol: 'X' })).toBeNull()
  })
})

describe('email templates', () => {
  const alert = {
    kind: 'crypto' as const,
    symbol: 'bitcoin',
    ticker: 'btc',
    name: 'Bitcoin',
    condition: 'above' as const,
    target: 600000,
    currency: 'BRL',
  }

  it('formats money in pt-BR', () => {
    expect(money(1234.5, 'BRL').replace(/ /g, ' ')).toBe('R$ 1.234,50')
  })

  it('builds the confirmation email with the link and current price', () => {
    const email = confirmationEmail(alert, { confirm: 'https://x/confirm?token=t' }, 512000)
    expect(email.subject).toBe('Confirme seu alerta de Bitcoin (BTC)')
    expect(email.html).toContain('https://x/confirm?token=t')
    expect(email.text).toContain('subir para R$')
  })

  it('escapes names in the triggered email', () => {
    const email = triggeredEmail({ ...alert, name: '<b>Evil</b>' }, 610000, {
      unsubscribe: 'u',
      manage: 'm',
      view: 'v',
    })
    expect(email.html).not.toContain('<b>Evil</b>')
    expect(email.subject).toContain('subiu para')
  })
})

describe('TICKER_PATTERN', () => {
  it('accepts every default ticker, including ones with digits like B3SA3', () => {
    for (const t of DEFAULT_TICKERS) expect(TICKER_PATTERN.test(t)).toBe(true)
    expect(TICKER_PATTERN.test('PETR4F')).toBe(true)
    expect(TICKER_PATTERN.test('TAEE11')).toBe(true)
  })

  it('rejects malformed tickers', () => {
    for (const t of ['PETR', '3BSA3', 'petr4', 'PETR4;', 'AB12'])
      expect(TICKER_PATTERN.test(t)).toBe(false)
  })
})

describe('GET /api/markets', () => {
  afterEach(() => vi.unstubAllGlobals())
  const call = (qs: string) => getMarkets(new Request(`https://x.test/api/markets${qs}`))

  it('proxies CoinGecko with a CDN cache header', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(new Response('[{"id":"bitcoin"}]', { status: 200 })),
    )
    vi.stubGlobal('fetch', fetchMock)

    const res = await call('?vs_currency=USD&per_page=20')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([{ id: 'bitcoin' }])
    expect(res.headers.get('cache-control')).toContain('s-maxage=60')
    expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toContain('vs_currency=usd')
  })

  it('rejects unknown currencies and page sizes', async () => {
    vi.stubGlobal('fetch', vi.fn())
    expect((await call('?vs_currency=xyz')).status).toBe(400)
    expect((await call('?per_page=500')).status).toBe(400)
  })

  it('passes rate limiting through as 429', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('', { status: 429 }))),
    )
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await call('')).status).toBe(429)
  })
})

describe('fetchStock', () => {
  const body = {
    results: [
      {
        symbol: 'PETR4',
        regularMarketPrice: 40,
        historicalDataPrice: [
          { date: 200, close: 41 },
          { date: 100, close: 40 },
        ],
      },
    ],
  }

  it('asks for 3 months and keeps the dates of each close', async () => {
    const fetchMock = vi.fn<(url: string) => Promise<Response>>(() =>
      Promise.resolve(new Response(JSON.stringify(body))),
    )
    const quote = await fetchStock('PETR4', fetchMock as unknown as typeof fetch)
    expect(fetchMock.mock.calls[0]![0]).toContain('range=3mo')
    expect(quote.history).toEqual([40, 41])
    expect(quote.historyDates).toEqual([100, 200])
  })

  it('falls back to 1 month when the plan refuses the range', async () => {
    const fetchMock = vi
      .fn<
        (url: string) => Promise<Response>
      >(() => Promise.resolve(new Response(JSON.stringify(body))))
      .mockImplementationOnce(() => Promise.resolve(new Response('', { status: 403 })))
    await fetchStock('PETR4', fetchMock as unknown as typeof fetch)
    expect(fetchMock.mock.calls[1]![0]).toContain('range=1mo')
  })
})

describe('downsample', () => {
  it('keeps short series and caps long ones, preserving the ends', () => {
    expect(downsample([1, 2, 3], 5)).toEqual([1, 2, 3])
    const long = Array.from({ length: 1000 }, (_, i) => i)
    const out = downsample(long, 10)
    expect(out).toHaveLength(10)
    expect(out[0]).toBe(0)
    expect(out[9]).toBe(999)
  })
})

describe('GET /api/crypto-history', () => {
  afterEach(() => vi.unstubAllGlobals())
  const call = (qs: string) =>
    getCryptoHistory(new Request(`https://x.test/api/crypto-history${qs}`))

  it('returns the price series for a valid period', async () => {
    const prices = [
      [1, 10],
      [2, 11],
    ]
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(JSON.stringify({ prices })))),
    )
    const res = await call('?id=bitcoin&vs_currency=brl&days=90')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ prices: [10, 11] })
  })

  it('rejects unsupported periods and ids', async () => {
    vi.stubGlobal('fetch', vi.fn())
    expect((await call('?id=bitcoin&days=7')).status).toBe(400)
    expect((await call('?id=Bit%20coin&days=30')).status).toBe(400)
  })
})

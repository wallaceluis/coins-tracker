// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { evaluate } from '../alerts/evaluate'
import { validateAlertInput } from '../alerts/validate'
import { confirmationEmail, money, triggeredEmail } from '../email/templates'
import { isB3Open } from '../market-hours'
import { parseBrapiResult } from '../quotes/brapi'
import { ttlMs } from '../quotes/cache'

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
  const base = { email: ' Wallace@Example.com ', kind: 'stock', symbol: 'petr4', condition: 'below', target: '35.5' }

  it('normalizes a valid stock alert (BRL forced)', () => {
    expect(validateAlertInput({ ...base, currency: 'USD' })).toEqual({
      ok: true,
      value: { email: 'wallace@example.com', kind: 'stock', symbol: 'PETR4', condition: 'below', target: 35.5, currency: 'BRL' },
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
  const alert = { kind: 'crypto' as const, symbol: 'bitcoin', ticker: 'btc', name: 'Bitcoin', condition: 'above' as const, target: 600000, currency: 'BRL' }

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
    const email = triggeredEmail({ ...alert, name: '<b>Evil</b>' }, 610000, { unsubscribe: 'u', manage: 'm', view: 'v' })
    expect(email.html).not.toContain('<b>Evil</b>')
    expect(email.subject).toContain('subiu para')
  })
})

// @vitest-environment node
/**
 * Fluxo completo dos alertas contra um Postgres real, com CoinGecko, brapi e
 * Resend simulados. Pulado sem TEST_DATABASE_URL (o CI sobe um Postgres).
 *
 *   TEST_DATABASE_URL=postgres://postgres@localhost:5432/market_test npm test
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const url = process.env.TEST_DATABASE_URL

type Sent = { to: string[]; subject: string; html: string; text: string; headers: Record<string, string> }

describe.skipIf(!url)('alerts end to end (real Postgres)', () => {
  const sent: Sent[] = []
  const prices = { bitcoin: 500_000, PETR4: 38 }
  let brapiCalls = 0

  // Rotas falsas das APIs externas
  const fakeFetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const href = String(input instanceof Request ? input.url : input)
    const u = new URL(href)
    if (u.hostname === 'api.resend.com') {
      sent.push(JSON.parse(String(init?.body)))
      return Response.json({ id: 'email-1' })
    }
    if (u.pathname.endsWith('/simple/price')) {
      return Response.json({ bitcoin: { brl: prices.bitcoin, usd: prices.bitcoin / 5 } })
    }
    if (u.pathname.startsWith('/api/v3/coins/')) {
      const id = u.pathname.split('/').pop()
      return id === 'bitcoin' ? Response.json({ name: 'Bitcoin', symbol: 'btc' }) : new Response('', { status: 404 })
    }
    if (u.hostname === 'brapi.dev') {
      brapiCalls++
      const ticker = u.pathname.split('/').pop()
      if (ticker !== 'PETR4') return new Response('', { status: 404 })
      return Response.json({
        results: [{ symbol: 'PETR4', longName: 'Petrobras', regularMarketPrice: prices.PETR4, historicalDataPrice: [] }],
      })
    }
    throw new Error(`unexpected fetch ${href}`)
  })

  let handlers: {
    createAlert: (req: Request) => Promise<Response>
    confirm: (req: Request) => Promise<Response>
    manageGet: (req: Request) => Promise<Response>
    manageDelete: (req: Request) => Promise<Response>
    unsubscribe: (req: Request) => Promise<Response>
    cron: (req: Request) => Promise<Response>
    quotes: (req: Request) => Promise<Response>
  }
  let sql: import('../db').Sql
  let closeDb: () => Promise<void>

  const post = (body: unknown) =>
    handlers.createAlert(new Request('http://t/api/alerts', { method: 'POST', body: JSON.stringify(body) }))
  const cron = (auth = 'Bearer s3cret') =>
    handlers.cron(new Request('http://t/api/cron/check-alerts', { method: 'POST', headers: { authorization: auth } }))
  const lastLink = (pattern: RegExp) => {
    const match = sent[sent.length - 1]!.text.match(pattern)
    return new URL(match![0])
  }

  beforeAll(async () => {
    Object.assign(process.env, {
      DATABASE_URL: url,
      RESEND_API_KEY: 're_test',
      APP_URL: 'https://app.test',
      CRON_SECRET: 's3cret',
    })
    vi.stubGlobal('fetch', fakeFetch)
    const dbModule = await import('../db')
    closeDb = dbModule.closeDb
    sql = await dbModule.db()
    await sql`DROP TABLE IF EXISTS alerts, subscribers, quote_cache`
    await closeDb()
    sql = await dbModule.db() // recria o esquema do zero

    const manage = await import('../../api/alerts/manage')
    const unsub = await import('../../api/alerts/unsubscribe')
    handlers = {
      createAlert: (await import('../../api/alerts/index')).POST,
      confirm: (await import('../../api/alerts/confirm')).GET,
      manageGet: manage.GET,
      manageDelete: manage.DELETE,
      unsubscribe: unsub.GET,
      cron: (await import('../../api/cron/check-alerts')).POST,
      quotes: (await import('../../api/quotes')).GET,
    }
  })

  beforeEach(() => {
    sent.length = 0
    vi.useRealTimers()
  })

  afterAll(async () => {
    vi.unstubAllGlobals()
    await closeDb?.()
  })

  it('creates a pending alert and emails a confirmation link', async () => {
    const res = await post({ email: 'Ana@Example.com', kind: 'crypto', symbol: 'bitcoin', condition: 'above', target: 550000, currency: 'BRL' })
    expect(res.status).toBe(202)
    expect(sent).toHaveLength(1)
    expect(sent[0]!.to).toEqual(['ana@example.com'])
    expect(sent[0]!.subject).toBe('Confirme seu alerta de Bitcoin (BTC)')

    const [row] = await sql`SELECT confirmed_at, ticker FROM alerts`
    expect(row).toMatchObject({ confirmed_at: null, ticker: 'BTC' })
  })

  it('ignores unconfirmed alerts in the cron run', async () => {
    prices.bitcoin = 560_000
    const summary = await (await cron()).json()
    expect(summary.checked).toBe(0)
    expect(sent).toHaveLength(0)
  })

  it('confirms through the email link and redirects to the manage page', async () => {
    await post({ email: 'ana@example.com', kind: 'crypto', symbol: 'bitcoin', condition: 'above', target: 550000, currency: 'BRL' })
    const link = lastLink(/https:\/\/app\.test\/api\/alerts\/confirm\?token=\S+/)
    const res = await handlers.confirm(new Request(link))

    expect(res.status).toBe(303)
    const location = new URL(res.headers.get('location')!)
    expect(location.pathname).toBe('/alertas')
    expect(location.searchParams.get('status')).toBe('confirmed')

    const manage = await handlers.manageGet(new Request(`http://t/api/alerts/manage?token=${location.searchParams.get('token')}`))
    const data = await manage.json()
    expect(data.email).toBe('ana@example.com')
    expect(data.alerts).toHaveLength(1)
    expect(data.alerts[0]).toMatchObject({ symbol: 'bitcoin', condition: 'above', target: 550000 })
  })

  it('sends one email when the price crosses, then stays quiet', async () => {
    prices.bitcoin = 560_000
    const first = await (await cron()).json()
    expect(first).toMatchObject({ checked: 1, notified: 1 })
    expect(sent[0]!.subject).toMatch(/^Bitcoin \(BTC\) subiu para R\$/)
    expect(sent[0]!.headers['List-Unsubscribe']).toMatch(/\/api\/alerts\/unsubscribe\?token=/)

    const second = await (await cron()).json()
    expect(second).toMatchObject({ checked: 1, notified: 0 })
    expect(sent).toHaveLength(1)
  })

  it('rearms after the price goes back and notifies on the next cross', async () => {
    prices.bitcoin = 540_000
    expect(await (await cron()).json()).toMatchObject({ rearmed: 1 })
    prices.bitcoin = 551_000
    expect(await (await cron()).json()).toMatchObject({ notified: 1 })
  })

  it('removes the alert through the unsubscribe link', async () => {
    const [alert] = await sql`SELECT token FROM alerts WHERE confirmed_at IS NOT NULL`
    const res = await handlers.unsubscribe(new Request(`https://app.test/api/alerts/unsubscribe?token=${alert!.token}`))
    expect(new URL(res.headers.get('location')!).searchParams.get('status')).toBe('removed')
    const [{ count }] = await sql`SELECT count(*)::int AS count FROM alerts WHERE confirmed_at IS NOT NULL`
    expect(count).toBe(0)
  })

  it('checks stock alerts only during B3 trading hours, using the quote cache', async () => {
    await post({ email: 'bia@example.com', kind: 'stock', symbol: 'petr4', condition: 'below', target: 36 })
    await handlers.confirm(new Request(lastLink(/https:\/\/app\.test\/api\/alerts\/confirm\?token=\S+/)))
    prices.PETR4 = 35.5

    vi.useFakeTimers({ now: new Date('2026-10-10T15:00:00Z'), toFake: ['Date'] }) // sábado
    expect(await (await cron()).json()).toMatchObject({ skippedStocks: true, notified: 0 })

    vi.setSystemTime(new Date('2026-10-08T15:00:00Z')) // quinta, 12h BRT
    const callsBefore = brapiCalls
    expect(await (await cron()).json()).toMatchObject({ notified: 1 })
    expect(sent[sent.length - 1]!.subject).toMatch(/^PETR4 caiu para R\$/)

    await cron() // dentro do TTL de 15 min: não chama a brapi de novo
    expect(brapiCalls).toBe(callsBefore + 1)
  })

  it('deletes an alert from the manage page only with the right token', async () => {
    const [sub] = await sql`SELECT manage_token FROM subscribers WHERE email = 'bia@example.com'`
    const [alert] = await sql`SELECT id FROM alerts WHERE email = 'bia@example.com'`
    const wrong = await handlers.manageDelete(new Request(`http://t/api/alerts/manage?token=nope&id=${alert!.id}`, { method: 'DELETE' }))
    expect(wrong.status).toBe(404)
    const ok = await handlers.manageDelete(new Request(`http://t/api/alerts/manage?token=${sub!.manage_token}&id=${alert!.id}`, { method: 'DELETE' }))
    expect(ok.status).toBe(200)
  })

  it('rejects unknown assets, bad input and too many pending requests', async () => {
    expect((await post({ email: 'c@example.com', kind: 'stock', symbol: 'ZZZZ3', condition: 'above', target: 1 })).status).toBe(400)
    expect((await post({ email: 'c@example.com', kind: 'crypto', symbol: 'nope-coin', condition: 'above', target: 1, currency: 'BRL' })).status).toBe(400)
    expect((await post({ email: 'bad', kind: 'stock', symbol: 'PETR4', condition: 'above', target: 1 })).status).toBe(400)

    const body = { email: 'd@example.com', kind: 'stock', symbol: 'PETR4', condition: 'above', target: 50 }
    const statuses = []
    for (let i = 0; i < 6; i++) statuses.push((await post(body)).status)
    expect(statuses).toEqual([202, 202, 202, 202, 202, 429])
  })

  it('requires the cron secret', async () => {
    expect((await cron('Bearer wrong')).status).toBe(401)
    expect((await cron('')).status).toBe(401)
  })

  it('serves stock quotes and validates tickers', async () => {
    const ok = await handlers.quotes(new Request('http://t/api/quotes?tickers=petr4'))
    expect(ok.headers.get('cache-control')).toContain('s-maxage')
    expect((await ok.json()).quotes[0]).toMatchObject({ symbol: 'PETR4' })
    expect((await handlers.quotes(new Request('http://t/api/quotes?tickers=DROP;TABLE'))).status).toBe(400)
  })
})

import type { StockQuote } from '../../shared/stock'

/** Cotações da B3 pela nossa API (/api/quotes), que esconde o token da brapi. */
export async function fetchStocks(tickers?: string[], signal?: AbortSignal): Promise<StockQuote[]> {
  const query = tickers?.length ? `?tickers=${tickers.join(',')}` : ''
  const res = await fetch(`/api/quotes${query}`, { signal })
  if (!res.ok) throw new Error(res.status === 429 ? 'rate_limited' : 'request_failed')
  const body = (await res.json()) as { quotes: StockQuote[] }
  return body.quotes
}

export type AlertRequest = {
  email: string
  kind: 'crypto' | 'stock'
  symbol: string
  condition: 'above' | 'below'
  target: number
  currency: string
  website?: string
}

/** Cria o alerta (pendente até a confirmação por e-mail). Lança com o código de erro da API. */
export async function createAlert(body: AlertRequest): Promise<void> {
  const res = await fetch('/api/alerts', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error ?? 'request_failed')
  }
}

export type ManagedAlert = {
  id: string
  kind: 'crypto' | 'stock'
  symbol: string
  name: string
  currency: string
  condition: 'above' | 'below'
  target: number
  triggered: boolean
  lastPrice: number | null
  lastSentAt: string | null
  createdAt: string
}

export async function fetchManagedAlerts(
  token: string,
): Promise<{ email: string; alerts: ManagedAlert[] }> {
  const res = await fetch(`/api/alerts/manage?token=${encodeURIComponent(token)}`)
  if (!res.ok) throw new Error('invalid_token')
  return res.json()
}

export async function deleteManagedAlert(token: string, id: string): Promise<void> {
  const res = await fetch(`/api/alerts/manage?token=${encodeURIComponent(token)}&id=${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('delete_failed')
}

import { env, requireEnv } from '../env.js'

export interface Email {
  to: string
  subject: string
  html: string
  text: string
  /** Link de descadastro de um clique (Gmail e Outlook mostram o botão) */
  unsubscribeUrl?: string
}

/** Envia pela API REST do Resend (sem SDK). */
export async function sendEmail(email: Email, fetchImpl: typeof fetch = fetch): Promise<void> {
  const headers: Record<string, string> = {}
  if (email.unsubscribeUrl) {
    headers['List-Unsubscribe'] = `<${email.unsubscribeUrl}>`
    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click'
  }

  const res = await fetchImpl('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${requireEnv('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env('ALERTS_FROM') ?? 'Market Tracker <alertas@wallaceluis.com.br>',
      to: [email.to],
      subject: email.subject,
      html: email.html,
      text: email.text,
      headers,
    }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Resend responded ${res.status}: ${detail.slice(0, 200)}`)
  }
}

import type { Condition } from '../alerts/evaluate.js'

export interface AlertSummary {
  kind: 'crypto' | 'stock'
  symbol: string
  /** Símbolo de exibição (BTC); para ações é o próprio ticker */
  ticker: string
  name: string
  condition: Condition
  target: number
  currency: string
}

export const money = (value: number, currency: string) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    maximumFractionDigits: value >= 1 ? 2 : 8,
  }).format(value)

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export const label = (a: AlertSummary) =>
  a.kind === 'stock' ? a.symbol : `${a.name} (${a.ticker.toUpperCase()})`

export const ruleText = (a: AlertSummary) =>
  `${a.condition === 'above' ? 'subir para' : 'cair para'} ${money(a.target, a.currency)} ou ${a.condition === 'above' ? 'mais' : 'menos'}`

function layout(title: string, body: string, footer: string) {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f6f7fb;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border:1px solid #e2e8f0;border-radius:16px">
<tr><td style="padding:28px 28px 8px"><p style="margin:0;font-size:13px;color:#6366f1;font-weight:600">Market Tracker</p>
<h1 style="margin:8px 0 0;font-size:22px;line-height:1.3">${title}</h1></td></tr>
<tr><td style="padding:12px 28px 24px;font-size:15px;line-height:1.6">${body}</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;line-height:1.5">${footer}</td></tr>
</table></td></tr></table></body></html>`
}

const button = (href: string, text: string) =>
  `<a href="${href}" style="display:inline-block;margin-top:8px;padding:12px 20px;background:#6366f1;color:#fff;border-radius:10px;text-decoration:none;font-weight:600">${text}</a>`

export function confirmationEmail(a: AlertSummary, urls: { confirm: string }, currentPrice: number | null) {
  const what = escape(label(a))
  const now = currentPrice !== null ? ` Agora está em <strong>${money(currentPrice, a.currency)}</strong>.` : ''
  return {
    subject: `Confirme seu alerta de ${label(a)}`,
    html: layout(
      'Confirme seu alerta',
      `<p style="margin:0 0 12px">Você pediu para ser avisado quando <strong>${what}</strong> ${ruleText(a)}.${now}</p>
       <p style="margin:0 0 4px">O alerta só começa a valer depois da confirmação:</p>${button(urls.confirm, 'Confirmar alerta')}`,
      'Se não foi você, ignore este e-mail: sem confirmação, nenhum alerta é criado.',
    ),
    text: `Você pediu para ser avisado quando ${label(a)} ${ruleText(a)}.\n\nConfirme o alerta: ${urls.confirm}\n\nSe não foi você, ignore este e-mail.`,
  }
}

export function triggeredEmail(
  a: AlertSummary,
  price: number,
  urls: { unsubscribe: string; manage: string; view: string },
) {
  const direction = a.condition === 'above' ? 'subiu para' : 'caiu para'
  return {
    subject: `${label(a)} ${direction} ${money(price, a.currency)}`,
    html: layout(
      `${escape(label(a))} ${direction} ${money(price, a.currency)}`,
      `<p style="margin:0 0 12px">Seu alvo era ${a.condition === 'above' ? 'acima' : 'abaixo'} de <strong>${money(a.target, a.currency)}</strong>.</p>
       <p style="margin:0 0 4px">Você vai receber um novo aviso se o preço voltar e cruzar o alvo de novo.</p>${button(urls.view, 'Ver no Market Tracker')}`,
      `<a href="${urls.manage}" style="color:#64748b">Gerenciar meus alertas</a> · <a href="${urls.unsubscribe}" style="color:#64748b">Remover este alerta</a><br>Cotações com atraso; não é recomendação de investimento.`,
    ),
    text: `${label(a)} ${direction} ${money(price, a.currency)} (alvo: ${money(a.target, a.currency)}).\n\nVer: ${urls.view}\nGerenciar alertas: ${urls.manage}\nRemover este alerta: ${urls.unsubscribe}`,
  }
}

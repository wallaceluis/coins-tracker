const LOCALES: Record<string, string> = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' }

export const toLocale = (lang: string) => LOCALES[lang] ?? 'en-US'

const isMissing = (value: number | null | undefined): value is null | undefined =>
  value === null || value === undefined || Number.isNaN(value)

/** Preço com casas decimais adaptadas: moedas abaixo de 1 precisam de mais precisão. */
export function formatPrice(value: number | null | undefined, currency: string, lang = 'pt') {
  if (isMissing(value)) return '—'
  const abs = Math.abs(value)
  const digits = abs >= 1 ? 2 : abs >= 0.01 ? 4 : 8
  return new Intl.NumberFormat(toLocale(lang), {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'JPY' && abs >= 1 ? 0 : 2,
    maximumFractionDigits: currency === 'JPY' && abs >= 1 ? 0 : digits,
  }).format(value)
}

export function formatCompact(value: number | null | undefined, currency: string, lang = 'pt') {
  if (isMissing(value)) return '—'
  return new Intl.NumberFormat(toLocale(lang), {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value: number | null | undefined, lang = 'pt', signed = true) {
  if (isMissing(value)) return '—'
  return new Intl.NumberFormat(toLocale(lang), {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: signed ? 'exceptZero' : 'never',
  }).format(value / 100)
}

export function formatAmount(value: number | null | undefined, lang = 'pt', maxDigits = 8) {
  if (isMissing(value)) return '—'
  return new Intl.NumberFormat(toLocale(lang), { maximumFractionDigits: maxDigits }).format(value)
}

export function formatCompactNumber(value: number | null | undefined, lang = 'pt') {
  if (isMissing(value)) return '—'
  return new Intl.NumberFormat(toLocale(lang), {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value)
}

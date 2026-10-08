import { describe, expect, it } from 'vitest'
import {
  formatCompact,
  formatCompactNumber,
  formatPercent,
  formatPrice,
  toLocale,
} from '../formatters'

// Intl usa espaço não separável entre símbolo e número
const norm = (s: string) => s.replace(/ | /g, ' ')

describe('formatters', () => {
  it('maps app languages to Intl locales', () => {
    expect(toLocale('pt')).toBe('pt-BR')
    expect(toLocale('es')).toBe('es-ES')
    expect(toLocale('xx')).toBe('en-US')
  })

  it('formats prices with locale and adaptive precision', () => {
    expect(norm(formatPrice(1234.5, 'BRL', 'pt'))).toBe('R$ 1.234,50')
    expect(formatPrice(1234.5, 'USD', 'en')).toBe('$1,234.50')
    expect(formatPrice(0.0512, 'USD', 'en')).toBe('$0.0512')
    expect(formatPrice(0.00001234, 'USD', 'en')).toBe('$0.00001234')
  })

  it('formats JPY without cents', () => {
    expect(norm(formatPrice(15000, 'JPY', 'en'))).toBe('¥15,000')
  })

  it('returns a dash for missing values', () => {
    expect(formatPrice(null, 'USD')).toBe('—')
    expect(formatCompact(undefined, 'USD')).toBe('—')
    expect(formatPercent(Number.NaN)).toBe('—')
  })

  it('formats percentages with optional sign', () => {
    expect(formatPercent(1.234, 'en')).toBe('+1.23%')
    expect(formatPercent(-1.234, 'en')).toBe('-1.23%')
    expect(formatPercent(-1.234, 'en', false)).toBe('1.23%')
  })

  it('formats large values in compact notation', () => {
    expect(formatCompact(1_910_000_000_000, 'USD', 'en')).toBe('$1.91T')
    expect(formatCompactNumber(19_800_000, 'en')).toBe('19.8M')
  })
})

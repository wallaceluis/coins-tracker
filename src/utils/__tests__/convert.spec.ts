import { describe, expect, it } from 'vitest'
import { cryptoToFiat, fiatToCrypto } from '../convert'

describe('convert', () => {
  it('converts fiat to crypto', () => {
    expect(fiatToCrypto(1000, 500_000)).toBeCloseTo(0.002)
  })

  it('converts crypto to fiat', () => {
    expect(cryptoToFiat(0.5, 500_000)).toBe(250_000)
  })

  it('guards against invalid input', () => {
    expect(fiatToCrypto(1000, 0)).toBe(0)
    expect(fiatToCrypto(-1, 10)).toBe(0)
    expect(fiatToCrypto(Number.NaN, 10)).toBe(0)
    expect(cryptoToFiat(1, Number.POSITIVE_INFINITY)).toBe(0)
  })
})

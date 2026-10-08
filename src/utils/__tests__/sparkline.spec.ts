import { describe, expect, it } from 'vitest'
import { buildChart, downsample } from '../sparkline'

describe('downsample', () => {
  it('keeps short series untouched', () => {
    expect(downsample([1, 2, 3], 10)).toEqual([1, 2, 3])
  })

  it('reduces to maxPoints and keeps the exact last value', () => {
    const points = Array.from({ length: 168 }, (_, i) => i)
    const out = downsample(points, 24)
    expect(out).toHaveLength(24)
    expect(out[out.length - 1]).toBe(167)
  })
})

describe('buildChart', () => {
  it('returns null when there is not enough data', () => {
    expect(buildChart([], 100, 50)).toBeNull()
    expect(buildChart([1], 100, 50)).toBeNull()
  })

  it('maps min to the bottom and max to the top of the box', () => {
    const chart = buildChart([10, 20], 100, 50, 0)!
    expect(chart.line).toBe('M0.00,50.00 L100.00,0.00')
    expect(chart.area).toBe('M0.00,50.00 L100.00,0.00 L100.00,50 L0,50 Z')
    expect(chart).toMatchObject({ min: 10, max: 20, up: true })
  })

  it('flags a downward trend and handles flat series', () => {
    expect(buildChart([5, 3], 10, 10)!.up).toBe(false)
    expect(buildChart([7, 7, 7], 10, 10)).not.toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import { ms2ticks } from '../src/index'

describe('ms2ticks', () => {
  it('default params: 1000ms → 20 ticks', () => {
    expect(ms2ticks()).toBe(20)
  })

  it('500ms → 10 ticks', () => {
    expect(ms2ticks(500)).toBe(10)
  })

  it('custom gameTicksPerSecond: 1000ms, 10 ticks/s → 10 ticks', () => {
    expect(ms2ticks(1000, 10)).toBe(10)
  })

  it('custom millisecondsPerSecond: 2000ms, 20 ticks/s, 1000ms/s → 40 ticks', () => {
    expect(ms2ticks(2000, 20, 1000)).toBe(40)
  })

  it('0ms → 0 ticks', () => {
    expect(ms2ticks(0)).toBe(0)
  })
})

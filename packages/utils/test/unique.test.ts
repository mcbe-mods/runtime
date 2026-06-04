import { describe, expect, it } from 'vitest'
import { unique } from '../src/index'

describe('unique', () => {
  it('default size is 10', () => {
    expect(unique()).toHaveLength(10)
  })

  it('custom size', () => {
    expect(unique(5)).toHaveLength(5)
    expect(unique(20)).toHaveLength(20)
  })

  it('generates unique values', () => {
    const set = new Set(Array.from({ length: 100 }, () => unique()))
    expect(set.size).toBe(100)
  })
})

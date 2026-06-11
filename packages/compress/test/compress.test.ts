import { describe, expect, it } from 'vitest'
import { Compressor } from '../src/compress'

describe('Compressor', () => {
  it('compresses and decompresses roundtrip', () => {
    const c = new Compressor()
    const original = 'Hello, World!'
    const compressed = c.compress(original)
    expect(compressed).not.toBe(original)
    const decompressed = c.decompress(compressed)
    expect(decompressed).toBe(original)
  })

  it('compresses large data', () => {
    const c = new Compressor()
    const original = 'A'.repeat(1000)
    const compressed = c.compress(original)
    expect(compressed.length).toBeLessThan(original.length)
  })

  it('decompresses back to original', () => {
    const c = new Compressor()
    const original = `Hello, World! ${'x'.repeat(500)}`
    const compressed = c.compress(original)
    expect(c.decompress(compressed)).toBe(original)
  })

  it('handles unicode', () => {
    const c = new Compressor()
    const original = '你好世界🎉'
    const compressed = c.compress(original)
    expect(c.decompress(compressed)).toBe(original)
  })

  it('handles empty string', () => {
    const c = new Compressor()
    const compressed = c.compress('')
    const decompressed = c.decompress(compressed)
    expect(decompressed).toBe('')
  })

  it('throws on decompression failure', () => {
    const c = new Compressor()
    expect(() => c.decompress('!!!invalid-base64!!!')).toThrow()
  })
})

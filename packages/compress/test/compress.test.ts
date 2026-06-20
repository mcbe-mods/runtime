import { Base64, utf8Encode } from '@mcbe-mods/utils'
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
    const originalBytes = utf8Encode(original).length
    const compressedBytes = Base64.toBytes(compressed).length
    expect(compressedBytes).toBeLessThan(originalBytes)
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

  it('throws on valid base64 but invalid deflate data', () => {
    const c = new Compressor()
    expect(() => c.decompress('AAAA')).toThrow()
  })

  it('throws on truncated base64', () => {
    const c = new Compressor()
    // Valid base64-shape but not valid deflate data of expected length
    expect(() => c.decompress('YWJj')).toThrow()
  })
})

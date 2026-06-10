import { describe, expect, it } from 'vitest'
import { utf8Decode, utf8Encode } from '../src/index'

describe('utf8Encode', () => {
  it('encodes ASCII string', () => {
    const result = utf8Encode('hello')
    expect([...result]).toEqual([104, 101, 108, 108, 111])
  })

  it('encodes Unicode string', () => {
    const result = utf8Encode('你好')
    expect([...result]).toEqual([228, 189, 160, 229, 165, 189])
  })

  it('encodes mixed content', () => {
    const result = utf8Encode('hello 你好 world 🌍')
    // ' ' = 32, 'w' = 119, 'o' = 111, 'r' = 108, 'l' = 100, 'd' = 32
    // '🌍' = U+1F30D → UTF-8: F0 9F 8C 8D
    const expected = [
      104,
      101,
      108,
      108,
      111,
      32,
      228,
      189,
      160,
      229,
      165,
      189,
      32,
      119,
      111,
      114,
      108,
      100,
      32,
      240,
      159,
      140,
      141,
    ]
    expect([...result]).toEqual(expected)
  })

  it('handles empty string', () => {
    expect([...utf8Encode('')]).toEqual([])
  })

  it('encodes 1-byte characters (U+0000-U+007F)', () => {
    const result = utf8Encode('A')
    expect([...result]).toEqual([65])
  })

  it('encodes 2-byte characters (U+0080-U+07FF)', () => {
    // '¢' = U+00A2 → UTF-8: C2 A2
    const result = utf8Encode('¢')
    expect([...result]).toEqual([194, 162])
  })

  it('encodes 3-byte characters (U+0800-U+FFFF)', () => {
    // '中' = U+4E2D → UTF-8: E4 B8 AD
    const result = utf8Encode('中')
    expect([...result]).toEqual([228, 184, 173])
  })

  it('encodes 4-byte characters (U+10000-U+10FFFF)', () => {
    // '𝄞' = U+1D11E → UTF-8: F0 9D 84 9E
    const result = utf8Encode('𝄞')
    expect([...result]).toEqual([240, 157, 132, 158])
  })
})

describe('utf8Decode', () => {
  it('decodes ASCII bytes', () => {
    const bytes = new Uint8Array([104, 101, 108, 108, 111])
    expect(utf8Decode(bytes)).toBe('hello')
  })

  it('decodes Unicode bytes', () => {
    const bytes = new Uint8Array([228, 189, 160, 229, 165, 189])
    expect(utf8Decode(bytes)).toBe('你好')
  })

  it('handles empty bytes', () => {
    expect(utf8Decode(new Uint8Array(0))).toBe('')
  })

  it('decodes 1-byte characters', () => {
    expect(utf8Decode(new Uint8Array([65]))).toBe('A')
  })

  it('decodes 2-byte characters', () => {
    expect(utf8Decode(new Uint8Array([194, 162]))).toBe('¢')
  })

  it('decodes 3-byte characters', () => {
    expect(utf8Decode(new Uint8Array([228, 184, 173]))).toBe('中')
  })

  it('decodes 4-byte characters', () => {
    expect(utf8Decode(new Uint8Array([240, 157, 132, 158]))).toBe('𝄞')
  })
})

describe('utf8 roundtrip', () => {
  it('roundtrips ASCII', () => {
    const input = 'hello world'
    expect(utf8Decode(utf8Encode(input))).toBe(input)
  })

  it('roundtrips Unicode', () => {
    const input = '你好世界'
    expect(utf8Decode(utf8Encode(input))).toBe(input)
  })

  it('roundtrips mixed content', () => {
    const input = 'hello 你好 world 🌍 𝄞 123!@#'
    expect(utf8Decode(utf8Encode(input))).toBe(input)
  })

  it('roundtrips empty string', () => {
    expect(utf8Decode(utf8Encode(''))).toBe('')
  })

  it('roundtrips valid UTF-8 bytes', () => {
    // All valid single-byte (ASCII) characters
    const bytes = new Uint8Array(128)
    for (let i = 0; i < 128; i++) {
      bytes[i] = i
    }
    const s = utf8Decode(bytes)
    const roundtrip = utf8Encode(s)
    expect([...roundtrip]).toEqual([...bytes])
  })

  it('throws on invalid UTF-8 bytes', () => {
    const bytes = new Uint8Array([0xFF, 0xFE, 0x80])
    expect(() => utf8Decode(bytes)).toThrow()
  })

  it('roundtrips long string', () => {
    const input = 'A'.repeat(1000) + '你好'.repeat(100) + '🌍'.repeat(50)
    expect(utf8Decode(utf8Encode(input))).toBe(input)
  })
})

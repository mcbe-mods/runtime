import { describe, expect, it } from 'vitest'
import { Base64 } from '../src/index'

describe('Base64', () => {
  it('encodes ASCII strings', () => {
    expect(Base64.encode('hello')).toBe('aGVsbG8=')
  })

  it('decodes ASCII strings', () => {
    expect(Base64.decode('aGVsbG8=')).toBe('hello')
  })

  it('encodes Unicode strings', () => {
    expect(Base64.encode('你好')).toBe('5L2g5aW9')
  })

  it('decodes Unicode strings', () => {
    expect(Base64.decode('5L2g5aW9')).toBe('你好')
  })

  it('handles roundtrip for mixed content', () => {
    const input = 'hello 你好 world!'
    expect(Base64.decode(Base64.encode(input))).toBe(input)
  })

  it('handles empty string', () => {
    expect(Base64.encode('')).toBe('')
    expect(Base64.decode('')).toBe('')
  })

  it('handles padding edge cases', () => {
    expect(Base64.encode('a')).toBe('YQ==')
    expect(Base64.encode('ab')).toBe('YWI=')
    expect(Base64.encode('abc')).toBe('YWJj')
  })

  it('ignores whitespace on decode', () => {
    expect(Base64.decode(' YW J j\n ')).toBe('abc')
  })
})

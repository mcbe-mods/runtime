import { describe, expect, it } from 'vitest'
import { BedrockURL } from '../src/bedrock-url'
import { URLSearchParams } from '../src/url-search-params'

describe('BedrockURL', () => {
  it('parses a full URL', () => {
    const url = new BedrockURL('bedrock://calculator.rpc/invoke/add?a=1&b=2')
    expect(url.protocol).toBe('bedrock:')
    expect(url.host).toBe('calculator.rpc')
    expect(url.hostname).toBe('calculator.rpc')
    expect(url.port).toBe('')
    expect(url.href).toBe('bedrock://calculator.rpc/invoke/add?a=1&b=2')
    expect(url.origin).toBe('bedrock://calculator.rpc')
  })

  it('parses URL without path', () => {
    const url = new BedrockURL('bedrock://calculator.rpc')
    expect(url.host).toBe('calculator.rpc')
    expect(url.pathname).toBe('')
    expect(url.search).toBe('')
  })

  it('parses URL with trailing slash', () => {
    const url = new BedrockURL('bedrock://calculator.rpc/')
    expect(url.host).toBe('calculator.rpc')
    expect(url.pathname).toBe('/')
    expect(url.search).toBe('')
  })

  it('parses URL with query but no path', () => {
    const url = new BedrockURL('bedrock://calculator.rpc?key=val')
    expect(url.host).toBe('calculator.rpc')
    expect(url.pathname).toBe('')
    expect(url.search).toBe('?key=val')
    expect(url.searchParams.get('key')).toBe('val')
  })

  it('parses URL with query and trailing slash', () => {
    const url = new BedrockURL('bedrock://calculator.rpc/?key=val')
    expect(url.host).toBe('calculator.rpc')
    expect(url.pathname).toBe('/')
    expect(url.search).toBe('?key=val')
  })

  it('resolves absolute path against base', () => {
    const url = new BedrockURL('/invoke/add', 'bedrock://calculator.rpc')
    expect(url.host).toBe('calculator.rpc')
    expect(url.pathname).toBe('/invoke/add')
    expect(url.href).toBe('bedrock://calculator.rpc/invoke/add')
  })

  it('resolves relative path against base (no trailing slash)', () => {
    const url = new BedrockURL('add', 'bedrock://calculator.rpc/invoke')
    expect(url.host).toBe('calculator.rpc')
    expect(url.pathname).toBe('/add')
    expect(url.href).toBe('bedrock://calculator.rpc/add')
  })

  it('resolves relative path against base with trailing slash', () => {
    const url = new BedrockURL('add', 'bedrock://calculator.rpc/invoke/')
    expect(url.pathname).toBe('/invoke/add')
  })

  it('resolves absolute path with BedrockURL as base', () => {
    const base = new BedrockURL('bedrock://calculator.rpc/invoke')
    const url = new BedrockURL('/add', base)
    expect(url.href).toBe('bedrock://calculator.rpc/add')
  })

  it('resolves relative path when base has query with /', () => {
    const url = new BedrockURL('add', 'bedrock://calculator.rpc/invoke?a=/b/c')
    expect(url.host).toBe('calculator.rpc')
    expect(url.pathname).toBe('/add')
    expect(url.href).toBe('bedrock://calculator.rpc/add')
  })

  it('resolves relative path when base has hash with /', () => {
    const url = new BedrockURL('add', 'bedrock://calculator.rpc/invoke#/section')
    expect(url.host).toBe('calculator.rpc')
    expect(url.pathname).toBe('/add')
    expect(url.href).toBe('bedrock://calculator.rpc/add')
  })

  it('throws on non-bedrock scheme', () => {
    expect(() => new BedrockURL('https://example.com')).toThrow('Invalid scheme')
    expect(() => new BedrockURL('http://example.com')).toThrow('Invalid scheme')
  })

  it('throws on URL without ://', () => {
    expect(() => new BedrockURL('bedrock:calculator.rpc')).toThrow('must include "://"')
  })

  it('throws on invalid base URL', () => {
    expect(() => new BedrockURL('/path', 'https://example.com')).toThrow('Invalid base URL')
  })

  it('throws on URL without base', () => {
    expect(() => new BedrockURL('relative/path')).toThrow()
  })

  it('toString returns href', () => {
    const url = new BedrockURL('bedrock://host/path?a=1')
    expect(url.toString()).toBe('bedrock://host/path?a=1')
  })

  it('toScriptEventId returns href', () => {
    const url = new BedrockURL('bedrock://host/path')
    expect(url.toScriptEventId()).toBe('bedrock://host/path')
  })

  it('handles complex paths with multiple segments', () => {
    const url = new BedrockURL('bedrock://calculator.rpc/invoke/add?a=1&b=2')
    expect(url.pathname).toBe('/invoke/add')
    expect(url.searchParams.get('a')).toBe('1')
    expect(url.searchParams.get('b')).toBe('2')
  })

  it('handles query with multiple values for same key', () => {
    const url = new BedrockURL('bedrock://host/path?a=1&a=2')
    expect(url.searchParams.getAll('a')).toEqual(['1', '2'])
  })

  it('handles percent-encoded characters', () => {
    const url = new BedrockURL('bedrock://host/path?name=%E4%BD%A0%E5%A5%BD')
    expect(url.searchParams.get('name')).toBe('你好')
  })

  it('searchParams toString round-trips', () => {
    const url = new BedrockURL('bedrock://host/path?a=1&b=2')
    expect(url.searchParams.toString()).toBe('a=1&b=2')
  })

  it('parses URL with port', () => {
    const url = new BedrockURL('bedrock://host:8080/path')
    expect(url.host).toBe('host:8080')
    expect(url.hostname).toBe('host')
    expect(url.port).toBe('8080')
    expect(url.origin).toBe('bedrock://host')
  })

  it('parses URL with port but no path', () => {
    const url = new BedrockURL('bedrock://host:8080')
    expect(url.host).toBe('host:8080')
    expect(url.hostname).toBe('host')
    expect(url.port).toBe('8080')
  })

  it('parses URL with hash', () => {
    const url = new BedrockURL('bedrock://host/path#section')
    expect(url.pathname).toBe('/path')
    expect(url.hash).toBe('#section')
    expect(url.href).toBe('bedrock://host/path#section')
  })

  it('parses URL with hash and query', () => {
    const url = new BedrockURL('bedrock://host/path?a=1#section')
    expect(url.pathname).toBe('/path')
    expect(url.search).toBe('?a=1')
    expect(url.hash).toBe('#section')
    expect(url.href).toBe('bedrock://host/path?a=1#section')
  })

  it('parses URL with hash but no path', () => {
    const url = new BedrockURL('bedrock://host#frag')
    expect(url.host).toBe('host')
    expect(url.pathname).toBe('')
    expect(url.hash).toBe('#frag')
  })

  it('parses IPv6 address', () => {
    const url = new BedrockURL('bedrock://[2001:db8::1]/path')
    expect(url.host).toBe('[2001:db8::1]')
    expect(url.hostname).toBe('[2001:db8::1]')
    expect(url.port).toBe('')
  })

  it('parses IPv6 with port', () => {
    const url = new BedrockURL('bedrock://[2001:db8::1]:8080/path')
    expect(url.host).toBe('[2001:db8::1]:8080')
    expect(url.hostname).toBe('[2001:db8::1]')
    expect(url.port).toBe('8080')
  })
})

describe('URLSearchParams', () => {
  it('parses query string', () => {
    const p = new URLSearchParams('a=1&b=2')
    expect(p.get('a')).toBe('1')
    expect(p.get('b')).toBe('2')
  })

  it('parses query string with leading ?', () => {
    const p = new URLSearchParams('?a=1&b=2')
    expect(p.get('a')).toBe('1')
  })

  it('parses from record', () => {
    const p = new URLSearchParams({ a: '1', b: '2' })
    expect(p.get('a')).toBe('1')
    expect(p.get('b')).toBe('2')
  })

  it('get returns null for missing key', () => {
    const p = new URLSearchParams('a=1')
    expect(p.get('b')).toBeNull()
  })

  it('has checks key existence', () => {
    const p = new URLSearchParams('a=1')
    expect(p.has('a')).toBe(true)
    expect(p.has('b')).toBe(false)
  })

  it('set overwrites single value', () => {
    const p = new URLSearchParams('a=1&a=2')
    p.set('a', '3')
    expect(p.getAll('a')).toEqual(['3'])
  })

  it('append adds duplicate key', () => {
    const p = new URLSearchParams('a=1')
    p.append('a', '2')
    expect(p.getAll('a')).toEqual(['1', '2'])
  })

  it('delete removes key', () => {
    const p = new URLSearchParams('a=1&b=2')
    p.delete('a')
    expect(p.get('a')).toBeNull()
    expect(p.get('b')).toBe('2')
  })

  it('forEach iterates entries (value, name)', () => {
    const p = new URLSearchParams('a=1&b=2')
    const entries: [string, string][] = []
    p.forEach((v, k) => entries.push([v, k]))
    expect(entries).toEqual([['1', 'a'], ['2', 'b']])
  })

  it('toString produces correct output', () => {
    const p = new URLSearchParams('a=1&b=2')
    expect(p.toString()).toBe('a=1&b=2')
  })

  it('toString encodes special characters', () => {
    const p = new URLSearchParams()
    p.set('name', 'hello world')
    expect(p.toString()).toContain(encodeURIComponent('hello world'))
  })

  it('handles empty string', () => {
    const p = new URLSearchParams('')
    expect(p.toString()).toBe('')
  })

  it('handles keys() and values()', () => {
    const p = new URLSearchParams('a=1&b=2')
    expect([...p.keys()]).toEqual(['a', 'b'])
    expect([...p.values()]).toEqual(['1', '2'])
  })

  it('entries() yields [key, value] pairs', () => {
    const p = new URLSearchParams('a=1&b=2')
    expect([...p.entries()]).toEqual([['a', '1'], ['b', '2']])
  })

  it('is iterable via Symbol.iterator', () => {
    const p = new URLSearchParams('a=1&b=2')
    const results: [string, string][] = []
    for (const [k, v] of p) {
      results.push([k, v])
    }
    expect(results).toEqual([['a', '1'], ['b', '2']])
  })
})

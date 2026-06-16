import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RPC } from '../src/rpc'
import { advanceTimeouts, mockScriptEvent } from './setup'

function reqUrl(ns: string, method: string, id: string): string {
  return `bedrock://${ns}.req.rpc/${method}?v=1&id=${id}`
}

function resUrl(ns: string, method: string, id: string): string {
  return `bedrock://${ns}.res.rpc/${method}?v=1&id=${id}`
}

describe('RPC', () => {
  let rpc: RPC

  beforeEach(() => {
    vi.clearAllMocks()
    rpc = new RPC({ namespace: 'test' })
  })

  afterEach(() => {
    rpc?.dispose()
  })

  it('sends invoke request with correct URL and body', () => {
    rpc.invoke('add', { a: 1, b: 2 }).catch(() => {})

    expect(mockScriptEvent.send).toHaveBeenCalledTimes(1)
    const [url, body] = mockScriptEvent.send.mock.calls[0]
    expect(url).toMatch(/^bedrock:\/\/test\.req\.rpc\/add\?v=1&id=[0-9a-z]+$/)
    expect(body).toBe(JSON.stringify({ a: 1, b: 2 }))
  })

  it('sends invoke with empty body when no data', () => {
    rpc.invoke('ping').catch(() => {})

    const [, body] = mockScriptEvent.send.mock.calls[0]
    expect(body).toBe('')
  })

  it('handle receives request and calls handler', () => {
    const handler = vi.fn((data: { a: number, b: number }) => data.a + data.b)
    rpc.handle('add', handler)

    mockScriptEvent.simulateReceive(reqUrl('test', 'add', 'REQ1'), JSON.stringify({ a: 1, b: 2 }))

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith({ a: 1, b: 2 })
  })

  it('handle responds with result', () => {
    rpc.handle<{ a: number, b: number }>('add', data => data.a + data.b)

    mockScriptEvent.simulateReceive(reqUrl('test', 'add', 'REQ1'), JSON.stringify({ a: 1, b: 2 }))

    const calls = mockScriptEvent.send.mock.calls as Array<[string, string]>
    const responseCall = calls.find(([url]) => url.includes('.res.rpc/add'))
    expect(responseCall).toBeDefined()
    const [resUrlStr, resBody] = responseCall!
    expect(resUrlStr).toContain('id=REQ1')
    expect(resBody).toBe(JSON.stringify({ data: 3 }))
  })

  it('invoke receives response and resolves promise', async () => {
    const promise = rpc.invoke('add', { a: 1, b: 2 })

    const sentUrl = mockScriptEvent.send.mock.calls[0][0] as string
    const idMatch = sentUrl.match(/id=([0-9a-z]+)/)
    const invokeId = idMatch![1]

    mockScriptEvent.simulateReceive(resUrl('test', 'add', invokeId), JSON.stringify({ data: 3 }))

    await expect(promise).resolves.toBe(3)
  })

  it('invoke rejects on error response', async () => {
    const promise = rpc.invoke('fail')

    const sentUrl = mockScriptEvent.send.mock.calls[0][0] as string
    const idMatch = sentUrl.match(/id=([0-9a-z]+)/)
    const invokeId = idMatch![1]

    mockScriptEvent.simulateReceive(resUrl('test', 'fail', invokeId), JSON.stringify({ error: 'something went wrong' }))

    await expect(promise).rejects.toThrow('something went wrong')
  })

  it('invoke times out', async () => {
    const promise = rpc.invoke('slow', undefined, 1000)

    advanceTimeouts()

    await expect(promise).rejects.toThrow('RPC timeout')
  })

  it('handle sends error response when handler returns rejected Promise', async () => {
    rpc.handle('fail-promise', () => Promise.reject(new Error('async kaboom')))

    mockScriptEvent.simulateReceive(reqUrl('test', 'fail-promise', 'REQ1'), '')

    await vi.waitFor(() => {
      const calls = mockScriptEvent.send.mock.calls as Array<[string, string]>
      const responseCall = calls.find(([url]) => url.includes('.res.rpc/fail-promise'))
      expect(responseCall).toBeDefined()
      const [, resBody] = responseCall!
      expect(JSON.parse(resBody)).toStrictEqual({ error: 'async kaboom' })
    })
  })

  it('does not time out when timeout is 0', async () => {
    const promise = rpc.invoke('no-timeout', undefined, 0)

    advanceTimeouts()

    await vi.waitFor(() => {
      expect(mockScriptEvent.send).toHaveBeenCalledTimes(1)
    })
    // advanceTimeouts should NOT reject the promise since timeout=0 disables it
    // We verify by checking that the pending map is still around indirectly:
    // dispose() will reject it, which we catch here
    await expect(Promise.race([promise, Promise.resolve('still-pending')]))
      .resolves
      .toBe('still-pending')
    promise.catch(() => {})
  })

  it('handle sends error response when handler throws', () => {
    rpc.handle('boom', () => {
      throw new Error('kaboom')
    })

    mockScriptEvent.simulateReceive(reqUrl('test', 'boom', 'REQ1'), '')

    const calls = mockScriptEvent.send.mock.calls as Array<[string, string]>
    const responseCall = calls.find(([url]) => url.includes('.res.rpc/boom'))
    expect(responseCall).toBeDefined()
    const [, resBody] = responseCall!
    expect(resBody).toBe(JSON.stringify({ error: 'kaboom' }))
  })

  it('ignores loopback requests', () => {
    const handler = vi.fn()
    rpc.handle('ping', handler)

    rpc.invoke('ping').catch(() => {})

    const sentUrl = mockScriptEvent.send.mock.calls[0][0] as string
    const idMatch = sentUrl.match(/id=([0-9a-z]+)/)
    const invokeId = idMatch![1]

    mockScriptEvent.simulateReceive(reqUrl('test', 'ping', invokeId), '')

    expect(handler).not.toHaveBeenCalled()
  })

  it('stops receiving after dispose', () => {
    const handler = vi.fn()
    rpc.handle('test', handler)
    rpc.dispose()

    mockScriptEvent.simulateReceive(reqUrl('test', 'test', 'ID'), '')

    expect(handler).not.toHaveBeenCalled()
  })

  it('filters events from other namespaces', () => {
    const handler = vi.fn()
    rpc.handle('test', handler)

    mockScriptEvent.simulateReceive('bedrock://other.req.rpc/test?v=1&id=ID', '')

    expect(handler).not.toHaveBeenCalled()
  })

  it('ignores non-rpc hostnames', () => {
    const handler = vi.fn()
    rpc.handle('test', handler)

    mockScriptEvent.simulateReceive('bedrock://test/test?v=1&id=ID', '')

    expect(handler).not.toHaveBeenCalled()
  })

  describe('handle duplicate', () => {
    it('does not throw on duplicate registration', () => {
      const handler = vi.fn()
      rpc.handle('test', handler)
      expect(() => rpc.handle('test', vi.fn())).not.toThrow()
    })

    it('replaces previous handler on duplicate registration', () => {
      const first = vi.fn(() => 'first')
      const second = vi.fn(() => 'second')
      rpc.handle('test', first)
      rpc.handle('test', second)

      mockScriptEvent.simulateReceive(reqUrl('test', 'test', 'REQ1'), '')

      expect(first).not.toHaveBeenCalled()
      expect(second).toHaveBeenCalledTimes(1)
    })
  })

  describe('once', () => {
    it('handler fires once then auto-unsubscribes', () => {
      const handler = vi.fn()
      rpc.once('test', handler)
      mockScriptEvent.simulateReceive(reqUrl('test', 'test', 'REQ1'), '')
      mockScriptEvent.simulateReceive(reqUrl('test', 'test', 'REQ2'), '')
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('unsubscribe prevents handler from firing', () => {
      const handler = vi.fn()
      const off = rpc.once('test', handler)
      off()
      mockScriptEvent.simulateReceive(reqUrl('test', 'test', 'REQ1'), '')
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('cipher', () => {
    const cipher = {
      encrypt: (s: string) => `enc(${s})`,
      decrypt: (s: string) => s.replace(/^enc\(|\)$/g, ''),
    }

    it('encrypts outgoing request body via invoke()', () => {
      const encRPC = new RPC({ namespace: 'test', cipher })
      encRPC.invoke('add', { a: 1 }).catch(() => {})

      const [, body] = mockScriptEvent.send.mock.calls[0]
      expect(body).toBe(`enc(${JSON.stringify({ a: 1 })})`)
    })

    it('decrypts incoming request body for handle()', () => {
      const encRPC = new RPC({ namespace: 'test', cipher })
      const handler = vi.fn()
      encRPC.handle('add', handler)

      const encrypted = `enc(${JSON.stringify({ a: 1 })})`
      mockScriptEvent.simulateReceive(reqUrl('test', 'add', 'REQ1'), encrypted)

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith({ a: 1 })
    })
  })
})

import { system } from '@minecraft/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IPC } from '../src/ipc'
import { simulateReceive } from './setup'

function url(channel: string, extra = ''): string {
  return `bedrock://test.ipc/${channel}?v=1&id=ID${extra}`
}

function urlNs(ns: string, channel: string, extra = ''): string {
  return `bedrock://${ns}.ipc/${channel}?v=1&id=ID${extra}`
}

describe('IPC', () => {
  let ipc: IPC

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    ipc = new IPC({ namespace: 'test' })
  })

  afterEach(() => {
    vi.useRealTimers()
    ipc?.dispose()
  })

  it('sends a direct (unchunked) packet', () => {
    ipc.send('ping', { msg: 'hello' })

    expect(system.sendScriptEvent).toHaveBeenCalledTimes(1)
    const [u, payload] = (system.sendScriptEvent as any).mock.calls[0]
    expect(u).toMatch(/^bedrock:\/\/test\.ipc\/ping\?v=1&id=[0-9a-z]+$/)
    expect(payload).toBe(JSON.stringify({ msg: 'hello' }))
  })

  it('sends a signal (no data) via send()', () => {
    ipc.send('signal')

    expect(system.sendScriptEvent).toHaveBeenCalledTimes(1)
    const [u] = (system.sendScriptEvent as any).mock.calls[0]
    expect(u).toMatch(/^bedrock:\/\/test\.ipc\/signal\?v=1&id=[0-9a-z]+$/)
  })

  it('receives a direct packet via on()', () => {
    const handler = vi.fn()
    ipc.on<{ msg: string }>('ping', handler)

    simulateReceive(url('ping'), JSON.stringify({ msg: 'hello' }))

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith({ msg: 'hello' })
  })

  it('supports multiple on() handlers per channel', () => {
    const h1 = vi.fn()
    const h2 = vi.fn()
    ipc.on('test', h1)
    ipc.on('test', h2)

    simulateReceive(url('test'), '42')

    expect(h1).toHaveBeenCalledWith(42)
    expect(h2).toHaveBeenCalledWith(42)
  })

  it('unsubscribe via on() returned function', () => {
    const handler = vi.fn()
    const off = ipc.on('test', handler)
    off()

    simulateReceive(url('test'), '42')
    expect(handler).not.toHaveBeenCalled()
  })

  describe('once', () => {
    it('handler fires once then auto-unsubscribes', () => {
      const handler = vi.fn()
      ipc.once('test', handler)

      simulateReceive(url('test'), '1')
      simulateReceive(url('test'), '2')

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('unsubscribe prevents handler from firing', () => {
      const handler = vi.fn()
      const off = ipc.once('test', handler)
      off()

      simulateReceive(url('test'), '42')
      expect(handler).not.toHaveBeenCalled()
    })

    it('supports custom deserializer', () => {
      const handler = vi.fn()
      const deserializer = {
        deserialize: (d: string) => Number.parseInt(d.replace('num:', ''), 10),
      }
      ipc.once('custom', handler, { deserializer })
      simulateReceive(url('custom'), 'num:42')
      expect(handler).toHaveBeenCalledWith(42)
    })

    it('with custom deserializer fires only once', () => {
      const handler = vi.fn()
      ipc.once('test', handler, { deserializer: { deserialize: (d: string) => d } })
      simulateReceive(url('test'), 'a')
      simulateReceive(url('test'), 'b')
      expect(handler).toHaveBeenCalledTimes(1)
    })
  })

  it('chunks large payloads', () => {
    const chunkIPC = new IPC({ namespace: 'test', chunkSize: 100, compressThreshold: 999999 })
    const largeData = { data: 'x'.repeat(500) }
    chunkIPC.send('big', largeData)

    const calls = (system.sendScriptEvent as any).mock.calls
    expect(calls.length).toBeGreaterThan(1)

    for (const [u] of calls) {
      expect(u).toMatch(/^bedrock:\/\/test\.ipc\/big\?v=1&id=[0-9a-z]+&seq=\d+&total=\d+$/)
    }

    const firstPayload = calls[0][1]
    expect(firstPayload.length).toBe(100)
  })

  it('reassembles chunked payloads', () => {
    const handler = vi.fn()
    ipc.on<{ data: string }>('big', handler)

    const body = JSON.stringify({ data: 'hello' })
    const chunkCount = 3
    const chunkSize = Math.ceil(body.length / chunkCount)

    for (let i = 0; i < chunkCount; i++) {
      const data = body.slice(i * chunkSize, (i + 1) * chunkSize)
      simulateReceive(`bedrock://test.ipc/big?v=1&id=CHUNKID&seq=${i}&total=${chunkCount}`, data)
    }

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith({ data: 'hello' })
  })

  it('supports custom serializer in send()', () => {
    const customSerializer = {
      serialize: (v: number) => `num:${v}`,
    }
    ipc.send('custom', 42, { serializer: customSerializer })

    const payload = (system.sendScriptEvent as any).mock.calls[0][1]
    expect(payload).toBe('num:42')
  })

  it('supports custom deserializer in on()', () => {
    const customDeserializer = {
      deserialize: (d: string) => Number.parseInt(d.replace('num:', ''), 10),
    }
    const handler = vi.fn()
    ipc.on('custom', handler, { deserializer: customDeserializer })

    simulateReceive(url('custom'), 'num:42')

    expect(handler).toHaveBeenCalledWith(42)
  })

  it('isolates on() handlers across different namespaces', () => {
    const ipc2 = new IPC({ namespace: 'ns2' })
    const handler = vi.fn()
    ipc2.on('ping', handler)

    simulateReceive(url('ping'), JSON.stringify({ msg: 'hello' }))
    expect(handler).not.toHaveBeenCalled()

    simulateReceive(urlNs('ns2', 'ping'), JSON.stringify({ msg: 'hello' }))
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith({ msg: 'hello' })
  })

  it('ignores self-sent packet on loopback', () => {
    const handler = vi.fn()
    ipc.on('ping', handler)

    ipc.send('ping', { msg: 'hello' })

    const sentUrl = (system.sendScriptEvent as any).mock.calls[0][0]
    const match = sentUrl.match(/id=([0-9a-z]+)/)
    const sentId = match ? match[1] : ''

    simulateReceive(`bedrock://test.ipc/ping?v=1&id=${sentId}`, JSON.stringify({ msg: 'hello' }))

    expect(handler).not.toHaveBeenCalled()
  })

  it('stops receiving messages after dispose()', () => {
    const handler = vi.fn()
    ipc.on('test', handler)
    ipc.dispose()

    simulateReceive(url('test'), '42')

    expect(handler).not.toHaveBeenCalled()
  })

  it('filters out non-Server sourceType events', () => {
    const handler = vi.fn()
    ipc.on('test', handler)

    simulateReceive(url('test'), '42', 'Entity')

    expect(handler).not.toHaveBeenCalled()
  })

  it('filters events from other namespaces', () => {
    const handler = vi.fn()
    ipc.on('test', handler)

    simulateReceive(urlNs('other', 'test'), '42')

    expect(handler).not.toHaveBeenCalled()
  })

  it('filters events without .ipc host suffix', () => {
    const handler = vi.fn()
    ipc.on('test', handler)

    simulateReceive('bedrock://test/test?v=1&id=ID', '42')

    expect(handler).not.toHaveBeenCalled()
  })

  it('requires v=1 in query', () => {
    const handler = vi.fn()
    ipc.on('test', handler)

    simulateReceive('bedrock://test.ipc/test?id=ID', '42')

    expect(handler).not.toHaveBeenCalled()
  })

  it('requires id in query', () => {
    const handler = vi.fn()
    ipc.on('test', handler)

    simulateReceive('bedrock://test.ipc/test?v=1', '42')

    expect(handler).not.toHaveBeenCalled()
  })

  describe('cipher', () => {
    const cipher = {
      encrypt: (s: string) => `enc(${s})`,
      decrypt: (s: string) => s.replace(/^enc\(|\)$/g, ''),
    }

    it('encrypts outgoing payloads via send()', () => {
      const encIPC = new IPC({ namespace: 'test', cipher })
      encIPC.send('ping', { msg: 'hello' })

      const payload = (system.sendScriptEvent as any).mock.calls[0][1]
      expect(payload).toBe(`enc(${JSON.stringify({ msg: 'hello' })})`)
    })

    it('decrypts incoming payloads via on()', () => {
      const encIPC = new IPC({ namespace: 'test', cipher })
      const handler = vi.fn()
      encIPC.on<{ msg: string }>('ping', handler)

      const encrypted = `enc(${JSON.stringify({ msg: 'hello' })})`
      simulateReceive(url('ping'), encrypted)

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith({ msg: 'hello' })
    })
  })
})

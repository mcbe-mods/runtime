import type { ProtocolCipher } from '../src/index'
import { BedrockURL } from '@mcbe-mods/bedrock-url'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Protocol } from '../src/index'
import { mockScriptEvent, ScriptEventSource } from './setup'

describe('Protocol', () => {
  let protocol: Protocol

  beforeEach(() => {
    protocol = new Protocol()
    vi.clearAllMocks()
  })

  describe('constructor with cipher', () => {
    it('encrypts outgoing messages via post', () => {
      const cipher: ProtocolCipher = {
        encrypt: (s: string) => `enc(${s})`,
        decrypt: (s: string) => s.replace(/^enc\(|\)$/g, ''),
      }
      const encrypted = new Protocol({ cipher })
      encrypted.post('bedrock://host/path', 'hello')
      expect(mockScriptEvent.send).toHaveBeenCalledWith('bedrock://host/path', 'enc(hello)')
    })

    it('decrypts incoming messages via onReceive', () => {
      const cipher: ProtocolCipher = {
        encrypt: (s: string) => `enc(${s})`,
        decrypt: (s: string) => s.replace(/^enc\(|\)$/g, ''),
      }
      const handler = vi.fn()
      const encrypted = new Protocol({ cipher })
      encrypted.onReceive(handler)
      mockScriptEvent.simulateReceive('bedrock://host/path', 'enc(hello)')
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler.mock.calls[0][0].message).toBe('hello')
    })

    it('drops messages when decryption fails', () => {
      const cipher: ProtocolCipher = {
        encrypt: (s: string) => s,
        decrypt: () => { throw new Error('bad decrypt') },
      }
      const handler = vi.fn()
      const encrypted = new Protocol({ cipher })
      encrypted.onReceive(handler)
      mockScriptEvent.simulateReceive('bedrock://host/path', 'tampered')
      expect(handler).not.toHaveBeenCalled()
    })

    it('passes through get unchanged', () => {
      const cipher: ProtocolCipher = {
        encrypt: (s: string) => `enc(${s})`,
        decrypt: (s: string) => s,
      }
      const encrypted = new Protocol({ cipher })
      encrypted.get('bedrock://host/path')
      expect(mockScriptEvent.send).toHaveBeenCalledWith('bedrock://host/path', '')
    })
  })

  describe('get', () => {
    it('sends GET with empty message', () => {
      protocol.get('bedrock://host/path')
      expect(mockScriptEvent.send).toHaveBeenCalledWith('bedrock://host/path', '')
    })

    it('sends GET with BedrockURL', () => {
      const url = new BedrockURL('bedrock://host/path?a=1')
      protocol.get(url)
      expect(mockScriptEvent.send).toHaveBeenCalledWith('bedrock://host/path?a=1', '')
    })

    it('sends multiple GETs', () => {
      protocol.get('bedrock://host/a')
      protocol.get('bedrock://host/b')
      expect(mockScriptEvent.send).toHaveBeenCalledTimes(2)
    })
  })

  describe('post', () => {
    it('sends POST with message', () => {
      protocol.post('bedrock://host/path', 'hello')
      expect(mockScriptEvent.send).toHaveBeenCalledWith('bedrock://host/path', 'hello')
    })

    it('sends POST with BedrockURL', () => {
      const url = new BedrockURL('bedrock://host/path')
      protocol.post(url, JSON.stringify({ a: 1 }))
      expect(mockScriptEvent.send).toHaveBeenCalledWith('bedrock://host/path', '{"a":1}')
    })
  })

  describe('onReceive', () => {
    it('receives events matching bedrock:// scheme', () => {
      const handler = vi.fn()
      protocol.onReceive(handler)
      mockScriptEvent.simulateReceive('bedrock://host/path', 'hello')
      expect(handler).toHaveBeenCalledTimes(1)
      const event = handler.mock.calls[0][0]
      expect(event.url.host).toBe('host')
      expect(event.url.pathname).toBe('/path')
      expect(event.message).toBe('hello')
      expect(event.sourceType).toBe(ScriptEventSource.Server)
    })

    it('propagates sourceType from event', () => {
      const handler = vi.fn()
      protocol.onReceive(handler)
      mockScriptEvent.simulateReceive('bedrock://host/path', 'msg', ScriptEventSource.Entity)
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler.mock.calls[0][0].sourceType).toBe(ScriptEventSource.Entity)
    })

    it('ignores events with non-bedrock scheme', () => {
      const handler = vi.fn()
      protocol.onReceive(handler)
      mockScriptEvent.simulateReceive('https://example.com', '')
      expect(handler).not.toHaveBeenCalled()
    })

    it('handles empty message as GET', () => {
      const handler = vi.fn()
      protocol.onReceive(handler)
      mockScriptEvent.simulateReceive('bedrock://host/path', '')
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler.mock.calls[0][0].message).toBe('')
    })

    it('unsubscribe removes handler', () => {
      const handler = vi.fn()
      const unsubscribe = protocol.onReceive(handler)
      unsubscribe()
      mockScriptEvent.simulateReceive('bedrock://host/path', '')
      expect(handler).not.toHaveBeenCalled()
    })

    it('multiple handlers all receive events', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      protocol.onReceive(handler1)
      protocol.onReceive(handler2)
      mockScriptEvent.simulateReceive('bedrock://host/path', 'msg')
      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
    })
  })

  describe('dispose', () => {
    it('stops receiving after dispose', () => {
      const handler = vi.fn()
      protocol.onReceive(handler)
      protocol.dispose()
      mockScriptEvent.simulateReceive('bedrock://host/path', '')
      expect(handler).not.toHaveBeenCalled()
    })

    it('clears all subscriptions', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      protocol.onReceive(handler1)
      protocol.onReceive(handler2)
      protocol.dispose()
      mockScriptEvent.simulateReceive('bedrock://host/path', '')
      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).not.toHaveBeenCalled()
    })
  })
})

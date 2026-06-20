import type { ServiceEvent } from '../src/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Discover, normalizeServiceType } from '../src/discover'

describe('normalizeServiceType', () => {
  it('removes instance number prefix', () => {
    expect(normalizeServiceType('1._rcon._tcp.discover')).toBe('_rcon._tcp')
  })

  it('handles hostname without number', () => {
    expect(normalizeServiceType('_rcon._tcp.discover')).toBe('_rcon._tcp')
  })

  it('handles multi-digit instance numbers', () => {
    expect(normalizeServiceType('42._svc.discover')).toBe('_svc')
  })
})

describe('Discover', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('registers and sends heartbeat', () => {
    const d = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const stop = d.register('_rcon._tcp', { port: '19132' })
    stop()
    d.dispose()
  })

  it('duplicate register creates numbered instances', () => {
    const provider = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    provider.register('_svc._tcp', { id: '1' })
    provider.register('_svc._tcp', { id: '2' })
    provider.dispose()
  })

  it('consumer receives service-resolved from provider', () => {
    const provider = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const consumer = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const cb = vi.fn()

    provider.register('_rcon._tcp', { port: '19132' })
    consumer.query('_tcp', cb)

    expect(cb).toHaveBeenCalledWith({
      type: 'service-resolved',
      service: { serviceType: '_rcon._tcp', meta: { port: '19132' } },
    })

    provider.dispose()
    consumer.dispose()
  })

  it('query does not fire for non-matching type', () => {
    const provider = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const consumer = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const cb = vi.fn()

    provider.register('_rcon._tcp')
    consumer.query('_other._tcp', cb)

    expect(cb).not.toHaveBeenCalled()
    provider.dispose()
    consumer.dispose()
  })

  it('suffix matching works', () => {
    const provider = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const consumer = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const cb = vi.fn()

    provider.register('_a._tcp')
    provider.register('_b._udp')
    consumer.query('_tcp', cb)

    expect(cb).toHaveBeenCalledOnce()
    provider.dispose()
    consumer.dispose()
  })

  it('query returns stop function', () => {
    const provider = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const consumer = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const cb = vi.fn()

    const stop = consumer.query('_x._tcp', cb)
    provider.register('_x._tcp')
    cb.mockClear()
    stop()

    provider.dispose()
    consumer.dispose()
  })

  it('service-removed fires after TTL when provider stops heartbeating', () => {
    const provider = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const consumer = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const cb = vi.fn()

    consumer.query('_rcon._tcp', cb)
    provider.register('_rcon._tcp', { port: '19132' })
    cb.mockClear()

    provider.dispose()

    vi.advanceTimersByTime(16000)

    expect(cb).toHaveBeenCalledWith({
      type: 'service-removed',
      serviceType: '_rcon._tcp',
    })

    consumer.dispose()
  })

  it('heartbeat refreshes TTL so service stays alive', () => {
    const provider = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const consumer = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const cb = vi.fn()

    consumer.query('_rcon._tcp', cb)
    provider.register('_rcon._tcp', { port: '19132' })
    cb.mockClear()

    vi.advanceTimersByTime(14000)
    expect(cb).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'service-removed' }),
    )

    provider.dispose()
    consumer.dispose()
  })

  it('multiple query callbacks all fire', () => {
    const provider = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const consumer = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const cb1 = vi.fn()
    const cb2 = vi.fn()

    consumer.query('_tcp', cb1)
    consumer.query('_svc._tcp', cb2)
    provider.register('_svc._tcp')

    expect(cb1).toHaveBeenCalledOnce()
    expect(cb2).toHaveBeenCalledOnce()

    provider.dispose()
    consumer.dispose()
  })

  it('numbered instances on duplicate register', () => {
    const provider = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const consumer = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const cb = vi.fn()

    provider.register('_svc', { i: '1' })
    provider.register('_svc', { i: '2' })
    provider.register('_svc', { i: '3' })
    consumer.query('_svc', cb)

    expect(cb).toHaveBeenCalledTimes(3)

    provider.dispose()
    consumer.dispose()
  })

  it('dispose stops everything', () => {
    const provider = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const consumer = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const cb = vi.fn()

    consumer.query('_test._tcp', cb)
    provider.register('_test._tcp', { x: '1' })
    cb.mockClear()

    provider.dispose()
    consumer.dispose()
    cb.mockClear()

    vi.advanceTimersByTime(20000)
    expect(cb).not.toHaveBeenCalled()
  })

  it('meta accepts non-string values', () => {
    const provider = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const consumer = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const cb = vi.fn()

    provider.register('_rcon._tcp', { port: 19132, secure: true, tags: ['game', 'server'] })
    consumer.query('_tcp', cb)

    expect(cb).toHaveBeenCalledWith({
      type: 'service-resolved',
      service: { serviceType: '_rcon._tcp', meta: { port: 19132, secure: true, tags: ['game', 'server'] } },
    })

    provider.dispose()
    consumer.dispose()
  })

  it('query generic infers meta type', () => {
    const provider = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const consumer = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const cb = vi.fn<(event: ServiceEvent<{ version: string }>) => void>()

    provider.register('_svc._tcp', { version: '1.0' })
    consumer.query<{ version: string }>('_tcp', cb)

    expect(cb).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'service-resolved',
        service: expect.objectContaining({ meta: { version: '1.0' } }),
      }),
    )

    provider.dispose()
    consumer.dispose()
  })

  it('meta can be a string', () => {
    const provider = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const consumer = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const cb = vi.fn()

    provider.register('_svc._tcp', 'hello')
    consumer.query('_svc._tcp', cb)

    expect(cb).toHaveBeenCalledWith(
      expect.objectContaining({ service: expect.objectContaining({ meta: 'hello' }) }),
    )

    provider.dispose()
    consumer.dispose()
  })

  it('meta can be a number', () => {
    const provider = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const consumer = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const cb = vi.fn()

    provider.register('_svc._tcp', 42)
    consumer.query('_svc._tcp', cb)

    expect(cb).toHaveBeenCalledWith(
      expect.objectContaining({ service: expect.objectContaining({ meta: 42 }) }),
    )

    provider.dispose()
    consumer.dispose()
  })

  it('rejects invalid serviceType on register', () => {
    const d = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    expect(() => d.register('')).toThrow(TypeError)
    expect(() => d.register('.start-dot')).toThrow(TypeError)
    expect(() => d.register('end-dot.')).toThrow(TypeError)
    d.dispose()
  })

  it('rejects invalid serviceType on query', () => {
    const d = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    expect(() => d.query('', vi.fn())).toThrow(TypeError)
    expect(() => d.query('.start-dot', vi.fn())).toThrow(TypeError)
    expect(() => d.query('end-dot.', vi.fn())).toThrow(TypeError)
    d.dispose()
  })

  it('rejects ttl < heartbeatInterval', () => {
    expect(() => new Discover({ heartbeatInterval: 10000, ttl: 5000 })).toThrow(RangeError)
  })

  it('fires service-removed during dispose on consumer', () => {
    const provider = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const consumer = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const cb = vi.fn()

    provider.register('_svc._tcp')
    consumer.query('_svc._tcp', cb)
    cb.mockClear()

    consumer.dispose()

    expect(cb).toHaveBeenCalledWith({
      type: 'service-removed',
      serviceType: '_svc._tcp',
    })

    provider.dispose()
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Discover } from '../src/discover'

describe('Discover', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('registers and sends heartbeat', () => {
    const d = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const stop = d.register('_rcon._tcp.discover', { port: '19132' })
    stop()
    d.dispose()
  })

  it('duplicate register creates numbered instances', () => {
    const provider = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    provider.register('_svc._tcp.discover', { id: '1' })
    provider.register('_svc._tcp.discover', { id: '2' })
    provider.dispose()
  })

  it('consumer receives service-resolved from provider', () => {
    const provider = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const consumer = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const cb = vi.fn()

    provider.register('_rcon._tcp.discover', { port: '19132' })
    consumer.query('_tcp.discover', cb)

    expect(cb).toHaveBeenCalledWith({
      type: 'service-resolved',
      service: { serviceType: '_rcon._tcp.discover', meta: { port: '19132' } },
    })

    provider.dispose()
    consumer.dispose()
  })

  it('query does not fire for non-matching type', () => {
    const provider = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const consumer = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const cb = vi.fn()

    provider.register('_rcon._tcp.discover')
    consumer.query('_other._tcp.discover', cb)

    expect(cb).not.toHaveBeenCalled()
    provider.dispose()
    consumer.dispose()
  })

  it('suffix matching: .discover matches everything', () => {
    const provider = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const consumer = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const cb = vi.fn()

    provider.register('_a._tcp.discover')
    provider.register('_b._udp.discover')
    consumer.query('.discover', cb)

    expect(cb).toHaveBeenCalledTimes(2)
    provider.dispose()
    consumer.dispose()
  })

  it('query returns stop function', () => {
    const provider = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const consumer = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const cb = vi.fn()

    const stop = consumer.query('.discover', cb)
    provider.register('_x._tcp.discover')
    cb.mockClear()
    stop()

    provider.dispose()
    consumer.dispose()
  })

  it('service-removed fires after TTL when provider stops heartbeating', () => {
    const provider = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const consumer = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const cb = vi.fn()

    consumer.query('.discover', cb)
    provider.register('_rcon._tcp.discover', { port: '19132' })
    cb.mockClear()

    provider.dispose()

    vi.advanceTimersByTime(16000)

    expect(cb).toHaveBeenCalledWith({
      type: 'service-removed',
      serviceType: '_rcon._tcp.discover',
    })

    consumer.dispose()
  })

  it('heartbeat refreshes TTL so service stays alive', () => {
    const provider = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const consumer = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const cb = vi.fn()

    consumer.query('.discover', cb)
    provider.register('_rcon._tcp.discover', { port: '19132' })
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

    consumer.query('_tcp.discover', cb1)
    consumer.query('.discover', cb2)
    provider.register('_svc._tcp.discover')

    expect(cb1).toHaveBeenCalledOnce()
    expect(cb2).toHaveBeenCalledOnce()

    provider.dispose()
    consumer.dispose()
  })

  it('numbered instances on duplicate register', () => {
    const provider = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const consumer = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const cb = vi.fn()

    provider.register('_svc.discover', { i: '1' })
    provider.register('_svc.discover', { i: '2' })
    provider.register('_svc.discover', { i: '3' })
    consumer.query('.discover', cb)

    expect(cb).toHaveBeenCalledTimes(3)

    provider.dispose()
    consumer.dispose()
  })

  it('register auto-appends .discover suffix', () => {
    const provider = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const consumer = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const cb = vi.fn()

    provider.register('_rcon._tcp')
    consumer.query('_rcon._tcp.discover', cb)

    expect(cb).toHaveBeenCalledWith({
      type: 'service-resolved',
      service: { serviceType: '_rcon._tcp.discover', meta: {} },
    })

    provider.dispose()
    consumer.dispose()
  })

  it('dispose stops everything', () => {
    const provider = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const consumer = new Discover({ heartbeatInterval: 5000, ttl: 15000 })
    const cb = vi.fn()

    consumer.query('.discover', cb)
    provider.register('_test._tcp.discover', { x: '1' })
    cb.mockClear()

    provider.dispose()
    consumer.dispose()

    vi.advanceTimersByTime(20000)
    expect(cb).not.toHaveBeenCalled()
  })
})

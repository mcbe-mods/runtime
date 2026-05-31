import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Log } from '../src/log'

describe('Log', () => {
  const originalLevel = Log.level
  const originalTimestamp = Log.timestamp

  beforeEach(() => {
    Log.level = 'info'
    Log.timestamp = false
  })

  afterEach(() => {
    Log.level = originalLevel
    Log.timestamp = originalTimestamp
  })

  describe('level filtering', () => {
    it('outputs when level matches', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const log = new Log('Test')
      log.warn('msg')
      expect(spy).toHaveBeenCalledOnce()
      spy.mockRestore()
    })

    it('suppresses when level is below threshold', () => {
      Log.level = 'warn'
      const spy = vi.spyOn(console, 'info' as any).mockImplementation(() => {})
      const log = new Log('Test')
      log.info('silent')
      expect(spy).not.toHaveBeenCalled()
      spy.mockRestore()
    })

    it('outputs error when level is error', () => {
      Log.level = 'error'
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const log = new Log('Test')
      log.warn('should not show')
      log.error('should show')
      expect(spy).toHaveBeenCalledOnce()
      spy.mockRestore()
    })

    it('fatal outputs to console.error', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const log = new Log('Test')
      log.fatal('critical')
      expect(spy).toHaveBeenCalledOnce()
      spy.mockRestore()
    })

    it('outputs with name prefix', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const log = new Log('MyLogger')
      log.warn('hello')
      expect(spy).toHaveBeenCalledWith('[MyLogger]', 'hello')
      spy.mockRestore()
    })
  })

  describe('debug lazy evaluation', () => {
    it('calls function when debug level is active', () => {
      Log.level = 'debug'
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const fn = vi.fn(() => 'result')
      const log = new Log('Test')
      log.debug(fn)
      expect(fn).toHaveBeenCalledOnce()
      expect(spy).toHaveBeenCalledWith('[Test]', 'result')
      spy.mockRestore()
    })

    it('does not call function when debug level is inactive', () => {
      Log.level = 'info'
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const fn = vi.fn(() => 'result')
      const log = new Log('Test')
      log.debug(fn)
      expect(fn).not.toHaveBeenCalled()
      expect(spy).not.toHaveBeenCalled()
      spy.mockRestore()
    })
  })

  describe('child logger', () => {
    it('creates child with correct name prefix', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const parent = new Log('Parent')
      const child = parent.child('Child')
      child.warn('test')
      expect(spy).toHaveBeenCalledWith('[Parent:Child]', 'test')
      spy.mockRestore()
    })

    it('inherits timestamp setting from parent', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const parent = new Log('Parent', { timestamp: true })
      const child = parent.child('Child')
      child.warn('test')
      const args = spy.mock.calls[0]
      expect(args[0]).toMatch(/^\[\d{2}:\d{2}:\d{2}\]/)
      spy.mockRestore()
    })

    it('allows overriding options in child', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const parent = new Log('Parent', { timestamp: false })
      const child = parent.child('Child', { timestamp: true })
      child.warn('test')
      const args = spy.mock.calls[0]
      expect(args[0]).toMatch(/^\[\d{2}:\d{2}:\d{2}\]/)
      spy.mockRestore()
    })
  })

  describe('timestamp', () => {
    it('includes timestamp in output when enabled', () => {
      Log.timestamp = true
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const log = new Log('Test')
      log.warn('msg')
      expect(spy).toHaveBeenCalledOnce()
      const args = spy.mock.calls[0]
      expect(args[0]).toMatch(/^\[\d{2}:\d{2}:\d{2}\]/)
      expect(args[1]).toBe('msg')
      spy.mockRestore()
    })

    it('does not include timestamp when disabled', () => {
      Log.timestamp = false
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const log = new Log('Test')
      log.warn('msg')
      expect(spy).toHaveBeenCalledWith('[Test]', 'msg')
      spy.mockRestore()
    })

    it('per-logger timestamp overrides global', () => {
      Log.timestamp = false
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const log = new Log('Test', { timestamp: true })
      log.warn('msg')
      const args = spy.mock.calls[0]
      expect(args[0]).toMatch(/^\[\d{2}:\d{2}:\d{2}\]/)
      spy.mockRestore()
    })

    it('uses custom dateFormat', () => {
      Log.timestamp = true
      Log.dateFormat = 'YYYY'
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const log = new Log('Test')
      log.warn('year')
      const args = spy.mock.calls[0]
      expect(args[0]).toMatch(/^\[\d{4}\]/)
      spy.mockRestore()
    })
  })
})

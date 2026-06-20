import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Log } from '../src/log'

describe('Log', () => {
  const originalLevel = Log.defaultLevel
  const originalTimestamp = Log.defaultTimestamp

  beforeEach(() => {
    Log.defaultLevel = 'info'
    Log.defaultTimestamp = false
  })

  afterEach(() => {
    Log.defaultLevel = originalLevel
    Log.defaultTimestamp = originalTimestamp
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
      Log.defaultLevel = 'warn'
      const spy = vi.spyOn(console, 'info' as any).mockImplementation(() => {})
      const log = new Log('Test')
      log.info('silent')
      expect(spy).not.toHaveBeenCalled()
      spy.mockRestore()
    })

    it('outputs error when level is error', () => {
      Log.defaultLevel = 'error'
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
      expect(spy).toHaveBeenCalledWith('[warn] [MyLogger]', 'hello')
      spy.mockRestore()
    })

    it('isolates level between instances', () => {
      const spyInfo = vi.spyOn(console, 'info').mockImplementation(() => {})
      const spyWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

      Log.defaultLevel = 'error'
      const debugLogger = new Log('Debug', { level: 'debug' })
      const errorLogger = new Log('Error', { level: 'error' })

      debugLogger.warn('A')
      errorLogger.warn('B')
      expect(spyWarn).toHaveBeenCalledOnce()
      expect(spyWarn).toHaveBeenCalledWith('[warn] [Debug]', 'A')

      debugLogger.info('C')
      errorLogger.info('D')
      expect(spyInfo).toHaveBeenCalledOnce()
      expect(spyInfo).toHaveBeenCalledWith('[info] [Debug]', 'C')

      spyInfo.mockRestore()
      spyWarn.mockRestore()
    })
  })

  describe('debug', () => {
    it('accepts direct string arguments', () => {
      Log.defaultLevel = 'debug'
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const log = new Log('Test')
      log.debug('hello', 'world')
      expect(spy).toHaveBeenCalledWith('[debug] [Test]', 'hello', 'world')
      spy.mockRestore()
    })

    it('accepts lazy thunk', () => {
      Log.defaultLevel = 'debug'
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const fn = vi.fn(() => 'result')
      const log = new Log('Test')
      log.debug(fn)
      expect(fn).toHaveBeenCalledOnce()
      expect(spy).toHaveBeenCalledWith('[debug] [Test]', 'result')
      spy.mockRestore()
    })

    it('does not evaluate thunk when debug level is inactive', () => {
      Log.defaultLevel = 'info'
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const fn = vi.fn(() => 'result')
      const log = new Log('Test')
      log.debug(fn)
      expect(fn).not.toHaveBeenCalled()
      expect(spy).not.toHaveBeenCalled()
      spy.mockRestore()
    })

    it('does not output direct args when debug level is inactive', () => {
      Log.defaultLevel = 'info'
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const log = new Log('Test')
      log.debug('silent')
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
      expect(spy).toHaveBeenCalledWith('[warn] [Parent:Child]', 'test')
      spy.mockRestore()
    })

    it('inherits timestamp setting from parent', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const parent = new Log('Parent', { timestamp: true })
      const child = parent.child('Child')
      child.warn('test')
      const args = spy.mock.calls[0]
      expect(args[0]).toMatch(/^\[warn\] \[\d{2}:\d{2}:\d{2}\]/)
      spy.mockRestore()
    })

    it('allows overriding options in child', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const parent = new Log('Parent', { timestamp: false })
      const child = parent.child('Child', { timestamp: true })
      child.warn('test')
      const args = spy.mock.calls[0]
      expect(args[0]).toMatch(/^\[warn\] \[\d{2}:\d{2}:\d{2}\]/)
      spy.mockRestore()
    })
  })

  describe('timestamp', () => {
    it('includes timestamp in output when enabled', () => {
      Log.defaultTimestamp = true
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const log = new Log('Test')
      log.warn('msg')
      expect(spy).toHaveBeenCalledOnce()
      const args = spy.mock.calls[0]
      expect(args[0]).toMatch(/^\[warn\] \[\d{2}:\d{2}:\d{2}\]/)
      expect(args[1]).toBe('msg')
      spy.mockRestore()
    })

    it('does not include timestamp when disabled', () => {
      Log.defaultTimestamp = false
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const log = new Log('Test')
      log.warn('msg')
      expect(spy).toHaveBeenCalledWith('[warn] [Test]', 'msg')
      spy.mockRestore()
    })

    it('per-logger timestamp overrides global', () => {
      Log.defaultTimestamp = false
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const log = new Log('Test', { timestamp: true })
      log.warn('msg')
      const args = spy.mock.calls[0]
      expect(args[0]).toMatch(/^\[warn\] \[\d{2}:\d{2}:\d{2}\]/)
      spy.mockRestore()
    })

    it('uses custom dateFormat', () => {
      Log.defaultTimestamp = true
      Log.defaultDateFormat = 'YYYY'
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const log = new Log('Test')
      log.warn('year')
      const args = spy.mock.calls[0]
      expect(args[0]).toMatch(/^\[warn\] \[\d{4}\]/)
      spy.mockRestore()
    })
  })
})

import type { LogLevel } from './levels'
import tinydateformat from 'tinydateformat2'
import { LEVELS } from './levels'

export interface LogOptions {
  level?: LogLevel
  timestamp?: boolean
  dateFormat?: string
}

export class Log {
  static defaultLevel: LogLevel = 'info'
  static defaultTimestamp = false
  static defaultDateFormat = 'HH:mm:ss'

  readonly #name: string
  readonly #level: LogLevel
  readonly #timestamp?: boolean
  readonly #dateFormat?: string

  constructor(name: string, options?: LogOptions) {
    if (typeof name !== 'string' || !name) {
      throw new TypeError('Log name must be a non-empty string')
    }
    this.#name = name
    if (options?.level !== undefined && !(options.level in LEVELS)) {
      throw new TypeError(`Invalid log level: ${options.level}`)
    }
    this.#level = options?.level ?? Log.defaultLevel
    this.#timestamp = options?.timestamp
    this.#dateFormat = options?.dateFormat
  }

  get level(): LogLevel {
    return this.#level ?? Log.defaultLevel
  }

  debug(...args: unknown[]): void
  debug(fn: () => unknown): void
  debug(fnOrArg: (() => unknown) | unknown, ...rest: unknown[]): void {
    if (LEVELS[this.level] > LEVELS.debug) {
      return
    }
    if (typeof fnOrArg === 'function') {
      let val: unknown
      try {
        val = (fnOrArg as () => unknown)()
      }
      catch (e) {
        console.error(this.#format('error'), `thunk threw: ${e}`)
        return
      }
      if (val !== undefined) {
        console.log(this.#format('debug'), val)
      }
      else {
        console.log(this.#format('debug'))
      }
    }
    else {
      console.log(this.#format('debug'), fnOrArg, ...rest)
    }
  }

  info(...args: unknown[]): void {
    if (LEVELS[this.level] > LEVELS.info) {
      return
    }
    console.info(this.#format('info'), ...args)
  }

  warn(...args: unknown[]): void {
    if (LEVELS[this.level] > LEVELS.warn) {
      return
    }
    console.warn(this.#format('warn'), ...args)
  }

  error(...args: unknown[]): void {
    if (LEVELS[this.level] > LEVELS.error) {
      return
    }
    console.error(this.#format('error'), ...args)
  }

  fatal(...args: unknown[]): void {
    if (LEVELS[this.level] > LEVELS.fatal) {
      return
    }
    console.error(this.#format('fatal'), ...args)
  }

  child(name: string, options?: LogOptions): Log {
    if (typeof name !== 'string' || !name) {
      throw new TypeError('Log name must be a non-empty string')
    }
    const childName = this.#name ? `${this.#name}:${name}` : name
    return new Log(childName, {
      level: options?.level ?? this.#level,
      timestamp: options?.timestamp ?? this.#timestamp,
      dateFormat: options?.dateFormat ?? this.#dateFormat,
    })
  }

  #format(level: string): string {
    let prefix = `[${level}] `
    const showTimestamp = this.#timestamp ?? Log.defaultTimestamp
    if (showTimestamp) {
      const fmt = this.#dateFormat ?? Log.defaultDateFormat
      prefix += `[${tinydateformat(fmt)}] `
    }
    prefix += `[${this.#name}]`
    return prefix
  }
}

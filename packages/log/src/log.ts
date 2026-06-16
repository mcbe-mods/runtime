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
  readonly #level?: LogLevel
  readonly #timestamp?: boolean
  readonly #dateFormat?: string

  constructor(name: string, options?: LogOptions) {
    this.#name = name
    this.#level = options?.level
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
      const val = (fnOrArg as () => unknown)()
      if (val !== undefined) {
        console.log(this.#format(), val)
      }
      else {
        console.log(this.#format())
      }
    }
    else {
      console.log(this.#format(), fnOrArg, ...rest)
    }
  }

  info(...args: unknown[]): void {
    if (LEVELS[this.level] > LEVELS.info) {
      return
    }
    console.info(this.#format(), ...args)
  }

  warn(...args: unknown[]): void {
    if (LEVELS[this.level] > LEVELS.warn) {
      return
    }
    console.warn(this.#format(), ...args)
  }

  error(...args: unknown[]): void {
    if (LEVELS[this.level] > LEVELS.error) {
      return
    }
    console.error(this.#format(), ...args)
  }

  fatal(...args: unknown[]): void {
    if (LEVELS[this.level] > LEVELS.fatal) {
      return
    }
    console.error(this.#format(), ...args)
  }

  child(name: string, options?: LogOptions): Log {
    const childName = this.#name ? `${this.#name}:${name}` : name
    return new Log(childName, {
      level: options?.level ?? this.#level,
      timestamp: options?.timestamp ?? this.#timestamp,
      dateFormat: options?.dateFormat ?? this.#dateFormat,
    })
  }

  #format(): string {
    let prefix = ''
    const showTimestamp = this.#timestamp ?? Log.defaultTimestamp
    if (showTimestamp) {
      const fmt = this.#dateFormat ?? Log.defaultDateFormat
      prefix += `[${tinydateformat(fmt)}] `
    }
    prefix += `[${this.#name}]`
    return prefix
  }
}

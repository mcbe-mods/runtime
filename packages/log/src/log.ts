import type { LogLevel } from './levels'
import tinydateformat from 'tinydateformat2'
import { LEVELS } from './levels'

export interface LogOptions {
  timestamp?: boolean
  dateFormat?: string
}

export class Log {
  static level: LogLevel = 'info'
  static timestamp = false
  static dateFormat = 'HH:mm:ss'

  readonly #name: string
  readonly #timestamp: boolean
  readonly #dateFormat: string

  constructor(name: string, options?: LogOptions) {
    this.#name = name
    this.#timestamp = options?.timestamp ?? Log.timestamp
    this.#dateFormat = options?.dateFormat ?? Log.dateFormat
  }

  debug(fn: () => unknown): void {
    if (LEVELS[Log.level] > LEVELS.debug) {
      return
    }
    const val = fn()
    if (val !== undefined) {
      console.log(this.#format(), val)
    }
    else {
      console.log(this.#format())
    }
  }

  info(...args: unknown[]): void {
    if (LEVELS[Log.level] > LEVELS.info) {
      return
    }
    console.info(this.#format(), ...args)
  }

  warn(...args: unknown[]): void {
    if (LEVELS[Log.level] > LEVELS.warn) {
      return
    }
    console.warn(this.#format(), ...args)
  }

  error(...args: unknown[]): void {
    if (LEVELS[Log.level] > LEVELS.error) {
      return
    }
    console.error(this.#format(), ...args)
  }

  fatal(...args: unknown[]): void {
    if (LEVELS[Log.level] > LEVELS.fatal) {
      return
    }
    console.error(this.#format(), ...args)
  }

  child(name: string, options?: LogOptions): Log {
    const childName = this.#name ? `${this.#name}:${name}` : name
    return new Log(childName, {
      timestamp: options?.timestamp ?? this.#timestamp,
      dateFormat: options?.dateFormat ?? this.#dateFormat,
    })
  }

  #format(): string {
    let prefix = ''
    if (this.#timestamp || Log.timestamp) {
      prefix += `[${tinydateformat(this.#dateFormat)}] `
    }
    prefix += `[${this.#name}]`
    return prefix
  }
}

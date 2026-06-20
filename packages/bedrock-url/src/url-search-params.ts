/**
 * Minimal URLSearchParams implementation.
 *
 * QuickJS polyfill: Minecraft Bedrock Script API does not provide the
 * standard URLSearchParams class. This implements the subset needed for
 * the bedrock:// URL scheme used in addon-to-addon communication.
 */
export class URLSearchParams {
  readonly #entries: [string, string][] = []

  constructor(init?: string | Record<string, string>) {
    if (typeof init === 'string') {
      const qs = init.startsWith('?') ? init.slice(1) : init
      if (!qs) {
        return
      }
      for (const pair of qs.split('&')) {
        if (!pair) {
          continue
        }
        const eq = pair.indexOf('=')
        if (eq === -1) {
          this.#entries.push([decodeURIComponent(pair.replace(/\+/g, ' ')), ''])
        }
        else {
          const name = pair.slice(0, eq)
          const value = pair.slice(eq + 1)
          this.#entries.push([
            decodeURIComponent(name.replace(/\+/g, ' ')),
            decodeURIComponent(value.replace(/\+/g, ' ')),
          ])
        }
      }
    }
    else if (init) {
      for (const key of Object.keys(init)) {
        this.#entries.push([key, String(init[key])])
      }
    }
  }

  get(name: string): string | null {
    const entry = this.#entries.find(([k]) => k === name)
    return entry ? entry[1] : null
  }

  getAll(name: string): string[] {
    return this.#entries.filter(([k]) => k === name).map(([, v]) => v)
  }

  has(name: string): boolean {
    return this.#entries.some(([k]) => k === name)
  }

  set(name: string, value: string): void {
    let found = false
    for (let i = 0; i < this.#entries.length; i++) {
      if (this.#entries[i][0] === name) {
        if (found) {
          this.#entries.splice(i, 1)
          i--
        }
        else {
          this.#entries[i][1] = value
          found = true
        }
      }
    }
    if (!found) {
      this.#entries.push([name, value])
    }
  }

  append(name: string, value: string): void {
    this.#entries.push([name, value])
  }

  delete(name: string): void {
    for (let i = this.#entries.length - 1; i >= 0; i--) {
      if (this.#entries[i][0] === name) {
        this.#entries.splice(i, 1)
      }
    }
  }

  forEach(fn: (value: string, name: string) => void): void {
    for (const [name, value] of this.#entries) {
      fn(value, name)
    }
  }

  keys(): string[] {
    return this.#entries.map(([k]) => k)
  }

  values(): string[] {
    return this.#entries.map(([, v]) => v)
  }

  toString(): string {
    return this.#entries
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&')
  }
}

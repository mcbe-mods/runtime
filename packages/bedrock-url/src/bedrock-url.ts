import { URLSearchParams } from './url-search-params'

const SCHEME = 'bedrock'
const SCHEME_PREFIX = 'bedrock://'

/**
 * Minimal URL implementation for the bedrock:// scheme.
 *
 * QuickJS polyfill: Minecraft Bedrock Script API does not provide the
 * standard URL class. This implementation supports the bedrock:// scheme
 * used for addon-to-addon communication via script events.
 */
export class BedrockURL {
  #host = ''
  #hostname = ''
  #port = ''
  #pathname = ''
  #hash = ''
  #searchParams = new URLSearchParams()

  constructor(url: string, base?: string | BedrockURL) {
    if (url.includes('://')) {
      this.#parse(url)
    }
    else if (base) {
      const baseHref = typeof base === 'string' ? base : base.href
      if (!baseHref.startsWith(SCHEME_PREFIX)) {
        throw new TypeError(`Invalid base URL: "${baseHref}"`)
      }
      const baseBody = baseHref.slice(SCHEME_PREFIX.length)
      const baseHost = baseBody.includes('/') ? baseBody.slice(0, baseBody.indexOf('/')) : baseBody

      if (url.startsWith('/')) {
        this.#parse(SCHEME_PREFIX + baseHost + url)
      }
      else {
        const baseBodyClean = baseBody.includes('?') ? baseBody.slice(0, baseBody.indexOf('?')) : baseBody
        const baseBodyCleaner = baseBodyClean.includes('#') ? baseBodyClean.slice(0, baseBodyClean.indexOf('#')) : baseBodyClean
        const basePath = baseBodyCleaner.includes('/') ? baseBodyCleaner.slice(baseBodyCleaner.indexOf('/')) : '/'
        const baseDir = basePath.endsWith('/') ? basePath : basePath.slice(0, basePath.lastIndexOf('/') + 1)
        this.#parse(SCHEME_PREFIX + baseHost + baseDir + url)
      }
    }
    else {
      throw new TypeError(`Invalid BedrockURL: "${url}" — must include "://" or provide a base`)
    }
  }

  #parse(input: string): void {
    if (!input.startsWith(SCHEME_PREFIX)) {
      throw new TypeError(`Invalid scheme: expected "bedrock://"`)
    }

    const hashIndex = input.indexOf('#')
    if (hashIndex !== -1) {
      this.#hash = input.slice(hashIndex)
      input = input.slice(0, hashIndex)
    }
    else {
      this.#hash = ''
    }

    const rest = input.slice(SCHEME_PREFIX.length)
    const firstSlash = rest.indexOf('/')

    let authority: string
    let searchStr: string
    if (firstSlash === -1) {
      const q = rest.indexOf('?')
      if (q === -1) {
        authority = rest
        searchStr = ''
      }
      else {
        authority = rest.slice(0, q)
        searchStr = rest.slice(q)
      }
      this.#pathname = ''
    }
    else {
      authority = rest.slice(0, firstSlash)
      const ps = rest.slice(firstSlash)
      const q = ps.indexOf('?')
      if (q === -1) {
        this.#pathname = ps
        searchStr = ''
      }
      else {
        this.#pathname = ps.slice(0, q)
        searchStr = ps.slice(q)
      }
    }

    this.#searchParams = new URLSearchParams(searchStr)
    this.#parseAuthority(authority)
  }

  #parseAuthority(authority: string): void {
    this.#host = authority

    if (authority.startsWith('[')) {
      const closeBracket = authority.indexOf(']')
      if (closeBracket !== -1) {
        this.#hostname = authority.slice(0, closeBracket + 1)
        const after = authority.slice(closeBracket + 1)
        this.#port = after.startsWith(':') ? after.slice(1) : ''
      }
      else {
        this.#hostname = authority
        this.#port = ''
      }
    }
    else {
      const colon = authority.lastIndexOf(':')
      if (colon !== -1) {
        const possiblePort = authority.slice(colon + 1)
        if (/^\d+$/.test(possiblePort)) {
          this.#hostname = authority.slice(0, colon)
          this.#port = possiblePort
        }
        else {
          this.#hostname = authority
          this.#port = ''
        }
      }
      else {
        this.#hostname = authority
        this.#port = ''
      }
    }
  }

  get href(): string {
    let result = SCHEME_PREFIX + this.#host + this.#pathname + this.search
    if (this.#hash) {
      result += this.#hash
    }
    return result
  }

  get protocol(): string {
    return `${SCHEME}:`
  }

  get host(): string {
    return this.#host
  }

  get hostname(): string {
    return this.#hostname
  }

  get port(): string {
    return this.#port
  }

  get pathname(): string {
    return this.#pathname
  }

  get search(): string {
    const qs = this.#searchParams.toString()
    return qs ? `?${qs}` : ''
  }

  get hash(): string {
    return this.#hash
  }

  get searchParams(): URLSearchParams {
    return this.#searchParams
  }

  get origin(): string {
    return SCHEME_PREFIX + this.#hostname
  }

  toString(): string {
    return this.href
  }

  toScriptEventId(): string {
    return this.href
  }
}

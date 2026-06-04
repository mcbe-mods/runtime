import type { DiscoverOptions, LocalRegistration, QueryEntry, RemoteEntry, ServiceEvent } from './types'

import { Log } from '@mcbe-mods/log'
import { Protocol } from '@mcbe-mods/protocol'
import { system } from '@minecraft/server'

const DISCOVER_VERSION = '1'
const DEFAULT_HEARTBEAT_INTERVAL = 5000
const DEFAULT_TTL = 15000

let idCounter = 0
function generateId(): string {
  const r = ((Math.random() * 0x100000000) >>> 0).toString(16).slice(0, 6).toUpperCase()
  const c = (idCounter++ % 36).toString(36).toUpperCase()
  return r + c
}

function normalizeServiceType(hostname: string): string {
  return hostname.replace(/^([^.]+?)-\d+(\.)/, '$1$2')
}

function msToTicks(ms: number): number {
  return Math.ceil(ms / 50)
}

export class Discover {
  readonly #options: Required<DiscoverOptions>
  readonly #protocol: Protocol
  readonly #log: Log

  #nextInstanceIds = new Map<string, number>()
  #localServices = new Map<string, LocalRegistration>()
  #remoteCache = new Map<string, RemoteEntry>()
  #queries = new Map<number, QueryEntry>()
  #queryIdCounter = 0
  #sentIds = new Set<string>()
  #ttlTimer: number | undefined

  constructor(options: DiscoverOptions = {}) {
    this.#options = {
      heartbeatInterval: options.heartbeatInterval ?? DEFAULT_HEARTBEAT_INTERVAL,
      ttl: options.ttl ?? DEFAULT_TTL,
    }
    this.#protocol = new Protocol()
    this.#log = new Log('Discover')

    this.#protocol.onReceive((event) => {
      if (event.sourceType !== 'Server') {
        return
      }
      if (!event.url.hostname || !event.url.hostname.endsWith('.discover')) {
        return
      }

      const nonce = event.url.searchParams.get('i')
      if (nonce && this.#sentIds.has(nonce)) {
        this.#sentIds.delete(nonce)
        return
      }

      const hostname = event.url.hostname
      const serviceType = normalizeServiceType(hostname)

      let meta: Record<string, string>
      try {
        const parsed = JSON.parse(event.message)
        meta = (parsed && typeof parsed === 'object' && 'meta' in parsed) ? parsed.meta : {}
      }
      catch {
        this.#log.warn(`Invalid JSON from ${hostname}: ${event.message}`)
        return
      }

      const now = Date.now()
      this.#remoteCache.set(hostname, { serviceType, meta, lastSeen: now })

      this.#notifyQueries(serviceType, { type: 'service-resolved', service: { serviceType, meta } })
    })

    this.#startTtlTimer()
  }

  register(type: string, meta?: Record<string, string>): () => void {
    const metadata = meta ?? {}

    const n = this.#nextInstanceIds.get(type) ?? 1
    this.#nextInstanceIds.set(type, n + 1)

    const fullname = n === 1
      ? type
      : type.replace(/^([^.]+)/, `$1-${n}`)

    const body = JSON.stringify({ meta: metadata })

    const post = (): void => {
      const nonce = generateId()
      this.#sentIds.add(nonce)
      const url = `bedrock://${fullname}/?v=${DISCOVER_VERSION}&i=${nonce}`
      this.#protocol.post(url, body)
    }

    post()

    const timer = system.runInterval(post, msToTicks(this.#options.heartbeatInterval))

    const registration: LocalRegistration = { fullname, metadata, timer }
    this.#localServices.set(fullname, registration)

    return () => {
      system.clearRun(registration.timer)
      this.#localServices.delete(fullname)
    }
  }

  query(type: string, callback: (event: ServiceEvent) => void): () => void {
    const id = ++this.#queryIdCounter
    this.#queries.set(id, { type, callback })

    for (const entry of this.#remoteCache.values()) {
      if (entry.serviceType.endsWith(type)) {
        callback({ type: 'service-resolved', service: { serviceType: entry.serviceType, meta: entry.meta } })
      }
    }

    return () => {
      this.#queries.delete(id)
    }
  }

  dispose(): void {
    if (this.#ttlTimer !== undefined)
      system.clearRun(this.#ttlTimer)
    for (const reg of this.#localServices.values()) {
      system.clearRun(reg.timer)
    }
    this.#protocol.dispose()
    this.#localServices.clear()
    this.#remoteCache.clear()
    this.#queries.clear()
    this.#nextInstanceIds.clear()
    this.#sentIds.clear()
  }

  #startTtlTimer(): void {
    this.#ttlTimer = system.runInterval(() => {
      const now = Date.now()
      for (const [hostname, entry] of this.#remoteCache) {
        if (now - entry.lastSeen > this.#options.ttl) {
          this.#remoteCache.delete(hostname)
          this.#notifyQueries(entry.serviceType, { type: 'service-removed', serviceType: entry.serviceType })
        }
      }
    }, msToTicks(1000))
  }

  #notifyQueries(serviceType: string, event: ServiceEvent): void {
    for (const query of this.#queries.values()) {
      if (serviceType.endsWith(query.type)) {
        try {
          query.callback(event)
        }
        catch (e) {
          this.#log.warn(`Query callback error: ${e}`)
        }
      }
    }
  }
}

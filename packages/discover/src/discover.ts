import type { DiscoverOptions, LocalRegistration, QueryEntry, RemoteEntry, ServiceEvent } from './types'

import { BedrockURL } from '@mcbe-mods/bedrock-url'
import { Log } from '@mcbe-mods/log'
import { Protocol } from '@mcbe-mods/protocol'
import { unique } from '@mcbe-mods/utils'
import { system } from '@minecraft/server'

const DISCOVER_VERSION = '1'
const DEFAULT_HEARTBEAT_INTERVAL = 5000
const DEFAULT_TTL = 15000

function normalizeServiceType(hostname: string): string {
  return hostname.replace(/^([^.]+?)-\d+(\.)/, '$1$2').replace(/\.discover$/, '')
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

      let meta: unknown
      try {
        const parsed = JSON.parse(event.message)
        if (parsed !== null && typeof parsed === 'object' && 'meta' in parsed) {
          meta = (parsed as Record<string, unknown>).meta
        }
        else {
          meta = parsed
        }
      }
      catch {
        meta = event.message
      }

      const now = Date.now()
      this.#remoteCache.set(hostname, { serviceType, meta, lastSeen: now })

      this.#notifyQueries(serviceType, { type: 'service-resolved', service: { serviceType, meta } })
    })

    this.#startTtlTimer()
  }

  register<M = Record<string, any>>(type: string, meta?: M): () => void {
    const _meta = meta ?? {}

    const n = this.#nextInstanceIds.get(type) ?? 1
    this.#nextInstanceIds.set(type, n + 1)

    const hostname = n === 1
      ? `${type}.discover`
      : `${type.replace(/^([^.]+)/, `$1-${n}`)}.discover`

    const body = JSON.stringify({ meta: _meta })

    const post = (): void => {
      const nonce = unique()
      this.#sentIds.add(nonce)
      const url = new BedrockURL(`bedrock://${hostname}/`)
      url.searchParams.set('v', DISCOVER_VERSION)
      url.searchParams.set('i', nonce)
      this.#protocol.post(url, body)
    }

    post()

    const timer = system.runInterval(post, msToTicks(this.#options.heartbeatInterval))

    const registration: LocalRegistration = { fullname: hostname, meta: _meta, timer }
    this.#localServices.set(hostname, registration)

    return () => {
      system.clearRun(registration.timer)
      this.#localServices.delete(hostname)
    }
  }

  query<M = Record<string, any>>(type: string, callback: (event: ServiceEvent<M>) => void): () => void {
    const id = ++this.#queryIdCounter
    this.#queries.set(id, { type, callback })

    for (const entry of this.#remoteCache.values()) {
      if (entry.serviceType.endsWith(type)) {
        callback({ type: 'service-resolved', service: { serviceType: entry.serviceType, meta: entry.meta } } as ServiceEvent<M>)
      }
    }

    return () => {
      this.#queries.delete(id)
    }
  }

  dispose(): void {
    if (this.#ttlTimer !== undefined) {
      system.clearRun(this.#ttlTimer)
    }
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

  #notifyQueries(serviceType: string, event: ServiceEvent<any>): void {
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

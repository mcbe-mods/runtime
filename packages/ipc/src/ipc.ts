import type { IPCEvents } from './events'
import type {
  DataCompressor,
  IPCOptions,
  OnOptions,
  SendOptions,
} from './types'

import { BedrockURL } from '@mcbe-mods/bedrock-url'
import { Log } from '@mcbe-mods/log'
import { Protocol } from '@mcbe-mods/protocol'
import { unique } from '@mcbe-mods/utils'
import { EventEmitter } from 'mini-emit'
import { Chunker } from './chunk'
import { PROTOCOL_VERSION } from './constants'
import { EVENTS } from './events'

type DefaultedIPCOptions = Required<Omit<IPCOptions, 'cipher' | 'compress'>> & Pick<IPCOptions, 'cipher' | 'compress'>

const DEFAULT_OPTIONS: DefaultedIPCOptions = {
  namespace: 'global',
  chunkSize: 1800,
  compressThreshold: 800,
  maxPacketSize: 1_000_000,
  chunkTimeout: 30_000,
}

const IPC_HOST_SUFFIX = '.ipc'

/**
 * IPC (Inter-Pack Communication) — message passing between Minecraft Bedrock behavior packs.
 *
 * Built on top of bedrock:// protocol, supports:
 * - Fire-and-forget messaging (`send` / `on`)
 * - Automatic chunking of large payloads
 * - Optional pluggable compression via {@link DataCompressor}
 * - Optional encryption via ProtocolCipher
 *
 * @example
 * ```ts
 * const ipc = new IPC({ namespace: 'myAddon' })
 * ipc.send('chat', { text: 'hello' })
 * ipc.on('chat', (msg) => console.log(msg))
 * ```
 */
export class IPC {
  readonly #options: DefaultedIPCOptions
  readonly #protocol: Protocol
  readonly #log: Log
  readonly #compressor?: DataCompressor
  readonly #chunker: Chunker
  readonly #onHandlers = new Map<string, Set<(data: string) => void>>()
  readonly #sentIds = new Set<string>()
  #protocolUnsubscribe: () => void

  /**
   * System-level event emitter for internal IPC events.
   * See {@link EVENTS} for available events.
   */
  readonly events = new EventEmitter<IPCEvents>()

  /**
   * Creates an IPC instance bound to the given namespace.
   * All addons that create an IPC with the same namespace can communicate.
   * @param options - Configuration options (see {@link IPCOptions})
   */
  constructor(options: IPCOptions = {}) {
    this.#options = { ...DEFAULT_OPTIONS, ...options }
    this.#protocol = new Protocol({ cipher: options.cipher })
    this.#log = new Log(`IPC:${this.#options.namespace}`)
    this.#compressor = options.compress
    this.#chunker = new Chunker(this.#options.chunkSize)

    this.#protocolUnsubscribe = this.#protocol.onReceive((event) => {
      if (event.sourceType !== 'Server') {
        return
      }
      if (!event.url.hostname || !event.url.hostname.endsWith(IPC_HOST_SUFFIX)) {
        return
      }
      const ns = event.url.hostname.slice(0, -IPC_HOST_SUFFIX.length)
      if (ns !== this.#options.namespace) {
        return
      }
      try {
        this.#handleReceive(event.url, event.message)
      }
      catch (e) {
        this.events.emit(EVENTS.ERROR, e as Error)
      }
    })
  }

  /**
   * Destroy this IPC instance.
   * Unsubscribes from the protocol, clears all handlers.
   * After calling this, the instance will no longer receive or process any messages.
   */
  dispose(): void {
    this.#protocolUnsubscribe()
    this.#onHandlers.clear()
    this.#sentIds.clear()
  }

  /**
   * Fire-and-forget: send data to a channel without expecting a response.
   * Use {@link on} on the receiving side to listen for these messages.
   * @param channel - The channel name
   * @param data - The data to send. If using a custom serializer, this is the typed value.
   * @param options - Optional settings (serializer)
   * @example
   * ```ts
   * ipc.send('notify')
   * ```
   * @example
   * ```ts
   * ipc.send('notify', { message: 'hello' })
   * ```
   * @example
   * ```ts
   * ipc.send('notify', { message: 'hello' }, { serializer: mySerializer })
   * ```
   */
  send(channel: string): void
  send<T>(channel: string, data: T): void
  send<T>(channel: string, data: T, options: SendOptions<T>): void
  send<T = never>(channel: string, data?: T, options?: SendOptions<T>): void {
    const id = unique()
    this.#sentIds.add(id)

    const body: string = data !== undefined
      ? (options?.serializer
          ? options.serializer.serialize(data)
          : JSON.stringify(data))
      : ''

    this.#sendBody(channel, id, body)
  }

  /**
   * Register a listener for fire-and-forget messages on a channel.
   * Paired with {@link send} on the other side.
   * Returns an unsubscribe function.
   * @param channel - The channel name to listen on
   * @param handler - Called with the deserialized data each time a message arrives
   * @param options - Optional settings (deserializer)
   * @returns A function that unsubscribes this listener
   * @example
   * ```ts
   * const off = ipc.on<string>('chat', (msg) => {
   *   console.log(msg)
   * })
   * // later: off()
   * ```
   * @example
   * ```ts
   * ipc.on('data', (data) => {
   *   console.log(data)
   * }, { deserializer: myDeserializer })
   * ```
   */
  on<T>(channel: string, handler: (data: T) => void): () => void
  on<T>(channel: string, handler: (data: T) => void, options: OnOptions<T>): () => void
  on<T>(
    channel: string,
    handler: (data: T) => void,
    options?: OnOptions<T>,
  ): () => void {
    const wrapped = (raw: string): void => {
      if (options?.deserializer) {
        handler(options.deserializer.deserialize(raw))
      }
      else if (raw === '') {
        handler(undefined as unknown as T)
      }
      else {
        handler(JSON.parse(raw) as T)
      }
    }

    let handlers = this.#onHandlers.get(channel)
    if (!handlers) {
      handlers = new Set()
      this.#onHandlers.set(channel, handlers)
    }
    handlers.add(wrapped)

    return () => {
      handlers!.delete(wrapped)
      if (handlers!.size === 0) {
        this.#onHandlers.delete(channel)
      }
    }
  }

  #channelUrl(channel: string, params: Record<string, string>): string {
    const url = new BedrockURL(`bedrock://${this.#options.namespace}${IPC_HOST_SUFFIX}/${channel}`)
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v)
    }
    return url.href
  }

  #sendBody(channel: string, id: string, body: string): void {
    if (body.length > this.#options.maxPacketSize) {
      throw new Error(
        `Body too large (${body.length} chars, max ${this.#options.maxPacketSize})`,
      )
    }

    let value = body
    let compressed = false
    if (body.length > this.#options.compressThreshold && this.#compressor) {
      const out = this.#compressor.compress(body)
      if (out.length < body.length) {
        value = out
        compressed = true
      }
    }
    const baseParams: Record<string, string> = { v: PROTOCOL_VERSION, id }
    if (compressed) {
      baseParams.c = '1'
    }

    if (value.length <= this.#options.chunkSize) {
      this.#protocol.post(this.#channelUrl(channel, baseParams), value)
      return
    }

    for (const chunk of this.#chunker.split(value)) {
      this.#protocol.post(
        this.#channelUrl(channel, { ...baseParams, seq: String(chunk.seq), total: String(chunk.total) }),
        chunk.data,
      )
    }
  }

  #handleReceive(url: BedrockURL, payload: string): void {
    const id = url.searchParams.get('id')
    if (!id) {
      return
    }

    // Loopback detection — before any JSON.parse
    if (this.#sentIds.has(id)) {
      this.#sentIds.delete(id)
      return
    }

    const v = url.searchParams.get('v')
    if (v !== PROTOCOL_VERSION) {
      return
    }

    const channel = url.pathname.slice(1)
    if (!this.#onHandlers.has(channel)) {
      return
    }

    const seq = url.searchParams.get('seq')
    const total = url.searchParams.get('total')
    const compressed = url.searchParams.get('c') !== null

    if (seq !== null && total !== null) {
      this.#handleChunk(id, channel, Number(seq), Number(total), payload, compressed)
    }
    else {
      const raw = compressed && this.#compressor ? this.#compressor.decompress(payload) : payload
      this.#deliver(channel, raw)
    }
  }

  #handleChunk(id: string, channel: string, seq: number, total: number, payload: string, compressed: boolean): void {
    const result = this.#chunker.assemble(id, seq, total, payload, compressed, this.#options.chunkTimeout)

    if (result.done) {
      const raw = result.compressed && this.#compressor
        ? this.#compressor.decompress(result.data)
        : result.data
      this.#deliver(channel, raw)
    }
  }

  #deliver(channel: string, data: string): void {
    const handlers = this.#onHandlers.get(channel)
    if (!handlers) {
      return
    }
    for (const handler of handlers) {
      try {
        handler(data)
      }
      catch (e) {
        this.events.emit(EVENTS.ERROR, e as Error)
      }
    }
  }
}

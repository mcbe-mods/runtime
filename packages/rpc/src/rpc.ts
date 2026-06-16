import type { RPCOptions } from './types'

import { BedrockURL } from '@mcbe-mods/bedrock-url'
import { Log } from '@mcbe-mods/log'
import { Protocol } from '@mcbe-mods/protocol'
import { ms2ticks, unique } from '@mcbe-mods/utils'
import { system } from '@minecraft/server'

type DefaultedRPCOptions = Required<Omit<RPCOptions, 'cipher'>> & Pick<RPCOptions, 'cipher'>

const DEFAULT_OPTIONS: DefaultedRPCOptions = {
  namespace: 'global',
  timeout: 5000,
}

const RPC_REQ_SUFFIX = '.req.rpc'
const RPC_RES_SUFFIX = '.res.rpc'
const RPC_VERSION = '1'

interface PendingInvoke {
  resolve: (value: unknown) => void
  reject: (reason: Error) => void
  timer: number | undefined
}

/**
 * RPC (Remote Procedure Call) — invoke methods on remote addons and get results back.
 *
 * Built on top of bedrock:// protocol, with no chunking or compression.
 * For large payloads, use {@link IPC} send/on instead.
 *
 * @example
 * ```ts
 * // Side A
 * const rpc = new RPC({ namespace: 'myAddon' })
 * const sum = await rpc.invoke<number>('add', { a: 1, b: 2 })
 *
 * // Side B
 * const rpc = new RPC({ namespace: 'myAddon' })
 * rpc.handle('add', (data: { a: number, b: number }) => data.a + data.b)
 * ```
 */
export class RPC {
  readonly #options: DefaultedRPCOptions
  readonly #protocol: Protocol
  readonly #log: Log
  readonly #pending = new Map<string, PendingInvoke>()
  readonly #handlers = new Map<string, (data: unknown) => unknown | Promise<unknown>>()
  readonly #sentIds = new Set<string>()
  #unsubscribe: () => void
  #disposed = false

  /**
   * Creates an RPC instance bound to the given namespace.
   * @param options - Configuration options (see {@link RPCOptions})
   */
  constructor(options: RPCOptions = {}) {
    this.#options = { ...DEFAULT_OPTIONS, ...options }
    this.#protocol = new Protocol({ cipher: options.cipher })
    this.#log = new Log(`RPC:${this.#options.namespace}`)

    this.#unsubscribe = this.#protocol.on((event) => {
      if (event.sourceType !== 'Server') {
        return
      }
      if (!event.url.hostname) {
        return
      }

      const hostname = event.url.hostname
      const id = event.url.searchParams.get('id')
      if (!id) {
        return
      }

      try {
        if (hostname.endsWith(RPC_REQ_SUFFIX)) {
          this.#handleRequest(event.url, event.message, id)
        }
        else if (hostname.endsWith(RPC_RES_SUFFIX)) {
          this.#handleResponse(id, event.message)
        }
      }
      catch (e) {
        this.#log.warn(`Unhandled error in RPC receive: ${e}`)
      }
    })
  }

  #handleRequest(url: BedrockURL, body: string, id: string): void {
    // Loopback: this is our own request bouncing back
    if (this.#sentIds.has(id)) {
      this.#sentIds.delete(id)
      return
    }

    const channel = url.pathname.slice(1)
    const handler = this.#handlers.get(channel)
    if (!handler) {
      return
    }

    const ns = url.hostname.slice(0, -RPC_REQ_SUFFIX.length)
    if (ns !== this.#options.namespace) {
      return
    }
    const data = body === '' ? undefined : JSON.parse(body)

    let result: unknown
    try {
      result = handler(data)
    }
    catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e)
      this.#sendResponse(ns, channel, id, { error: errMsg })
      return
    }

    if (result instanceof Promise) {
      result.then(
        (res) => {
          this.#sendResponse(ns, channel, id, { data: res })
        },
        (e) => {
          const errMsg = e instanceof Error ? e.message : String(e)
          this.#sendResponse(ns, channel, id, { error: errMsg })
        },
      )
    }
    else {
      this.#sendResponse(ns, channel, id, { data: result })
    }
  }

  #handleResponse(id: string, body: string): void {
    const pending = this.#pending.get(id)
    if (!pending) {
      return
    }

    this.#pending.delete(id)
    this.#sentIds.delete(id)
    if (pending.timer !== undefined) {
      system.clearRun(pending.timer)
    }

    try {
      const parsed = JSON.parse(body)
      if (parsed && typeof parsed === 'object' && 'error' in parsed) {
        pending.reject(new Error(parsed.error as string))
      }
      else {
        pending.resolve(parsed && 'data' in parsed ? parsed.data : undefined)
      }
    }
    catch {
      pending.reject(new Error('RPC: invalid response body'))
    }
  }

  #sendResponse(ns: string, method: string, id: string, payload: { data?: unknown, error?: string }): void {
    const baseUrl = `bedrock://${ns}${RPC_RES_SUFFIX}/${method}`
    const url = new BedrockURL(`${baseUrl}?v=${RPC_VERSION}&id=${id}`)
    this.#protocol.post(url.href, JSON.stringify(payload))
  }

  /**
   * Invoke a remote method. Returns a Promise that resolves with the result or rejects on error/timeout.
   * @param method - The method name to invoke
   * @param data - Optional payload to send
   * @param timeout - Optional timeout in ms (overrides the instance default)
   */
  invoke<T>(method: string, data?: unknown, timeout?: number): Promise<T> {
    if (this.#disposed) {
      throw new Error('RPC already disposed')
    }
    const id = unique()
    this.#sentIds.add(id)

    const effectiveTimeout = timeout ?? this.#options.timeout
    const body = data !== undefined ? JSON.stringify(data) : ''

    const ns = this.#options.namespace
    const baseUrl = `bedrock://${ns}${RPC_REQ_SUFFIX}/${method}`
    const url = new BedrockURL(`${baseUrl}?v=${RPC_VERSION}&id=${id}`)
    this.#protocol.post(url.href, body)

    return new Promise<T>((resolve, reject) => {
      const timer = effectiveTimeout > 0
        ? system.runTimeout(() => {
            this.#pending.delete(id)
            this.#sentIds.delete(id)
            reject(new Error(`RPC timeout: ${method} (${effectiveTimeout}ms)`))
          }, ms2ticks(effectiveTimeout))
        : undefined

      this.#pending.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timer,
      })
    })
  }

  /**
   * Register a handler for a remote method.
   * The handler can return a value or a Promise. If it throws, the error is sent back.
   * Returns an unsubscribe function.
   * @param method - The method name to handle
   * @param handler - Called with the deserialized payload data
   * @returns A function that unsubscribes this handler
   */
  handle<T>(method: string, handler: (data: T) => unknown | Promise<unknown>): () => void {
    if (this.#disposed) {
      throw new Error('RPC already disposed')
    }
    if (this.#handlers.has(method)) {
      this.#log.warn(`RPC handler already registered for method: ${method}, replacing`)
    }
    this.#handlers.set(method, handler as (data: unknown) => unknown | Promise<unknown>)
    return () => {
      this.#handlers.delete(method)
    }
  }

  once<T>(method: string, handler: (data: T) => unknown | Promise<unknown>): () => void {
    let off: () => void
    const wrapped = (data: T): unknown | Promise<unknown> => {
      off()
      return handler(data)
    }
    off = this.handle(method, wrapped)
    return off
  }

  /**
   * Destroy this RPC instance.
   * Unsubscribes from the protocol, clears all handlers, and rejects all pending invokes.
   */
  dispose(): void {
    if (this.#disposed) {
      return
    }
    this.#disposed = true
    this.#unsubscribe()
    this.#handlers.clear()
    for (const [id, pending] of this.#pending) {
      this.#sentIds.delete(id)
      if (pending.timer !== undefined) {
        system.clearRun(pending.timer)
      }
      pending.reject(new Error('RPC disposed'))
    }
    this.#pending.clear()
    this.#sentIds.clear()
  }
}

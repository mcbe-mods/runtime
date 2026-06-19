import type { ScriptEventCommandMessageAfterEvent, ScriptEventSource } from '@minecraft/server'
import { BedrockURL } from '@mcbe-mods/bedrock-url'
import { Log } from '@mcbe-mods/log'
import { system } from '@minecraft/server'

export interface ProtocolCipher {
  encrypt: (plaintext: string) => string
  decrypt: (ciphertext: string) => string
}

export interface ProtocolOptions {
  cipher?: ProtocolCipher
}

export interface BedrockReceiveEvent {
  url: BedrockURL
  message: string
  sourceType: ScriptEventSource
}

export class Protocol {
  readonly #log: Log
  readonly #subscriptions = new Set<(event: BedrockReceiveEvent) => void>()
  #listener: ((event: ScriptEventCommandMessageAfterEvent) => void) | null = null
  readonly #cipher?: ProtocolCipher

  constructor(options?: ProtocolOptions) {
    this.#log = new Log('Protocol')
    this.#cipher = options?.cipher
  }

  /**
   * Send a signal with an empty message body.
   * Use for notifications where no payload is needed.
   * @param url - Target URL as a string or BedrockURL
   */
  get(url: string | BedrockURL): void {
    const id = typeof url === 'string' ? url : url.toScriptEventId()
    system.sendScriptEvent(id, '')
  }

  /**
   * Send a message with a data payload.
   * If a cipher is configured, the message is automatically encrypted.
   * @param url - Target URL as a string or BedrockURL
   * @param message - The data to send
   */
  post(url: string | BedrockURL, message: string): void {
    const id = typeof url === 'string' ? url : url.toScriptEventId()
    system.sendScriptEvent(id, this.#cipher ? this.#cipher.encrypt(message) : message)
  }

  on(handler: (event: BedrockReceiveEvent) => void): () => void
  on(handler: (event: BedrockReceiveEvent) => void, options: { sourceType?: ScriptEventSource }): () => void
  on(handler: (event: BedrockReceiveEvent) => void, options?: { sourceType?: ScriptEventSource }): () => void {
    const wrapped = (event: BedrockReceiveEvent): void => {
      if (options?.sourceType && event.sourceType !== options.sourceType) {
        return
      }
      handler(event)
    }

    this.#subscriptions.add(wrapped)

    if (!this.#listener) {
      this.#listener = (event) => {
        let url: BedrockURL
        try {
          url = new BedrockURL(event.id)
        }
        catch {
          return
        }
        let message = event.message
        if (this.#cipher) {
          try {
            message = this.#cipher.decrypt(message)
          }
          catch {
            this.#log.warn('decryption failed, dropping message')
            return
          }
        }
        const receiveEvent: BedrockReceiveEvent = { url, message, sourceType: event.sourceType }
        for (const handler of this.#subscriptions) {
          try {
            handler(receiveEvent)
          }
          catch (e) {
            this.#log.warn('handler error:', e)
          }
        }
      }
      system.afterEvents.scriptEventReceive.subscribe(this.#listener!)
    }

    return () => {
      this.#subscriptions.delete(wrapped)
      if (this.#subscriptions.size === 0 && this.#listener) {
        system.afterEvents.scriptEventReceive.unsubscribe(this.#listener!)
        this.#listener = null
      }
    }
  }

  once(handler: (event: BedrockReceiveEvent) => void): () => void {
    let off: () => void
    const wrapped = (event: BedrockReceiveEvent): void => {
      off()
      handler(event)
    }
    off = this.on(wrapped)
    return off
  }

  dispose(): void {
    this.#subscriptions.clear()
    if (this.#listener) {
      system.afterEvents.scriptEventReceive.unsubscribe(this.#listener!)
      this.#listener = null
    }
  }
}

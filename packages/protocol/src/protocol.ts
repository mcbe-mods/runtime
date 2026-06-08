import type { ScriptEventCommandMessageAfterEvent, ScriptEventSource } from '@minecraft/server'
import { BedrockURL } from '@mcbe-mods/bedrock-url'
import { Log } from '@mcbe-mods/log'
import { system } from '@minecraft/server'

const log = new Log('Protocol')

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
  readonly #subscriptions = new Set<(event: BedrockReceiveEvent) => void>()
  #listener: ((event: ScriptEventCommandMessageAfterEvent) => void) | null = null
  readonly #cipher?: ProtocolCipher

  constructor(options?: ProtocolOptions) {
    this.#cipher = options?.cipher
  }

  get(url: string | BedrockURL): void {
    const id = typeof url === 'string' ? url : url.toScriptEventId()
    system.sendScriptEvent(id, '')
  }

  post(url: string | BedrockURL, message: string): void {
    const id = typeof url === 'string' ? url : url.toScriptEventId()
    system.sendScriptEvent(id, this.#cipher ? this.#cipher.encrypt(message) : message)
  }

  onReceive(handler: (event: BedrockReceiveEvent) => void): () => void {
    this.#subscriptions.add(handler)

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
            log.warn('decryption failed, dropping message')
            return
          }
        }
        const receiveEvent: BedrockReceiveEvent = { url, message, sourceType: event.sourceType }
        for (const handler of this.#subscriptions) {
          try {
            handler(receiveEvent)
          }
          catch (e) {
            log.warn('handler error:', e)
          }
        }
      }
      system.afterEvents.scriptEventReceive.subscribe(this.#listener!)
    }

    return () => {
      this.#subscriptions.delete(handler)
      if (this.#subscriptions.size === 0 && this.#listener) {
        system.afterEvents.scriptEventReceive.unsubscribe(this.#listener!)
        this.#listener = null
      }
    }
  }

  dispose(): void {
    this.#subscriptions.clear()
    if (this.#listener) {
      system.afterEvents.scriptEventReceive.unsubscribe(this.#listener!)
      this.#listener = null
    }
  }
}

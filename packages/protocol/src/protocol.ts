import type { ScriptEventCommandMessageAfterEvent, ScriptEventSource } from '@minecraft/server'
import { BedrockURL } from '@mcbe-mods/bedrock-url'
import { Log } from '@mcbe-mods/log'
import { system } from '@minecraft/server'

const log = new Log('Protocol')

export interface BedrockReceiveEvent {
  url: BedrockURL
  message: string
  sourceType: ScriptEventSource
}

export class Protocol {
  readonly #subscriptions = new Set<(event: BedrockReceiveEvent) => void>()
  #listener: ((event: ScriptEventCommandMessageAfterEvent) => void) | null = null

  get(url: string | BedrockURL): void {
    const id = typeof url === 'string' ? url : url.toScriptEventId()
    system.sendScriptEvent(id, '')
  }

  post(url: string | BedrockURL, message: string): void {
    const id = typeof url === 'string' ? url : url.toScriptEventId()
    system.sendScriptEvent(id, message)
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
        const receiveEvent: BedrockReceiveEvent = { url, message: event.message, sourceType: event.sourceType }
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

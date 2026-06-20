import { vi } from 'vitest'

const scriptEventListeners = new Set<(event: { id: string, message: string, sourceType: string }) => void>()

vi.mock('@minecraft/server', () => ({
  system: {
    sendScriptEvent: vi.fn(),
    afterEvents: {
      scriptEventReceive: {
        subscribe: vi.fn((callback: (event: any) => void) => {
          scriptEventListeners.add(callback)
        }),
        unsubscribe: vi.fn((callback: (event: any) => void) => {
          scriptEventListeners.delete(callback)
        }),
      },
    },
  },
  ScriptEventSource: {
    Server: 'Server',
    Entity: 'Entity',
  },
}))

export function clearListeners(): void {
  scriptEventListeners.clear()
}

export function simulateReceive(urlStr: string, message: string, sourceType = 'Server'): void {
  for (const cb of scriptEventListeners) {
    cb({ id: urlStr, message, sourceType })
  }
}

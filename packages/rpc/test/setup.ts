import { vi } from 'vitest'

export const ScriptEventSource = {
  Server: 'Server',
  Entity: 'Entity',
  Block: 'Block',
  Command: 'Command',
} as const

interface MockEvent { id: string, message: string, sourceType: string }

const scriptEventListeners = new Set<(event: MockEvent) => void>()

export const mockScriptEvent = {
  send: vi.fn(),
  listeners: scriptEventListeners,
  simulateReceive(id: string, message: string, sourceType: string = ScriptEventSource.Server) {
    for (const cb of scriptEventListeners) {
      cb({ id, message, sourceType })
    }
  },
}

const timeoutCallbacks = new Map<number, () => void>()
let timeoutId = 0

export function advanceTimeouts(): void {
  const callbacks = [...timeoutCallbacks.values()]
  timeoutCallbacks.clear()
  for (const cb of callbacks) {
    cb()
  }
}

vi.mock('@minecraft/server', () => ({
  ScriptEventSource,
  system: {
    sendScriptEvent: vi.fn((id: string, message: string) => {
      mockScriptEvent.send(id, message)
    }),
    runTimeout: vi.fn((callback: () => void) => {
      const id = ++timeoutId
      timeoutCallbacks.set(id, callback)
      return id
    }),
    clearRun: vi.fn((id: number) => {
      timeoutCallbacks.delete(id)
    }),
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
}))

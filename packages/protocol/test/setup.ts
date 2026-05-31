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

vi.mock('@minecraft/server', () => ({
  ScriptEventSource,
  system: {
    sendScriptEvent: vi.fn((id: string, message: string) => {
      mockScriptEvent.send(id, message)
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

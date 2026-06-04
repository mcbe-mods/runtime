import { vi } from 'vitest'

const scriptEventListeners = new Set<(event: { id: string, message: string, sourceType: string }) => void>()

const mockSend = vi.fn((id: string, message: string) => {
  for (const cb of scriptEventListeners) {
    cb({ id, message, sourceType: 'Server' })
  }
})

vi.mock('@minecraft/server', () => ({
  system: {
    sendScriptEvent: mockSend,
    runTimeout: vi.fn(),
    runInterval: vi.fn((callback: () => void, _tickPeriod: number) => {
      return Number(setInterval(callback, _tickPeriod * 50))
    }),
    clearRun: vi.fn((id: number) => {
      clearInterval(id)
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
  ScriptEventSource: {
    Server: 'Server',
    Entity: 'Entity',
  },
}))

export { mockSend, scriptEventListeners }

import { vi } from 'vitest'

vi.mock('@minecraft/server', () => ({
  system: {
    sendScriptEvent: vi.fn(),
    runTimeout: vi.fn(() => 0),
    clearRun: vi.fn(),
    afterEvents: {
      scriptEventReceive: {
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
      },
    },
  },
  ScriptEventSource: {
    Server: 'Server',
  },
}))

vi.mock('@mcbe-mods/utils', () => ({
  calcGameTicks: vi.fn((ms: number) => Math.ceil(ms / 50)),
}))

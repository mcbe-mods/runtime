import { readFileSync } from 'node:fs'
import { system } from '@minecraft/server'
import { bench, describe, vi } from 'vitest'
import { IPC } from '../src/ipc'
import { simulateReceive } from './setup'

const DIST = readFileSync(new URL('../dist/index.mjs', import.meta.url), 'utf-8')
const SMALL = DIST.slice(0, 500)
const MEDIUM = DIST.slice(0, 5_000)
const LARGE = DIST

describe('IPC.send — fire-and-forget', () => {
  const ipc = new IPC({ namespace: 'bench' })

  bench('small (500 B — no compress, no chunk)', () => {
    vi.mocked(system.sendScriptEvent).mockClear()
    ipc.send('e', SMALL)
  })

  bench('medium (5 KB — compress, maybe no chunk if compressed < 1800)', () => {
    vi.mocked(system.sendScriptEvent).mockClear()
    ipc.send('e', MEDIUM)
  })

  bench('large (26 KB — compress + chunked)', () => {
    vi.mocked(system.sendScriptEvent).mockClear()
    ipc.send('e', LARGE)
  })
})

describe('IPC.on — handler registration', () => {
  const ipc = new IPC({ namespace: 'handlers' })

  bench('register 100 handlers', () => {
    const offs: (() => void)[] = []
    for (let i = 0; i < 100; i++) {
      offs.push(ipc.on(`c${i}`, () => {}))
    }
    for (const off of offs) {
      off()
    }
  })
})

describe('IPC.send + on — full cycle', () => {
  const ipc = new IPC({ namespace: 'cycle' })
  ipc.on('e', () => {})

  bench('small — send then simulate receive', () => {
    vi.mocked(system.sendScriptEvent).mockClear()
    ipc.send('e', SMALL)
    const url = vi.mocked(system.sendScriptEvent).mock.calls[0][0] as string
    const payload = vi.mocked(system.sendScriptEvent).mock.calls[0][1] as string
    simulateReceive(url, payload)
  })
})

describe('compression ratio — payload size comparison', () => {
  const ns = 'ratio'
  const ipc = new IPC({ namespace: ns })

  bench('raw JSON vs compressed — small (500 B)', () => {
    vi.mocked(system.sendScriptEvent).mockClear()
    ipc.send('e', SMALL)
    const raw = JSON.stringify(SMALL)
    const sent = vi.mocked(system.sendScriptEvent).mock.calls[0][1] as string
    JSON.stringify({ raw: raw.length, sent: sent.length })
  })

  bench('raw JSON vs compressed — medium (5 KB)', () => {
    vi.mocked(system.sendScriptEvent).mockClear()
    ipc.send('e', MEDIUM)
    const raw = JSON.stringify(MEDIUM)
    const calls = vi.mocked(system.sendScriptEvent).mock.calls
    let sentLen = 0
    for (const [, payload] of calls) {
      sentLen += (payload as string).length
    }
    JSON.stringify({ raw: raw.length, sent: sentLen })
  })

  bench('raw JSON vs compressed — large (26 KB)', () => {
    vi.mocked(system.sendScriptEvent).mockClear()
    ipc.send('e', LARGE)
    const raw = JSON.stringify(LARGE)
    const calls = vi.mocked(system.sendScriptEvent).mock.calls
    let sentLen = 0
    for (const [, payload] of calls) {
      sentLen += (payload as string).length
    }
    JSON.stringify({ raw: raw.length, sent: sentLen })
  })
})

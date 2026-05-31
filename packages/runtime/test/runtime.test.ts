import { describe, expect, it } from 'vitest'
import {
  BedrockURL,
  Chunker,
  Compressor,
  EVENTS,
  IPC,
  Log,
  Protocol,
  PROTOCOL_VERSION,
  RPC,
  URLSearchParams,
} from '../src/index'

describe('@mcbe-mods/runtime', () => {
  it('re-exports bedrock-url', () => {
    expect(BedrockURL).toBeDefined()
    expect(URLSearchParams).toBeDefined()
  })

  it('re-exports ipc', () => {
    expect(IPC).toBeDefined()
    expect(EVENTS).toBeDefined()
    expect(Chunker).toBeDefined()
    expect(Compressor).toBeDefined()
    expect(PROTOCOL_VERSION).toBeDefined()
  })

  it('re-exports log', () => {
    expect(Log).toBeDefined()
  })

  it('re-exports protocol', () => {
    expect(Protocol).toBeDefined()
  })

  it('re-exports rpc', () => {
    expect(RPC).toBeDefined()
  })
})

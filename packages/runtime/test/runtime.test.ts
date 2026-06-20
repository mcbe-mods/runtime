import { describe, expect, it } from 'vitest'
import {
  Base64,
  BedrockURL,
  Chunker,
  Cipher,
  Color,
  Compressor,
  Discover,
  EVENTS,
  Experience,
  getCubeRange,
  getRandomProbability,
  getRandomRangeValue,
  getSphereRange,
  IPC,
  Log,
  ms2ticks,
  Protocol,
  PROTOCOL_VERSION,
  RPC,
  splitGroups,
  unique,
  URLSearchParams,
  utf8Decode,
  utf8Encode,
} from '../src/index'

describe('@mcbe-mods/runtime', () => {
  it('re-exports bedrock-url', () => {
    expect(BedrockURL).toBeDefined()
    expect(URLSearchParams).toBeDefined()
  })

  it('re-exports compress', () => {
    expect(Compressor).toBeDefined()
  })

  it('re-exports crypto', () => {
    expect(Cipher).toBeDefined()
  })

  it('re-exports ipc', () => {
    expect(IPC).toBeDefined()
    expect(EVENTS).toBeDefined()
    expect(Chunker).toBeDefined()
    expect(PROTOCOL_VERSION).toBeDefined()
  })

  it('re-exports log', () => {
    expect(Log).toBeDefined()
  })

  it('re-exports protocol', () => {
    expect(Protocol).toBeDefined()
  })

  it('re-exports discover', () => {
    expect(Discover).toBeDefined()
  })

  it('re-exports rpc', () => {
    expect(RPC).toBeDefined()
  })

  it('re-exports utils', () => {
    expect(Base64).toBeDefined()
    expect(Color).toBeDefined()
    expect(Experience).toBeDefined()
    expect(getCubeRange).toBeDefined()
    expect(getRandomProbability).toBeDefined()
    expect(getRandomRangeValue).toBeDefined()
    expect(getSphereRange).toBeDefined()
    expect(ms2ticks).toBeDefined()
    expect(splitGroups).toBeDefined()
    expect(unique).toBeDefined()
    expect(utf8Decode).toBeDefined()
    expect(utf8Encode).toBeDefined()
  })
})

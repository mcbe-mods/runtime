import { describe, expect, it } from 'vitest'
import { Chunker } from '../src/chunk'

describe('Chunker', () => {
  it('splits data into multiple chunks', () => {
    const chunker = new Chunker(10)
    const data = 'A'.repeat(25)
    const chunks = chunker.split(data)

    expect(chunks.length).toBe(3)
    expect(chunks[0].seq).toBe(0)
    expect(chunks[0].total).toBe(3)
    expect(chunks[0].data.length).toBe(10)
  })

  it('single chunk for small data', () => {
    const chunker = new Chunker(100)
    const chunks = chunker.split('hello')
    expect(chunks.length).toBe(1)
    expect(chunks[0].seq).toBe(0)
    expect(chunks[0].total).toBe(1)
  })

  it('assembles chunks in order', () => {
    const chunker = new Chunker(5)
    const original = 'HelloWorldExtra'
    const chunks = chunker.split(original)

    expect(chunks.length).toBe(3)

    const r1 = chunker.assemble('pkt1', chunks[0].seq, chunks[0].total, chunks[0].data, false)
    expect(r1.done).toBe(false)

    const r2 = chunker.assemble('pkt1', chunks[1].seq, chunks[1].total, chunks[1].data, false)
    expect(r2.done).toBe(false)

    const r3 = chunker.assemble('pkt1', chunks[2].seq, chunks[2].total, chunks[2].data, false)
    expect(r3.done).toBe(true)
    if (r3.done) {
      expect(r3.data).toBe(original)
      expect(r3.compressed).toBe(false)
    }
  })

  it('handles out-of-order chunks', () => {
    const chunker = new Chunker(5)
    const original = 'HelloWorldEx'
    const chunks = chunker.split(original)

    expect(chunks.length).toBe(3)

    chunker.assemble('pkt2', chunks[2].seq, chunks[2].total, chunks[2].data, false)
    chunker.assemble('pkt2', chunks[0].seq, chunks[0].total, chunks[0].data, false)
    const r = chunker.assemble('pkt2', chunks[1].seq, chunks[1].total, chunks[1].data, false)

    expect(r.done).toBe(true)
    if (r.done) {
      expect(r.data).toBe(original)
    }
  })

  it('ignores duplicate chunks', () => {
    const chunker = new Chunker(5)
    const original = 'HelloWorldEx'
    const chunks = chunker.split(original)

    expect(chunks.length).toBe(3)

    chunker.assemble('pkt3', chunks[0].seq, chunks[0].total, chunks[0].data, false)
    const r1 = chunker.assemble('pkt3', chunks[0].seq, chunks[0].total, chunks[0].data, false)
    expect(r1.done).toBe(false)

    chunker.assemble('pkt3', chunks[1].seq, chunks[1].total, chunks[1].data, false)
    const r2 = chunker.assemble('pkt3', chunks[2].seq, chunks[2].total, chunks[2].data, false)
    expect(r2.done).toBe(true)
    if (r2.done) {
      expect(r2.data).toBe(original)
    }
  })

  it('compressed flag is preserved during assemble', () => {
    const chunker = new Chunker(100)
    const r = chunker.assemble('pkt5', 0, 1, 'compressed-data', true)
    expect(r.done).toBe(true)
    if (r.done) {
      expect(r.compressed).toBe(true)
    }
  })

  it('returns false for chunk with t <= 0', () => {
    const chunker = new Chunker(10)
    const r = chunker.assemble('bad', 0, 0, 'data', false)
    expect(r.done).toBe(false)
  })
})

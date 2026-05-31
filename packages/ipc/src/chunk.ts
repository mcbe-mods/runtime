interface PendingPacket {
  fragments: string[]
  received: number
  total: number
  compressed: boolean
  timestamp: number
}

/**
 * Splits large serialized payloads into smaller chunks and reassembles them on the receiving end.
 * Used internally by {@link IPC} — you typically don't need to interact with this class directly.
 */
export class Chunker {
  readonly #chunkSize: number
  readonly #buffer = new Map<string, PendingPacket>()

  /**
   * @param chunkSize - Maximum characters per chunk
   */
  constructor(chunkSize: number) {
    this.#chunkSize = chunkSize
  }

  /**
   * Split a serialized string into ordered chunks for transport.
   * @param data - The serialized string to split
   * @returns An array of chunk payloads (seq, total, data)
   */
  split(data: string): Array<{ seq: number, total: number, data: string }> {
    const chunks: Array<{ seq: number, total: number, data: string }> = []
    const total = Math.ceil(data.length / this.#chunkSize)

    for (let i = 0; i < total; i++) {
      chunks.push({
        seq: i,
        total,
        data: data.slice(i * this.#chunkSize, (i + 1) * this.#chunkSize),
      })
    }

    return chunks
  }

  /**
   * Feed a received chunk fragment to the reassembly buffer.
   * @param id - Unique identifier shared by all chunks of this payload
   * @param seq - Zero-based index of this fragment
   * @param total - Total number of fragments expected
   * @param data - The raw data slice for this fragment
   * @param compressed - Whether the reassembled payload is compressed
   * @param maxAge - Discard pending packets older than this many ms (0 = no timeout)
   */
  assemble(
    id: string,
    seq: number,
    total: number,
    data: string,
    compressed: boolean,
    maxAge = 0,
  ): { done: false } | { done: true, data: string, compressed: boolean } {
    if (total <= 0) {
      return { done: false }
    }

    if (maxAge > 0) {
      const cutoff = Date.now() - maxAge
      for (const [key, p] of this.#buffer) {
        if (p.timestamp < cutoff) {
          this.#buffer.delete(key)
        }
      }
    }

    let pending = this.#buffer.get(id)

    if (!pending) {
      pending = {
        fragments: [],
        received: 0,
        total,
        compressed,
        timestamp: Date.now(),
      }
      this.#buffer.set(id, pending)
    }

    if (pending.fragments[seq] !== undefined) {
      return { done: false }
    }

    pending.fragments[seq] = data
    pending.received++

    if (pending.received === pending.total) {
      this.#buffer.delete(id)
      return { done: true, data: pending.fragments.join(''), compressed: pending.compressed }
    }

    return { done: false }
  }

  /** Number of packets currently being reassembled */
  get pendingCount(): number {
    return this.#buffer.size
  }
}

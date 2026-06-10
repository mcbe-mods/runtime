import { Base64, utf8Decode, utf8Encode } from '@mcbe-mods/utils'
import { deflateSync, inflateSync } from 'fflate'

/**
 * Applies deflate compression to payloads exceeding a size threshold.
 * Used internally by {@link IPC} — you typically don't need to interact with this class directly.
 */
export class Compressor {
  readonly #threshold: number

  /**
   * @param threshold - Payloads longer than this will be considered for compression
   */
  constructor(threshold: number) {
    this.#threshold = threshold
  }

  /**
   * Compress data if it exceeds the threshold and compression is beneficial.
   * Returns the wire-ready string (base64 if compressed, original if not).
   */
  compress(data: string): { value: string, compressed: boolean } {
    if (data.length <= this.#threshold) {
      return { value: data, compressed: false }
    }

    const deflated = deflateSync(utf8Encode(data))
    if (deflated.length >= data.length) {
      return { value: data, compressed: false }
    }

    return { value: Base64.fromBytes(deflated), compressed: true }
  }

  /**
   * Decompress data that was previously compressed.
   */
  decompress(data: string, compressed: boolean): string {
    if (!compressed) {
      return data
    }
    const bytes = Base64.toBytes(data)
    return utf8Decode(inflateSync(bytes))
  }
}

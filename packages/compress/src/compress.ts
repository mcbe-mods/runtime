import { Base64, utf8Decode, utf8Encode } from '@mcbe-mods/utils'
import { deflateSync, inflateSync } from 'fflate/browser'

export class Compressor {
  /**
   * Compress a string using deflate compression.
   * @param data - The string to compress
   * @returns The compressed data as a base64-encoded string
   * @throws {Error} If compression fails
   */
  compress(data: string): string {
    return Base64.fromBytes(deflateSync(utf8Encode(data)))
  }

  /**
   * Decompress a base64-encoded deflate-compressed string.
   * @param data - The base64-encoded compressed data
   * @returns The original decompressed string
   * @throws {Error} If the data is not valid compressed data
   */
  decompress(data: string): string {
    return utf8Decode(inflateSync(Base64.toBytes(data)))
  }
}
